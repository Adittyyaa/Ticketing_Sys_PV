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

    let sqlQuery = `
      SELECT s.*, c.name as category_name
      FROM solutions s
      LEFT JOIN categories c ON s.category_id = c.id
    `
    const conditions: string[] = []
    const values: any[] = []

    if (category) {
      conditions.push(`c.name = $${values.length + 1}`)
      values.push(category)
    }

    const searchTerm = normalizeSearch(search)
    if (searchTerm) {
      conditions.push(
        `(s.title ILIKE $${values.length + 1} OR s.description ILIKE $${values.length + 2} OR c.name ILIKE $${values.length + 3})`
      )
      values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`)
    }

    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`
    }

    sqlQuery += ' ORDER BY s.created_at DESC'

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

    let categoryId: string | null = null
    if (category?.trim()) {
      const catResult = await query('SELECT id FROM categories WHERE name = $1', [category.trim()])
      categoryId = catResult.rows[0]?.id || null
    }

    const result = await query(
      `INSERT INTO solutions (title, description, steps, category_id, is_published, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [title.trim(), description.trim(), steps.trim(), categoryId, false, auth.userId]
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

    let categoryId: string | null = null
    if (category?.trim()) {
      const catResult = await query('SELECT id FROM categories WHERE name = $1', [category.trim()])
      categoryId = catResult.rows[0]?.id || null
    }

    const result = await query(
      `UPDATE solutions SET title = $1, description = $2, steps = $3, category_id = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
      [title.trim(), description.trim(), steps.trim(), categoryId, id]
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

    const result = await query('DELETE FROM solutions WHERE id = $1 RETURNING id', [id])

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