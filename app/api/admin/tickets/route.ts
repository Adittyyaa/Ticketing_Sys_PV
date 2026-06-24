import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAuthenticatedRequest } from '@/lib/admin-auth'

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

async function hydrateTicketUsers(tickets: HydratedTicket[]): Promise<HydratedTicket[]> {
  if (tickets.length === 0) return []

  const userIds = Array.from(
    new Set(
      tickets
        .flatMap((ticket) => [ticket.user_id, ticket.assigned_to || null].filter(Boolean) as string[])
    )
  )
  if (userIds.length === 0) return tickets

  const result = await query<TicketUser>('SELECT id, email, full_name FROM tbl_users WHERE id = ANY($1)', [userIds])
  const userMap = new Map(
    (result.rows || []).map((user) => [user.id, { ...user, full_name: user.full_name || undefined }])
  )

  return tickets.map((ticket) => ({
    ...ticket,
    assigned_user: ticket.assigned_to ? userMap.get(ticket.assigned_to) : undefined,
    creator: userMap.get(ticket.user_id),
  }))
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (typeof record.message === 'string') return record.message
    if (typeof record.details === 'string') return record.details
  }
  return 'Failed to fetch tickets'
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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthenticatedRequest(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const search = request.nextUrl.searchParams.get('search')?.trim() || ''
    const userId = auth.userId
    const role = auth.role

    let sqlQuery = `SELECT ${ticketColumns} FROM tbl_tickets`
    const conditions: string[] = []
    const values: any[] = []

    if (role !== 'admin') {
      conditions.push(`user_id = $${values.length + 1}`)
      values.push(userId)
    }

    if (search) {
      conditions.push(`title ILIKE $${values.length + 1}`)
      values.push(`%${search.replace(/[%;]/g, '').substring(0, 100)}%`)
    }

    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`
    }

    sqlQuery += ' ORDER BY created_at DESC'

    const result = await query<HydratedTicket>(sqlQuery, values)
    const tickets = await hydrateTicketUsers(result.rows || [])

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Tickets fetch error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}