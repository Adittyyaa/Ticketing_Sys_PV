import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    // Use service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Create auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
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
          },
        ])

      if (profileErr) throw new Error(profileErr.message)
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 400 }
    )
  }
}
