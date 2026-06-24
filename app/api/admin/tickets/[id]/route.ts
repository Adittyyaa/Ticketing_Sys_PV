import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAuthenticatedRequest } from '@/lib/admin-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  try {
    const updates = await request.json()

    let sqlQuery = 'UPDATE tickets SET updated_at = NOW()'
    const values: any[] = []
    let paramIndex = 1

    if (updates.priority !== undefined) {
      sqlQuery += `, priority = $${paramIndex++}`
      values.push(updates.priority)
    }
    if (updates.status !== undefined) {
      sqlQuery += `, status = $${paramIndex++}`
      values.push(updates.status)
    }
    if (updates.assigned_to !== undefined) {
      sqlQuery += `, assigned_to = $${paramIndex++}`
      values.push(updates.assigned_to)
    }

    sqlQuery += ` WHERE id = $${paramIndex++}`
    values.push(id)

    if (auth.role !== 'admin') {
      sqlQuery += ` AND user_id = $${paramIndex++}`
      values.push(auth.userId)
    }

    sqlQuery += ' RETURNING *'

    const result = await query(sqlQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ticket: result.rows[0] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ticket' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  try {
    let sqlQuery = 'DELETE FROM tickets WHERE id = $1'
    const values: any[] = [id]

    if (auth.role !== 'admin') {
      sqlQuery += ' AND user_id = $2'
      values.push(auth.userId)
    }

    const result = await query(sqlQuery, values)

    if ((result.rowCount || 0) === 0) {
      return NextResponse.json({ error: 'Ticket not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete ticket' },
      { status: 400 }
    )
  }
}