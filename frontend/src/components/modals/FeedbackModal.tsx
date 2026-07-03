'use client'

import { useState } from 'react'
import { Modal, Form, Input, Select, Rate, Button, message } from 'antd'
import { feedbackService } from '@/services'
import { useAuthStore } from '@/lib/store'

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
      const { user } = useAuthStore.getState()
      
      const response = await feedbackService.createFeedback({
        rating: values.rating,
        comment: values.message,
        ticket_id: undefined,
        solution_id: undefined,
      })
      
      if (response.success) {
        message.success('Thank you for your feedback!')
        form.resetFields()
        onClose()
      } else {
        throw new Error(response.error || 'Failed to submit feedback')
      }
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
