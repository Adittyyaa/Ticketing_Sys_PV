import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized - missing auth token' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: { user: requestingUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !requestingUser) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { data: requestingUserData } = await supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (requestingUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 })
    }

    const { email, password, fullName, role } = await request.json()

    if (!email || !password || !fullName) {
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

    if (fullName.length < 2 || fullName.length > 255) {
      return NextResponse.json({ error: 'Full name must be between 2 and 255 characters' }, { status: 400 })
    }

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json({ error: 'Role must be either "user" or "admin"' }, { status: 400 })
    }

    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const existingAuthUser = existingAuthUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (existingAuthUser) {
      const { data: existingProfile } = await supabaseAdmin
        .from('tbl_users')
        .select('id, created_at')
        .eq('id', existingAuthUser.id)
        .maybeSingle()

      const { error: upsertErr } = await supabaseAdmin
        .from('tbl_users')
        .upsert({
          id: existingAuthUser.id,
          email,
          full_name: fullName,
          role,
          created_at: existingProfile?.created_at || new Date().toISOString(),
        }, { onConflict: 'id' })
      
      if (upsertErr) throw new Error(upsertErr.message)
      
      return NextResponse.json({ success: true, userId: existingAuthUser.id, message: `${role === 'admin' ? 'Admin' : 'User'} profile updated successfully` })
    }

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authErr) throw new Error(authErr.message)

    if (authData.user) {
      const { error: profileErr } = await supabaseAdmin
        .from('tbl_users')
        .upsert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          created_at: new Date().toISOString(),
        }, { onConflict: 'id' })

      if (profileErr) throw new Error(profileErr.message)
    }

    return NextResponse.json({ success: true, userId: authData.user.id, message: `${role === 'admin' ? 'Admin' : 'User'} created successfully` })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 400 }
    )
  }
}