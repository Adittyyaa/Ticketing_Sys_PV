import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAdminRequest } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await query('SELECT * FROM tbl_tags ORDER BY name')
    return NextResponse.json({ tags: result.rows || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load tags' },
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
    const { name } = await request.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const result = await query(
      'INSERT INTO tbl_tags (name, created_at) VALUES ($1, NOW()) RETURNING *',
      [name.trim()]
    )
    return NextResponse.json({ tag: result.rows[0] })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create tag' },
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
    const { id, name } = await request.json()
    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const result = await query(
      'UPDATE tbl_tags SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    )
    return NextResponse.json({ tag: result.rows[0] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update tag' },
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
      return NextResponse.json({ error: 'Tag ID required' }, { status: 400 })
    }

    const result = await query('DELETE FROM tbl_tags WHERE id = $1 RETURNING id', [id])
    return NextResponse.json({ success: true, deleted: (result.rowCount || 0) > 0 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete tag' },
      { status: 500 }
    )
  }
}