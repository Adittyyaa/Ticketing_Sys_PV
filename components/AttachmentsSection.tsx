'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Attachment } from '@/types/types'
import { useAuthStore } from '@/lib/store'
import { Upload, Card, Button, Empty, List, Popconfirm, message, Skeleton } from 'antd'
import { DeleteOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons'

interface AttachmentsSectionProps {
  ticketId: string
}

export default function AttachmentsSection({ ticketId }: AttachmentsSectionProps) {
  const { user, isAdmin } = useAuthStore()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchAttachments()
  }, [ticketId])

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from('tbl_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttachments(data || [])
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
      message.error('Failed to load attachments')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async ({ file }: any) => {
    if (!user) return

    setUploading(true)

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain']
    const MAX_FILE_SIZE = 5 * 1024 * 1024

    try {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('File type not allowed. Allowed: images, PDF, text')
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File exceeds 5MB limit')
      }

      // Sanitize filename
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100)

      // Upload to storage
      const filePath = `${user.id}/${ticketId}/${Date.now()}-${sanitizedName}`
      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Save metadata
      const { data, error: dbError } = await supabase
        .from('tbl_attachments')
        .insert([
          {
            ticket_id: ticketId,
            user_id: user.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
          },
        ])
        .select()
        .single()

      if (dbError) throw dbError

      setAttachments((prev) => [data, ...prev])
      message.success('File uploaded successfully')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (attachment: Attachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([attachment.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('tbl_attachments')
        .delete()
        .eq('id', attachment.id)

      if (dbError) throw dbError

      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
      message.success('File deleted')
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      message.error('Failed to delete file')
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(attachment.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
      message.error('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />

  return (
    <Card
      title={`Attachments (${attachments.length})`}
      extra={
        <Upload
          customRequest={(options) => handleFileUpload(options)}
          showUploadList={false}
          accept=".jpg,.jpeg,.png,.pdf,.txt"
          disabled={uploading}
        >
          <Button loading={uploading} icon={<InboxOutlined />}>
            Upload File
          </Button>
        </Upload>
      }
    >
      {attachments.length === 0 ? (
        <Empty description="No files attached" />
      ) : (
        <List
          dataSource={attachments}
          renderItem={(attachment) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(attachment)}
                >
                  Download
                </Button>,
                (user?.id === attachment.user_id || isAdmin) && (
                  <Popconfirm
                    title="Delete file?"
                    description={`Delete ${attachment.file_name}?`}
                    onConfirm={() => handleDelete(attachment)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={attachment.file_name}
                description={formatFileSize(attachment.file_size)}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
