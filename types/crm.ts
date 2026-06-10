export type DealStage = 'Prospecting' | 'Qualified' | 'Negotiation' | 'Proposal' | 'Won' | 'Lost'
export type ConfidenceLevel = 'Low' | 'Medium' | 'High'
export type LeadSource = 'Inbound' | 'Outbound' | 'Referral' | 'Partner'

export interface Deal {
  id: string
  dealId: string
  clientName: string
  stage: DealStage
  value: number
  expectedCloseDate: string
  confidence: ConfidenceLevel
  owner: string
  source: LeadSource
  scope: string
  createdAt: string
  updatedAt: string
}

export interface DealDetail extends Deal {
  notes: string
  activities: Activity[]
  attachments: FileAttachment[]
}

export interface Activity {
  id: string
  type: 'call' | 'meeting' | 'note'
  title: string
  description: string
  date: string
  user: string
}

export interface FileAttachment {
  id: string
  fileName: string
  fileType: string
  uploadedAt: string
}

export interface User {
  id: string
  email: string
  password?: string
  name: string
}
