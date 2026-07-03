import { Priority, Status } from '../types/types'
import { colors } from './design-tokens'

export const CATEGORIES: string[] = [
  'Bug Report',
  'Technical Issue',
  'Account Inquiry',
  'New Feature Request',
  'Other'
]

export const PRIORITIES: Priority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
]

export const STATUS_OPTIONS: Status[] = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_CUSTOMER',
  'RESOLVED',
  'CLOSED'
]

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain'
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: colors.priority.low,
  MEDIUM: colors.priority.medium,
  HIGH: colors.priority.high,
  URGENT: colors.priority.urgent,
}

export const PRIORITY_CSS_CLASSES: Record<Priority, string> = {
  LOW: 'bg-p-low-bg text-p-low',
  MEDIUM: 'bg-p-medium-bg text-p-medium',
  HIGH: 'bg-p-high-bg text-p-high',
  URGENT: 'bg-p-urgent-bg text-p-urgent',
}

export const STATUS_COLORS: Record<Status, string> = {
  OPEN: colors.status.untouched,
  IN_PROGRESS: colors.status.pending,
  WAITING_FOR_CUSTOMER: colors.status.opened,
  RESOLVED: colors.status.solved,
  CLOSED: colors.status.solved,
}

export const STATUS_CSS_CLASSES: Record<Status, string> = {
  OPEN: 'bg-s-untouched-bg text-s-untouched',
  IN_PROGRESS: 'bg-s-pending-bg text-s-pending',
  WAITING_FOR_CUSTOMER: 'bg-s-opened-bg text-s-opened',
  RESOLVED: 'bg-s-solved-bg text-s-solved',
  CLOSED: 'bg-s-solved-bg text-s-solved',
}

export const MAX_TITLE_LENGTH = 255
export const MAX_DESCRIPTION_LENGTH = 5000
export const MAX_TAGS = 10
export const MAX_TAG_LENGTH = 50
