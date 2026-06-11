'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Attachment } from '@/types/types'
import { useAuthStore } from '@/lib/store'
import { Upload, Button, Empty, List, Popconfirm, message } from 'antd'
import { DeleteOutlined, DownloadOutlined, InboxOutlined, FileTextOutlined, FileOutlined, PictureOutlined } from '@ant-design/icons'

interface AttachmentsSectionProps {
  ticketId: string
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <PictureOutlined style={{ color: '#3b82f6' }} />
  if (type === 'application/pdf') return <FileTextOutlined style={{ color: '#ef4444' }} />
  return <FileOutlined style={{ color: '#94a3b8' }} />
}

export default function AttachmentsSection({ ticketId }: AttachmentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchAttachments() }, [ticketId])

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase.from('tbl_attachments').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: false })
      if (error) throw error
      setAttachments(data || [])
    } catch { message.error('Failed to load attachments') }
    finally { setLoading(false) }
  }

  const handleFileUpload = async ({ file }: any) => {
    if (!user) return
    setUploading(true)
    try {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
      const MAX_FILE_SIZE = 5 * 1024 * 1024
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error('File type not allowed')
      if (file.size > MAX_FILE_SIZE) throw new Error('File exceeds 5MB limit')
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100)
      const filePath = `${user.id}/${ticketId}/${Date.now()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage.from('ticket-attachments').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data, error: dbError } = await supabase.from('tbl_attachments').insert([{ ticket_id: ticketId, user_id: user.id, file_name: file.name, file_path: filePath, file_size: file.size, file_type: file.type }]).select().single()
      if (dbError) throw dbError
      setAttachments((prev) => [data, ...prev])
      message.success('File uploaded')
    } catch (error) { message.error(error instanceof Error ? error.message : 'Failed to upload') }
    finally { setUploading(false) }
  }

  const handleDelete = async (attachment: Attachment) => {
    try {
      const { error: storageError } = await supabase.storage.from('ticket-attachments').remove([attachment.file_path])
      if (storageError) throw storageError
      const { error: dbError } = await supabase.from('tbl_attachments').delete().eq('id', attachment.id)
      if (dbError) throw dbError
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
      message.success('File deleted')
    } catch { message.error('Failed to delete file') }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage.from('ticket-attachments').download(attachment.file_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = attachment.file_name
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch { message.error('Failed to download file') }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading attachments...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ color: '#f0f4f8', fontSize: 13, fontWeight: 600, margin: 0 }}>
          Attachments ({attachments.length})
        </h3>
        <Upload customRequest={(options) => handleFileUpload(options)} showUploadList={false} accept=".jpg,.jpeg,.png,.pdf,.txt" disabled={uploading}>
          <Button loading={uploading} icon={<InboxOutlined />} size="small" style={{ height: 28, fontSize: 12 }}>
            Upload
          </Button>
        </Upload>
      </div>

      {attachments.length === 0 ? (
        <Empty description={<span style={{ color: '#64748b' }}>No files attached</span>} />
      ) : (
        <List
          dataSource={attachments}
          renderItem={(a) => (
            <List.Item
              style={{ padding: '8px 0', borderBottom: '1px solid #1e2d45' }}
              actions={[
                <Button type="text" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(a)} style={{ color: '#60a5fa', fontSize: 11 }}>Download</Button>,
                (user?.id === a.user_id || isAdmin) && (
                  <Popconfirm title="Delete file?" onConfirm={() => handleDelete(a)} okText="Yes" cancelText="No">
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} style={{ fontSize: 11 }}>Delete</Button>
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={getFileIcon(a.file_type)}
                title={<span style={{ color: '#f0f4f8', fontSize: 13 }}>{a.file_name}</span>}
                description={<span style={{ color: '#64748b', fontSize: 11 }}>{formatFileSize(a.file_size)}</span>}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )
}
