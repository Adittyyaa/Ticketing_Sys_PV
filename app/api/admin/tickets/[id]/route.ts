import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error || !auth.supabaseAdmin) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const supabaseAdmin = auth.supabaseAdmin
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('tbl_tickets')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error('Admin ticket fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticket' },
      { status: 404 }
    )
  }
}
