import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { ticketIds } = await request.json()

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'Ticket IDs array is required' },
        { status: 400 }
      )
    }

    // Verify the requester is an admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Verify the token and check if user is admin
    const { data: { user: requestingUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !requestingUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: requestingUserData } = await supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (requestingUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can bulk delete tickets' }, { status: 403 })
    }

    // Delete all tickets with the given IDs
    const { error: deleteError } = await supabaseAdmin
      .from('tbl_tickets')
      .delete()
      .in('id', ticketIds)

    if (deleteError) throw new Error(deleteError.message)

    return NextResponse.json({ 
      success: true, 
      deletedCount: ticketIds.length,
      message: `Successfully deleted ${ticketIds.length} ticket(s)`
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete tickets' },
      { status: 400 }
    )
  }
}
