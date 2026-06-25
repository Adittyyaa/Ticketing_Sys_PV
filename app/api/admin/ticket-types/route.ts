import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await query('SELECT * FROM ticket_types ORDER BY name')
    return NextResponse.json({ types: result.rows || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load ticket types' },
      { status: 500 }
    )
  }
}