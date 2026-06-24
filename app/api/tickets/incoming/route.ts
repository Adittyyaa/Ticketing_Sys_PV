import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function createSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

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

  const supabaseAdmin = createSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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

      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('tbl_users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (userError) {
        return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
      }

      if (existingUser) {
        userId = existingUser.id
      } else {
        const fullName = body.user_name?.trim() || email.split('@')[0]

        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: fullName, role: 'user' },
        })

        if (authErr || !authData.user) {
          return NextResponse.json(
            { error: authErr?.message || 'Failed to create user' },
            { status: 500 }
          )
        }

        const { error: profileErr } = await supabaseAdmin
          .from('tbl_users')
          .insert({
            id: authData.user.id,
            email,
            full_name: fullName,
            role: 'user',
          })

        if (profileErr) {
          return NextResponse.json(
            { error: profileErr.message || 'Failed to create user profile' },
            { status: 500 }
          )
        }

        userId = authData.user.id
      }
    }

    const ticketPayload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      type: type?.trim() || null,
      product: product?.trim() || null,
      product_reference_number: product_reference_number?.trim() || null,
      priority: priority?.trim() || 'MEDIUM',
      status: status?.trim() || 'UNTOUCHED',
      tags: Array.isArray(tags) ? tags : [],
      user_id: userId,
    }

    const { data, error } = await supabaseAdmin
      .from('tbl_tickets')
      .insert([ticketPayload])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to create ticket' }, { status: 400 })
    }

    return NextResponse.json({ success: true, ticket: data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}
