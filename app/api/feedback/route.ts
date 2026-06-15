import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

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

    const feedbackData = {
      id: Math.random().toString(36).substring(2, 11),
      userId: user.id,
      category,
      rating: Number(rating),
      message,
      createdAt: new Date().toISOString(),
    }

    const dataDir = path.join(process.cwd(), 'data')
    const filePath = path.join(dataDir, 'feedback.json')

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    let feedbackList = []
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        feedbackList = JSON.parse(fileContent)
      } catch {
        feedbackList = []
      }
    }

    feedbackList.push(feedbackData)
    fs.writeFileSync(filePath, JSON.stringify(feedbackList, null, 2))

    return NextResponse.json({ success: true, feedback: feedbackData })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
