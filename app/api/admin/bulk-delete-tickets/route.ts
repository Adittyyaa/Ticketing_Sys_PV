import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { ticketIds } = await request.json()

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json({ error: 'Ticket IDs array is required' }, { status: 400 })
    }

    const result = await query('DELETE FROM tbl_tickets WHERE id = ANY($1) RETURNING id', [ticketIds])

    return NextResponse.json({
      success: true,
      deletedCount: result.rowCount || 0,
      message: `Successfully deleted ${result.rowCount || 0} ticket(s)`,
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete tickets' },
      { status: 400 }
    )
  }
}