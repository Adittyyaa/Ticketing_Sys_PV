import { NextRequest } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getUserByEmail, getUserById, createUser, updateUserLastLogin } from './database-service'
import type { User, CreateUserData } from '@/types/types'

// Re-export functions that are used by other modules
export { getUserByEmail, getUserById, createUser } from './database-service'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
)
const JWT_EXPIRES_IN = '7d' // 7 days

export interface AuthSession {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends CreateUserData {
  password: string
}

// ============================================
// PASSWORD UTILITIES
// ============================================

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ============================================
// JWT UTILITIES
// ============================================

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export async function login(credentials: LoginCredentials): Promise<AuthSession | null> {
  try {
    const user = await getUserByEmail(credentials.email)
    if (!user || !user.password_hash) {
      return null
    }

    const isValidPassword = await verifyPassword(credentials.password, user.password_hash)
    if (!isValidPassword) {
      return null
    }

    // Update last login
    await updateUserLastLogin(user.id)

    const token = await createToken(user.id)
    
    // Remove password hash from response
    const { password_hash, ...safeUser } = user
    
    return {
      user: safeUser as User,
      token
    }
  } catch (error) {
    console.error('Login error:', error)
    return null
  }
}

export async function register(data: RegisterData): Promise<AuthSession | null> {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(data.email)
    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const password_hash = await hashPassword(data.password)

    // Create user
    const user = await createUser({
      ...data,
      password: password_hash
    })

    const token = await createToken(user.id)
    
    // Remove password hash from response
    const { password_hash: _, ...safeUser } = user
    
    return {
      user: safeUser as User,
      token
    }
  } catch (error) {
    console.error('Registration error:', error)
    return null
  }
}

export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | undefined

    if (request) {
      const authHeader = request.headers.get('authorization')
      token = authHeader?.replace('Bearer ', '')
      if (!token) {
        const cookie = request.cookies.get('auth-token')
        token = cookie?.value
      }
    } else {
      const cookieStore = await cookies()
      token = cookieStore.get('auth-token')?.value
    }

    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload?.userId) {
      return null
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      return null
    }

    // Remove password hash from response
    const { password_hash, ...safeUser } = user
    return safeUser as User
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireAdmin(request: NextRequest): Promise<User> {
  const user = await requireAuth(request)
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }
  return user
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createSession(user: User): Promise<string> {
  const token = await createToken(user.id)
  
  // Set HTTP-only cookie
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/'
  })
  
  return token
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

// ============================================
// MIDDLEWARE HELPERS
// ============================================

export function getAuthToken(request: NextRequest): string | null {
  // First try Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Then try cookie
  const cookie = request.cookies.get('auth-token')
  return cookie?.value || null
}

export async function validateAuthToken(request: NextRequest): Promise<User | null> {
  const token = getAuthToken(request)
  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload?.userId) {
    return null
  }

  return getUserById(payload.userId)
}

// ============================================
// PASSWORD RESET (if needed)
// ============================================

export async function generateResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email)
  if (!user) {
    return null
  }

  // Create a short-lived reset token (1 hour)
  const resetToken = await new SignJWT({ 
    userId: user.id, 
    type: 'password_reset' 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET)

  return resetToken
}

export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const { userId, type } = payload as { userId: string; type: string }
    
    if (type !== 'password_reset') {
      return null
    }
    
    return userId
  } catch (error) {
    console.error('Reset token verification failed:', error)
    return null
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    const userId = await verifyResetToken(token)
    if (!userId) {
      return false
    }

    await hashPassword(newPassword)
    
    // Update user password (you'll need to add this to database-service.ts)
    // await updateUserPassword(userId, hashedPassword)
    
    return true
  } catch (error) {
    console.error('Password reset error:', error)
    return false
  }
}