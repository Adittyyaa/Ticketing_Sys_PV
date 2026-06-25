'use client'

import { useState } from 'react'
import { Modal, Form, Input, Select, Rate, Button, message } from 'antd'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]
      if (!token) throw new Error('No active session')

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to submit feedback')

      message.success('Thank you for your feedback!')
      form.resetFields()
      onClose()
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Error submitting feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Send Feedback"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
        <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select a category' }]}>
          <Select placeholder="Select a category" options={[
            { label: 'Bug Report', value: 'bug' },
            { label: 'Feature Request', value: 'feature' },
            { label: 'Usability / Design', value: 'usability' },
            { label: 'General Comment', value: 'general' },
          ]} />
        </Form.Item>

        <Form.Item name="rating" label="Rate your experience" rules={[{ required: true, message: 'Please select a rating' }]}>
          <Rate style={{ color: '#f59e0b', fontSize: 24 }} />
        </Form.Item>

        <Form.Item name="message" label="Comments / Suggestions" rules={[{ required: true, message: 'Please write your comment' }]}>
          <Input.TextArea placeholder="Tell us what you think..." rows={4} maxLength={1000} />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting} style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}>
            Submit
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
