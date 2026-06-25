import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticatedRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  // Fetch user data
  const result = await (await import('@/lib/database')).query(
    'SELECT id, email, full_name, role, phone, job_title, company, created_at FROM users WHERE id = $1',
    [auth.userId]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: result.rows[0] })
}