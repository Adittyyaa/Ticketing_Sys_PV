import { NextRequest, NextResponse } from 'next/server'
import { login, createSession, destroySession } from '@/lib/auth'
import type { LoginCredentials } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json()

    if (!credentials.email || !credentials.password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const authResult = await login(credentials)

    if (!authResult) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const role = authResult.user.role?.toLowerCase().trim()

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 403 })
    }

    // Create session cookie
    const sessionToken = await createSession(authResult.user)

    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        full_name: authResult.user.full_name,
        role: role,
      },
      token: sessionToken
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: true }) // Still return success for logout
  }
}