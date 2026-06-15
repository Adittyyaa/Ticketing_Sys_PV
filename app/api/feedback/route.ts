import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)
    if (verifyError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { category, rating, message } = await request.json()

    if (!category || !rating || !message) {
      return NextResponse.json({ error: 'Missing feedback fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('tbl_feedback')
      .insert([
        {
          user_id: user.id,
          category,
          rating: Number(rating),
          message,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, feedback: data })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
