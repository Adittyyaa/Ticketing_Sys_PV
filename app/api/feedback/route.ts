import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAuthenticatedRequest } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { category, rating, message } = await request.json()

    if (!category || !rating || !message?.trim()) {
      return NextResponse.json({ error: 'Category, rating, and message are required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO tbl_feedback (user_id, category, rating, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [auth.userId, category, rating, message.trim()]
    )

    return NextResponse.json({ success: true, feedback: result.rows[0] })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await query('SELECT * FROM tbl_feedback ORDER BY created_at DESC')
    return NextResponse.json({ feedback: result.rows || [] })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load feedback' },
      { status: 500 }
    )
  }
}