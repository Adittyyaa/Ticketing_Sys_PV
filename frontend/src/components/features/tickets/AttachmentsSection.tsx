'use client'

import { useEffect, useState, useCallback } from 'react'
import { Attachment } from '@/types/types'
import { useAuthStore } from '@/lib/store'
import { adminService } from '@/services'
import { Upload, Button, Empty, List, Popconfirm, message } from 'antd'
import { DeleteOutlined, DownloadOutlined, InboxOutlined, FileTextOutlined, FileOutlined, PictureOutlined } from '@ant-design/icons'

interface AttachmentsSectionProps {
  ticketId: string
}

const getFileIcon = (type?: string) => {
  if (!type) return <FileOutlined style={{ color: 'var(--text-secondary)' }} />
  if (type.startsWith('image/')) return <PictureOutlined style={{ color: 'var(--accent-primary)' }} />
  if (type === 'application/pdf') return <FileTextOutlined style={{ color: 'var(--accent-error)' }} />
  return <FileOutlined style={{ color: 'var(--text-secondary)' }} />
}

export default function AttachmentsSection({ ticketId }: AttachmentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchAttachments = useCallback(async () => {
    try {
      const response = await adminService.getAttachments(ticketId)
      const result = response.data as any
      if (response.success && result) {
        setAttachments(result.attachments || result.data || [])
      } else {
        message.error(response.error || 'Failed to load attachments')
      }
    } catch (error) {
      message.error('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchAttachments()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchAttachments])

  const handleFileUpload = async ({ file }: { file: File }) => {
    if (!user) return
    setUploading(true)
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
      const maxFileSize = 5 * 1024 * 1024

      if (!allowedTypes.includes(file.type)) throw new Error('File type not allowed')
      if (file.size > maxFileSize) throw new Error('File exceeds 5MB limit')

      const response = await adminService.uploadAttachment(Number(ticketId), file)
      const result = response.data as any

      if (response.success && result) {
        setAttachments((prev) => [result.attachment || result, ...prev])
        message.success('File uploaded')
      } else {
        throw new Error(response.error || 'Failed to upload')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    try {
      const response = await adminService.deleteAttachment(Number(ticketId), Number(attachment.id))
      if (!response.success) throw new Error(response.error || 'Failed to delete')
      
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
      message.success('File deleted')
    } catch (error) {
      message.error('Failed to delete file')
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await adminService.downloadAttachment(Number(ticketId), Number(attachment.id))
      const result = response.data as any
      
      if (response.success && result?.url) {
        const a = document.createElement('a')
        a.href = result.url
        a.download = attachment.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        message.success('Download started')
      } else {
        throw new Error('Download failed')
      }
    } catch (error) {
      message.error('Failed to download file')
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading attachments...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: 0 }}>
          Attachments ({attachments.length})
        </h3>
        <Upload customRequest={(options) => handleFileUpload(options as { file: File })} showUploadList={false} accept=".jpg,.jpeg,.png,.pdf,.txt" disabled={uploading}>
          <Button loading={uploading} icon={<InboxOutlined />} size="small" style={{ height: 28, fontSize: 12 }}>
            Upload
          </Button>
        </Upload>
      </div>

      {attachments.length === 0 ? (
        <Empty description={<span style={{ color: 'var(--text-tertiary)' }}>No files attached</span>} />
      ) : (
        <List
          dataSource={attachments}
          renderItem={(a) => (
            <List.Item
              style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}
              actions={[
                <Button key="download" type="text" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(a)} style={{ color: 'var(--text-link)', fontSize: 11 }}>Download</Button>,
                (isAdmin) && (
                  <Popconfirm key="delete" title="Delete file?" onConfirm={() => handleDelete(a)} okText="Yes" cancelText="No">
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} style={{ fontSize: 11 }}>Delete</Button>
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(a.mime_type)}
                title={<span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{a.filename}</span>}
                description={<span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{formatFileSize(a.file_size)}</span>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )
}
