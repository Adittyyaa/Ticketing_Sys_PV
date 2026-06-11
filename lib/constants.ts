import { Category, Priority, Status } from '../types/types'
import { colors } from './design-tokens'

export const CATEGORIES: Category[] = [
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
  'UNTOUCHED',
  'PENDING',
  'OPENED',
  'SOLVED'
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
  UNTOUCHED: colors.status.untouched,
  PENDING: colors.status.pending,
  OPENED: colors.status.opened,
  SOLVED: colors.status.solved,
}

export const STATUS_CSS_CLASSES: Record<Status, string> = {
  UNTOUCHED: 'bg-s-untouched-bg text-s-untouched',
  PENDING: 'bg-s-pending-bg text-s-pending',
  OPENED: 'bg-s-opened-bg text-s-opened',
  SOLVED: 'bg-s-solved-bg text-s-solved',
}

export const MAX_TITLE_LENGTH = 255
export const MAX_DESCRIPTION_LENGTH = 5000
export const MAX_TAGS = 10
export const MAX_TAG_LENGTH = 50
