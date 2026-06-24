import { NextRequest, NextResponse } from 'next/server'
import { createTicket, getTickets } from '@/lib/database-service'
import { requireAuth } from '@/lib/auth'
import type { CreateTicketData } from '@/types/types'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const category_id = searchParams.get('category_id') || undefined
    
    // Non-admin users can only see their own tickets
    const filters = {
      status,
      priority,
      category_id,
      user_id: user.role === 'admin' ? undefined : user.id
    }
    
    const result = await getTickets(page, limit, filters)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get tickets error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const ticketData: CreateTicketData = await request.json()
    
    // Validate required fields
    if (!ticketData.title || !ticketData.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }
    
    const ticket = await createTicket(user.id, ticketData)
    
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Create ticket error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ticket' },
      { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
    )
  }
}