import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const { data: { user: requestingUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    
    if (verifyError || !requestingUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { data: requestingUserData } = await supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (requestingUserData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can seed data' }, { status: 403 })
    }

    // Check if categories already exist
    const { count: categoryCount } = await supabaseAdmin
      .from('tbl_categories')
      .select('*', { count: 'exact', head: true })

    if (categoryCount && categoryCount > 0) {
      return NextResponse.json({ success: true, message: 'Categories already seeded' })
    }

    // Seed categories
    const categoriesToInsert = CATEGORIES
      .filter(c => !c.includes('<')) // Filter out the generic string type
      .map(name => ({ 
        name, 
        created_at: new Date().toISOString() 
      }))

    const { error: catError } = await supabaseAdmin
      .from('tbl_categories')
      .insert(categoriesToInsert)

    if (catError) throw new Error(catError.message)

    return NextResponse.json({ success: true, message: 'Categories seeded successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed data' },
      { status: 400 }
    )
  }
}