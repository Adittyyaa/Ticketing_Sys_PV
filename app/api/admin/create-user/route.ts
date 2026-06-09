import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    // CRITICAL FIX: Add authentication check
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - missing auth token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Verify the token and check if user is admin
    const { data: { user: requestingUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !requestingUser) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: requestingUserData } = await supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (requestingUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 })
    }

    const { email, password, fullName } = await request.json()

    // Input validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain uppercase letter' },
        { status: 400 }
      )
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain number' },
        { status: 400 }
      )
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain special character' },
        { status: 400 }
      )
    }

    // Validate full name
    if (fullName.length < 2 || fullName.length > 255) {
      return NextResponse.json(
        { error: 'Full name must be between 2 and 255 characters' },
        { status: 400 }
      )
    }

    // Create auth user WITH email already confirmed (admin-created users)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: { full_name: fullName },
    })

    if (authErr) throw new Error(authErr.message)

    // Create user profile
    if (authData.user) {
      const { error: profileErr } = await supabaseAdmin
        .from('tbl_users')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
            role: 'user',
            created_at: new Date().toISOString(),
          },
        ])

      if (profileErr) throw new Error(profileErr.message)
    }

    return NextResponse.json({ success: true, userId: authData.user.id, message: 'User created successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 400 }
    )
  }
}
