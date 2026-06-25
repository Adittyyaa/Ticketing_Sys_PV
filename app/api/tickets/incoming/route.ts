import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { createUser, getUserByEmail } from '@/lib/auth'

async function verifyApiKey(request: NextRequest): Promise<boolean> {
  const expected = process.env.TICKETING_API_KEY
  if (!expected) return false
  const provided = request.headers.get('x-api-key')
  return provided === expected
}

export async function POST(request: NextRequest) {
  if (!(await verifyApiKey(request))) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      description,
      category,
      type,
      product,
      product_reference_number,
      priority,
      status,
      tags,
      user_email,
    } = body

    if (!title?.trim() || !description?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: 'title, description, and category are required' },
        { status: 400 }
      )
    }

    let userId: string | null = body.user_id ?? null

    if (!userId && user_email?.trim()) {
      const email = user_email.trim().toLowerCase()

      let user = await getUserByEmail(email)

      if (!user) {
        const fullName = body.user_name?.trim() || email.split('@')[0]
        user = await createUser({
          email,
          password: 'temp-password',
          full_name: fullName,
          role: 'user'
        })
      }

      userId = user.id
    }

    const result = await query(
      `INSERT INTO tickets (title, description, category_id, type_id, product, product_reference_number, priority, status, tags, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
      [
        title.trim(),
        description.trim(),
        category.trim(),
        type?.trim() || null,
        product?.trim() || null,
        product_reference_number?.trim() || null,
        priority?.trim() || 'MEDIUM',
        status?.trim() || 'UNTOUCHED',
        tags || [],
        userId,
      ]
    )

    return NextResponse.json({ success: true, ticket: result.rows[0] }, { status: 201 })
  } catch (e) {
    console.error('Incoming ticket error:', e)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}