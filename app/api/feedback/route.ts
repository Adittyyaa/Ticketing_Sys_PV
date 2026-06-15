import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-auth'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminRequest(request)
    if (auth.error || !auth.userId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status })
    }

    const { category, rating, message } = await request.json()

    if (!category || !rating || !message) {
      return NextResponse.json({ error: 'Missing feedback fields' }, { status: 400 })
    }

    const feedbackData = {
      id: Math.random().toString(36).substring(2, 11),
      userId: auth.userId,
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
