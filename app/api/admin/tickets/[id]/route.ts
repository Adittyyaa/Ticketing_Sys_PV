import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { verifyAdminRequest } from '@/lib/admin-auth'

type TicketUser = {
  id: string
  email: string
  full_name?: string | null
}

type HydratedTicket = {
  id: string
  user_id: string
  assigned_to?: string | null
  assigned_user?: TicketUser
  creator?: TicketUser
  [key: string]: unknown
}

async function hydrateTicketUsers(tickets: HydratedTicket[], supabaseAdmin: SupabaseClient): Promise<HydratedTicket[]> {
  if (tickets.length === 0) return []

  const userIds = Array.from(new Set(tickets.flatMap((ticket) => [ticket.user_id, ticket.assigned_to || null].filter(Boolean) as string[])))
  if (userIds.length === 0) return tickets

  const { data: users } = await supabaseAdmin
    .from('tbl_users')
    .select('id, email, full_name')
    .in('id', userIds)

  const userMap = new Map((users || []).map((user) => [user.id, { ...user, full_name: user.full_name || undefined }]))

  return tickets.map((ticket) => ({
    ...ticket,
    assigned_user: ticket.assigned_to ? userMap.get(ticket.assigned_to) : undefined,
    creator: userMap.get(ticket.user_id),
  }))
}

const ticketColumns = `
  id,
  number,
  user_id,
  title,
  description,
  category,
  type,
  product,
  product_reference_number,
  priority,
  status,
  tags,
  assigned_to,
  comment_count,
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

    const [ticket] = await hydrateTicketUsers([data], supabaseAdmin)

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Ticket fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}
