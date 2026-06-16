import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
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

    // Verify the requester is an admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Verify the token and check if user is admin
    const { data: { user: requestingUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !requestingUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: requestingUserData } = await supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (requestingUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create admin accounts' }, { status: 403 })
    }

    // Create auth user WITH email already confirmed (admin-created admins)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created accounts
      user_metadata: { full_name: fullName },
    })

    // If user already exists in auth, just update their role
    if (authErr?.message?.includes('duplicate key') || authErr?.message?.includes('already exists')) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const existingUser = existingUsers?.users?.find(u => u.email === email)
      
      if (existingUser) {
        // Update to admin role
        const { error: updateErr } = await supabaseAdmin
          .from('tbl_users')
          .update({ role: 'admin', full_name: fullName })
          .eq('id', existingUser.id)
        
        if (updateErr) throw new Error(updateErr.message)
        
        return NextResponse.json({ 
          success: true, 
          userId: existingUser.id,
          message: 'User updated to admin successfully'
        })
      }
      throw new Error(authErr.message)
    }

    if (authErr) throw new Error(authErr.message)

    // Create admin user profile
    if (authData.user) {
      const { error: profileErr } = await supabaseAdmin
        .from('tbl_users')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
            role: 'admin', // Set as admin
            created_at: new Date().toISOString(),
          },
        ])

      if (profileErr) {
        // Rollback: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw new Error(profileErr.message)
      }
    }

    return NextResponse.json({ 
      success: true, 
      userId: authData.user.id,
      message: 'Admin account created successfully'
    })
  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create admin account' },
      { status: 400 }
    )
  }
}
