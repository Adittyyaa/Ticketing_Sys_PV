import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { verifyAdminRequest } from '@/lib/admin-auth'
import { CATEGORIES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Check if categories already exist
    const result = await query('SELECT COUNT(*) FROM categories')
    const categoryCount = parseInt(result.rows[0].count, 10)

    if (categoryCount > 0) {
      return NextResponse.json({ success: true, message: 'Categories already seeded' })
    }

    // Seed categories
    const categoriesToInsert = CATEGORIES
      .filter((c) => !c.includes('<'))
      .map((name) => [name])

    await query(
      `INSERT INTO categories (name, created_at) VALUES ${categoriesToInsert.map((_, i) => `($${i * 2 + 1}, NOW())`).join(', ')}`,
      categoriesToInsert.flat()
    )

    return NextResponse.json({ success: true, message: 'Categories seeded successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed data' },
      { status: 400 }
    )
  }
}