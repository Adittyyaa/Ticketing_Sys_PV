import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'

const ticketColumns = `
  id,
  number,
  user_id,
  title,
  description,
  category,
  type,
  product_reference_number,
  priority,
  status,
  tags,
  assigned_to,
  created_at,
  updated_at
`

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error || !auth.supabaseAdmin || !auth.userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const supabaseAdmin = auth.supabaseAdmin
    const search = request.nextUrl.searchParams.get('search')?.trim() || ''

    let query = supabaseAdmin
      .from('tbl_tickets')
      .select(ticketColumns)
      .order('created_at', { ascending: false })

    const { data: userData } = await supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', auth.userId)
      .single()

    if (userData?.role !== 'admin') {
      query = query.eq('user_id', auth.userId)
    }

    if (search) {
      query = query.ilike('title', `%${search.replace(/[%;]/g, '').substring(0, 100)}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ tickets: data || [] })
  } catch (error) {
    console.error('Tickets fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}
