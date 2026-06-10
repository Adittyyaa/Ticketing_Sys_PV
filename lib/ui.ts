import type { Priority, Status } from '@/types/types'

// Light-theme badge styles for ticket priority
export const priorityStyles: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
}

// Light-theme badge styles for ticket status
export const statusStyles: Record<Status, string> = {
  UNTOUCHED: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  OPENED: 'bg-blue-50 text-blue-700 border-blue-200',
  SOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

// Progress-bar fill colors
export const statusBarColor: Record<Status, string> = {
  UNTOUCHED: 'bg-slate-400',
  PENDING: 'bg-amber-500',
  OPENED: 'bg-blue-500',
  SOLVED: 'bg-emerald-500',
}

export const priorityBarColor: Record<Priority, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-sky-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
}
