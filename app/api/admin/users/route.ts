import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { hashPassword, getUserByEmail } from '@/lib/auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await query('SELECT id, email, full_name, role, created_at FROM tbl_users ORDER BY created_at DESC')
    return NextResponse.json({ users: result.rows || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { email, password, full_name, role } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 })
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain uppercase letter' }, { status: 400 })
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain number' }, { status: 400 })
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password must contain special character' }, { status: 400 })
    }

    if (full_name.length < 2 || full_name.length > 255) {
      return NextResponse.json({ error: 'Full name must be between 2 and 255 characters' }, { status: 400 })
    }

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Role must be either "user" or "admin"' }, { status: 400 })
    }

    const existingUser = await getUserByEmail(email)

    if (existingUser) {
      await query(
        'UPDATE tbl_users SET full_name = $1, role = $2, updated_at = NOW() WHERE id = $3 RETURNING id',
        [full_name, role, existingUser.id]
      )
      return NextResponse.json({ success: true, userId: existingUser.id, message: `${role === 'admin' ? 'Admin' : 'User'} profile updated successfully` })
    }

    const hashedPassword = await hashPassword(password)

    const result = await query(
      'INSERT INTO tbl_users (email, password, full_name, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [email, hashedPassword, full_name, role]
    )

    return NextResponse.json({ success: true, userId: result.rows[0].id, message: `${role === 'admin' ? 'Admin' : 'User'} created successfully` })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 400 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id, role } = await request.json()
    if (!id || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    await query(
      'UPDATE tbl_users SET role = $1 WHERE id = $2 RETURNING id',
      [role, id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const result = await query('DELETE FROM tbl_users WHERE id = $1 RETURNING id', [id])
    return NextResponse.json({ success: true, deleted: (result.rowCount || 0) > 0 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}