import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_SEARCH_LENGTH = 100

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

function normalizeSearch(value: string) {
  return value.trim().slice(0, MAX_SEARCH_LENGTH).replace(/%/g, '').replace(/_/g, '')
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const supabaseAdmin = createAdminClient()
  const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)

  if (verifyError || !user) return null

  return { user, supabaseAdmin }
}

async function verifyAdmin(request: NextRequest) {
  const authenticated = await getAuthenticatedUser(request)
  if (!authenticated) return null

  const { data: adminCheck } = await authenticated.supabaseAdmin
    .from('tbl_users')
    .select('role')
    .eq('id', authenticated.user.id)
    .single()

  return adminCheck?.role === 'admin' ? authenticated.supabaseAdmin : null
}

function buildSolutionSearchFilter(search: string) {
  const term = normalizeSearch(search)
  if (!term) return ''

  return [
    `title.ilike.%${term}%`,
    `description.ilike.%${term}%`,
    `category.ilike.%${term}%`
  ].join(',')
}

export async function GET(request: NextRequest) {
  const authenticated = await getAuthenticatedUser(request)
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const category = request.nextUrl.searchParams.get('category') || ''
    
    let query = authenticated.supabaseAdmin
      .from('tbl_solutions')
      .select('*')

    if (category) {
      query = query.eq('category', category)
    }

    const searchFilter = buildSolutionSearchFilter(search)
    if (searchFilter) {
      query.or(searchFilter)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ solutions: data || [] })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load solutions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = await verifyAdmin(request)
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, description, steps, category } = await request.json()

    if (!title?.trim() || !description?.trim() || !steps?.trim()) {
      return NextResponse.json({ error: 'Title, description, and steps are required' }, { status: 400 })
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      steps: steps.trim(),
      category: category?.trim() || 'General'
    }

    const { data, error } = await supabaseAdmin
      .from('tbl_solutions')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 })
    }

    return NextResponse.json({ success: true, solution: data })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save solution' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const supabaseAdmin = await verifyAdmin(request)
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, title, description, steps, category } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Solution ID required' }, { status: 400 })
    }

    if (!title?.trim() || !description?.trim() || !steps?.trim()) {
      return NextResponse.json({ error: 'Title, description, and steps are required' }, { status: 400 })
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      steps: steps.trim(),
      category: category?.trim() || 'General',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('tbl_solutions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, solution: data })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update solution' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const supabaseAdmin = await verifyAdmin(request)
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Solution ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('tbl_solutions')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Solutions API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete solution' },
      { status: 500 }
    )
  }
}
