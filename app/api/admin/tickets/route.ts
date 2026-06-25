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
  number: number
  user_id: string
  assigned_to?: string | null
  assigned_id?: string | null
  assigned_email?: string | null
  assigned_name?: string | null
  creator_id?: string
  creator_email?: string
  creator_name?: string | null
  assigned_user?: TicketUser
  creator?: TicketUser
  title: string
  description: string
  category_id?: string | null
  type_id?: string | null
  category_name?: string | null
  category_color?: string | null
  type_name?: string | null
  type_description?: string | null
  product?: string | null
  product_reference_number?: string | null
  priority: string
  status: string
  tags: string[]
  tag_names?: string[]
  comment_count?: number
  attachment_count?: number
  resolved_at?: string | null
  created_at: string
  updated_at: string
  [key: string]: unknown
}

async function hydrateTicketUsers(tickets: HydratedTicket[]): Promise<HydratedTicket[]> {
  return tickets.map((ticket) => ({
    ...ticket,
    assigned_user: ticket.assigned_to ? {
      id: ticket.assigned_id || ticket.assigned_to,
      email: ticket.assigned_email || '',
      full_name: ticket.assigned_name || undefined
    } : undefined,
    creator: {
      id: ticket.creator_id || ticket.user_id,
      email: ticket.creator_email || '',
      full_name: ticket.creator_name || undefined
    },
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
  t.id,
  t.number,
  t.user_id,
  t.title,
  t.description,
  t.category_id,
  t.type_id,
  t.product,
  t.product_reference_number,
  t.priority,
  t.status,
  t.tags,
  t.assigned_to,
  t.resolved_at,
  t.created_at,
  t.updated_at,
  u.email as creator_email,
  u.full_name as creator_name,
  au.email as assigned_email,
  au.full_name as assigned_name,
  c.name as category_name,
  c.color as category_color,
  tt.name as type_name,
  tt.description as type_description,
  ARRAY(SELECT tg.name FROM tags tg WHERE tg.id = ANY(t.tags)) as tag_names,
  (SELECT COUNT(*) FROM comments WHERE ticket_id = t.id) as comment_count,
  (SELECT COUNT(*) FROM attachments WHERE ticket_id = t.id) as attachment_count
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

    const conditions: string[] = []
    const values: any[] = []

    if (role !== 'admin') {
      conditions.push(`t.user_id = $${values.length + 1}`)
      values.push(userId)
    }

    if (search) {
      conditions.push(`t.title ILIKE $${values.length + 1}`)
      values.push(`%${search.replace(/[%;]/g, '').substring(0, 100)}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const sqlQuery = `
      SELECT ${ticketColumns}
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN users au ON t.assigned_to = au.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN ticket_types tt ON t.type_id = tt.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `

    const result = await query<HydratedTicket>(sqlQuery, values)
    const tickets = await hydrateTicketUsers(result.rows || [])

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Tickets fetch error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}