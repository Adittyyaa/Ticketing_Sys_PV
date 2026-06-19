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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error || !auth.supabaseAdmin || !auth.userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const supabaseAdmin = auth.supabaseAdmin
    const { id } = await params

    let query = supabaseAdmin
      .from('tbl_tickets')
      .select(ticketColumns)
      .eq('id', id)

    const { data: userData } = await supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', auth.userId)
      .single()

    if (userData?.role !== 'admin') {
      query = query.eq('user_id', auth.userId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error('Ticket fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}
