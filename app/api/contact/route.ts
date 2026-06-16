import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
  if (verifyError || !user) return null

  const { data: adminCheck } = await supabaseAdmin.from('tbl_users').select('role').eq('id', user.id).single()
  return adminCheck?.role === 'admin' ? supabaseAdmin : null
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = await verifyAdmin(request)
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, email, phone, position } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tbl_contacts')
      .insert([{ name, email, phone, position }])
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 })
    }

    return NextResponse.json({ success: true, contact: data })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save contact' },
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
    const { id, name, email, phone, position } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tbl_contacts')
      .update({ name, email, phone, position })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, contact: data })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update contact' },
      { status: 500 }
    )
  }
}