import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get current session
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    }

    // Get user from token
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid token', details: authError }, { status: 401 })
    }

    // Get user from database
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('tbl_users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    return NextResponse.json({
      authUser: {
        id: authUser.id,
        email: authUser.email,
      },
      dbUser: dbUser || null,
      dbError: dbError?.message || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
