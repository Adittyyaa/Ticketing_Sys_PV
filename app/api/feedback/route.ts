import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
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

export async function POST(request: NextRequest) {
  const authenticated = await getAuthenticatedUser(request)
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { category, rating, message } = await request.json()

    if (!category || !rating || !message?.trim()) {
      return NextResponse.json({ error: 'Category, rating, and message are required' }, { status: 400 })
    }

    const { data, error } = await authenticated.supabaseAdmin
      .from('tbl_feedback')
      .insert([{
        user_id: authenticated.user.id,
        category,
        rating,
        message: message.trim()
      }])
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, feedback: data })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const authenticated = await getAuthenticatedUser(request)
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: adminCheck } = await authenticated.supabaseAdmin
      .from('tbl_users')
      .select('role')
      .eq('id', authenticated.user.id)
      .single()

    if (adminCheck?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await authenticated.supabaseAdmin
      .from('tbl_feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ feedback: data || [] })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load feedback' },
      { status: 500 }
    )
  }
}