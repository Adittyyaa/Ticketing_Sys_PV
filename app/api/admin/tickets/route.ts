import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error || !auth.supabaseAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const supabaseAdmin = auth.supabaseAdmin
    const search = request.nextUrl.searchParams.get('search')?.trim() || ''

    let query = supabaseAdmin
      .from('tbl_tickets')
      .select(`
        *,
        creator:tbl_users!user_id(email, full_name),
        assigned_user:tbl_users!assigned_to(email, full_name)
      `)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('title', `%${search.replace(/[%;]/g, '').substring(0, 100)}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ tickets: data || [] })
  } catch (error) {
    console.error('Admin tickets fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
