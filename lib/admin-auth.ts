import { NextRequest } from 'next/server'
import { verifyToken, getUserById } from './auth'

type AuthenticatedRequestResult =
  | { error: string; status: 401 | 403 | 500; userId: null; role: null }
  | { error: null; status: 200; userId: string; role: string | null }

type AdminAuthResult =
  | { error: string; status: 401 | 403 | 500; userId: null }
  | { error: null; status: 200; userId: string }

export async function verifyAuthenticatedRequest(request: NextRequest): Promise<AuthenticatedRequestResult> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401, userId: null, role: null }
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const decoded = await verifyToken(token)

  if (!decoded) {
    return { error: 'Invalid token', status: 401, userId: null, role: null }
  }

  const user = await getUserById(decoded.userId)
  if (!user) {
    return { error: 'User not found', status: 401, userId: null, role: null }
  }

  return { error: null, status: 200, userId: decoded.userId, role: (user.role as string) || null }
}

export async function verifyAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return { error: auth.error, status: auth.status, userId: null }
  }

  if (auth.role !== 'admin') {
    return { error: 'Admin access required', status: 403, userId: null }
  }

  return { error: null, status: 200, userId: auth.userId }
}