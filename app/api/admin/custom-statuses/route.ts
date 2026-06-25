import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await query('SELECT * FROM custom_statuses ORDER BY name')
    return NextResponse.json({ statuses: result.rows || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load statuses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { name, color } = await request.json()
    if (!name?.trim() || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }

    const result = await query(
      'INSERT INTO custom_statuses (name, color, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [name.trim(), color]
    )
    return NextResponse.json({ status: result.rows[0] })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
      return NextResponse.json({ error: 'Status already exists' }, { status: 409 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create status' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const { id, name, color } = await request.json()
    if (!id || !name?.trim() || !color) {
      return NextResponse.json({ error: 'ID, name, and color are required' }, { status: 400 })
    }

    const result = await query(
      'UPDATE custom_statuses SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name.trim(), color, id]
    )
    return NextResponse.json({ status: result.rows[0] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update status' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Status ID required' }, { status: 400 })
    }

    const result = await query('DELETE FROM custom_statuses WHERE id = $1 RETURNING id', [id])
    return NextResponse.json({ success: true, deleted: (result.rowCount || 0) > 0 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete status' },
      { status: 500 }
    )
  }
}