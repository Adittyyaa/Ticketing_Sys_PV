import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { userService } from './userService.js'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
)
const JWT_EXPIRES_IN = '7d' // 7 days

class AuthService {
 
  async hashPassword(password) {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash)
  }

  
  async createToken(userId, role) {
    return new SignJWT({ 
      userId, 
      role,
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(JWT_SECRET)
  }

  async verifyToken(token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      return null
    }
  }

  getAuthToken(authHeader) {
    if (!authHeader) {
      return null
    }


    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }

    return null
  }

  async validateAuthToken(authHeader) {
    const token = this.getAuthToken(authHeader)
    if (!token) {
      return null
    }

    const payload = await this.verifyToken(token)
    if (!payload?.userId) {
      return null
    }

    const user = await userService.getUserById(payload.userId)
    if (!user) {
      return null
    }

    // Remove password hash from response
    const { password_hash: _, ...safeUser } = user
    return safeUser
  }

  // ============================================
  // AUTHENTICATION OPERATIONS
  // ============================================

  async login(credentials) {
    try {
      const user = await userService.getUserByEmail(credentials.email)
      if (!user || !user.password_hash) {
        return null
      }

      const isValidPassword = await this.verifyPassword(credentials.password, user.password_hash)
      if (!isValidPassword) {
        return null
      }

      // Update last login
      await userService.updateLastLogin(user.id)

      const token = await this.createToken(user.id, user.role)
      
      // Remove password hash from response
      const { password_hash: _, ...safeUser } = user
      
      return {
        user: {
          id: safeUser.id,
          email: safeUser.email,
          full_name: safeUser.full_name,
          role: safeUser.role
        },
        token
      }
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await userService.getUserByEmail(userData.email)
      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password)

      // Create user
      const newUser = await userService.createUser({
        ...userData,
        password_hash: hashedPassword
      })

      // Generate token
      const token = await this.createToken(newUser.id, newUser.role)

      // Remove password hash from response
      const { password_hash: _, ...safeUser } = newUser

      return {
        user: safeUser,
        token
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await userService.getUserById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash)
      if (!isValidPassword) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword)

      // Update password
      await userService.updatePassword(userId, hashedPassword)

      return true
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  // ============================================
  // PASSWORD RESET
  // ============================================

  async generateResetToken(email) {
    const user = await userService.getUserByEmail(email)
    if (!user) {
      return null
    }

    // Create a short-lived reset token (1 hour)
    const resetToken = await new SignJWT({ 
      userId: user.id, 
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET)

    return resetToken
  }

  async verifyResetToken(token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const { userId, type } = payload
      
      if (type !== 'password_reset') {
        return null
      }
      
      return userId
    } catch (error) {
      console.error('Reset token verification failed:', error)
      return null
    }
  }

  async resetPassword(resetToken, newPassword) {
    try {
      const userId = await this.verifyResetToken(resetToken)
      if (!userId) {
        throw new Error('Invalid or expired reset token')
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword)

      // Update password
      await userService.updatePassword(userId, hashedPassword)

      return true
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }
}

export const authService = new AuthService()