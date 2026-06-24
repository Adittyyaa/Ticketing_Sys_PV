import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticatedRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  return NextResponse.json({ authenticated: true, userId: auth.userId })
}