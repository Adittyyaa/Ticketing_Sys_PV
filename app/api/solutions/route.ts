import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAuthenticatedRequest, verifyAdminRequest } from '@/lib/admin-auth'

const MAX_SEARCH_LENGTH = 100

function normalizeSearch(value: string) {
  return value.trim().slice(0, MAX_SEARCH_LENGTH).replace(/%/g, '').replace(/_/g, '')
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const category = request.nextUrl.searchParams.get('category') || ''

    let sqlQuery = 'SELECT * FROM tbl_solutions'
    const conditions: string[] = []
    const values: any[] = []

    if (category) {
      conditions.push(`category = $${values.length + 1}`)
      values.push(category)
    }

    const searchTerm = normalizeSearch(search)
    if (searchTerm) {
      conditions.push(
        `(title ILIKE $${values.length + 1} OR description ILIKE $${values.length + 2} OR category ILIKE $${values.length + 3})`
      )
      values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`)
    }

    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`
    }

    sqlQuery += ' ORDER BY created_at DESC'

    const result = await query(sqlQuery, values)

    return NextResponse.json({ solutions: result.rows || [] })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load solutions' },
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
    const { title, description, steps, category } = await request.json()

    if (!title?.trim() || !description?.trim() || !steps?.trim()) {
      return NextResponse.json({ error: 'Title, description, and steps are required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO tbl_solutions (title, description, steps, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [title.trim(), description.trim(), steps.trim(), category?.trim() || 'General']
    )

    return NextResponse.json({ success: true, solution: result.rows[0] })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save solution' },
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
    const { id, title, description, steps, category } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Solution ID required' }, { status: 400 })
    }

    if (!title?.trim() || !description?.trim() || !steps?.trim()) {
      return NextResponse.json({ error: 'Title, description, and steps are required' }, { status: 400 })
    }

    const result = await query(
      `UPDATE tbl_solutions SET title = $1, description = $2, steps = $3, category = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
      [title.trim(), description.trim(), steps.trim(), category?.trim() || 'General', id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, solution: result.rows[0] })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update solution' },
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
      return NextResponse.json({ error: 'Solution ID required' }, { status: 400 })
    }

    const result = await query('DELETE FROM tbl_solutions WHERE id = $1 RETURNING id', [id])

    if ((result.rowCount || 0) === 0) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete solution' },
      { status: 500 }
    )
  }
}