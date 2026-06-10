'use client'

import React, { useState } from 'react'
import { Button, Card, Input, Space, Badge, Upload } from 'antd'
import { ArrowLeftOutlined, FilePdfOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons'

export default function TicketDetail({ onBack }: { onBack: () => void }) {
  const [comments, setComments] = useState(['Admin comment: Issue reproduced', 'User reply: Still experiencing'])
  const [newComment, setNewComment] = useState('')

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([...comments, newComment])
      setNewComment('')
    }
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      <Button type="text" onClick={onBack} style={{ marginBottom: '24px', color: '#1f2937' }}>
        <ArrowLeftOutlined /> Back to admin dashboard
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1f2937', fontSize: '32px', fontWeight: 700 }}>#4 test</h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280' }}>Dashboard Not Loading</p>
        </div>
        <Space>
          <Button icon={<FilePdfOutlined />}>Export PDF</Button>
          <Button type="primary">Mark Resolved</Button>
          <Button icon={<EditOutlined />}>Edit</Button>
          <Button icon={<DeleteOutlined />} danger>
            Delete
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <Badge color="#f59e0b" text={<span style={{ color: '#1f2937', fontSize: '14px' }}>Priority: Medium</span>} />
        <Badge color="#fbbf24" text={<span style={{ color: '#1f2937', fontSize: '14px' }}>Status: Untouched</span>} />
        <Badge color="#93c5fd" text={<span style={{ color: '#1f2937', fontSize: '14px' }}>Category: Bug Report</span>} />
      </div>

      <Card title="Description" style={{ marginBottom: '24px', borderColor: '#E5E7EB' }}>
        <p style={{ color: '#1f2937', lineHeight: '1.6' }}>The dashboard loads but shows no data. This issue occurs intermittently and affects multiple users. After investigation, it appears related to API timeout issues.</p>
      </Card>

      <Card title="Comments" style={{ marginBottom: '24px', borderColor: '#E5E7EB' }}>
        <div style={{ marginBottom: '24px' }}>
          {comments.map((comment, idx) => (
            <div key={idx} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                {idx % 2 === 0 ? 'Admin' : 'User'} • 2 hours ago
              </div>
              <p style={{ margin: 0, color: '#1f2937' }}>{comment}</p>
            </div>
          ))}
        </div>
        <textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            marginBottom: '12px',
            minHeight: '100px',
            fontFamily: 'inherit',
            fontSize: '14px',
          }}
        />
        <Button type="primary" onClick={handleAddComment}>
          Post Comment
        </Button>
      </Card>

      <Card title="Attachments" style={{ borderColor: '#E5E7EB' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#1f2937' }}>logo.jpeg • 2.6 KB</span>
            <Space>
              <Button type="text" size="small" icon={<DownloadOutlined />}>
                Download
              </Button>
              <Button type="text" size="small" danger>
                Delete
              </Button>
            </Space>
          </div>
        </div>
        <Upload.Dragger style={{ borderColor: '#E5E7EB' }}>
          <p style={{ color: '#6b7280' }}>Drag files here or click to upload</p>
        </Upload.Dragger>
      </Card>
    </div>
  )
}
