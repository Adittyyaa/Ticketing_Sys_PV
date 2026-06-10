export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'
export type Status = 'Untouched' | 'Pending' | 'Opened' | 'Solved'

export interface TicketRow {
  id: number
  title: string
  category: string
  priority: Priority
  status: Status
  created: string
}

const categories = ['Bug Report', 'Feature Request', 'Billing', 'Account', 'Integration', 'General']
const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical']
const statuses: Status[] = ['Untouched', 'Pending', 'Opened', 'Solved']
const titles = [
  'Login page returns 500 error',
  'Add dark mode support to dashboard',
  'Invoice total mismatch on export',
  'Cannot reset account password',
  'Slack integration webhook failing',
  'Mobile layout overflow on tickets',
  'Export CSV missing date column',
  'Notification emails delayed',
  'Search filter ignores category',
  'Avatar upload fails for PNG files',
  'Pagination resets on tab switch',
  'Duplicate tickets created on submit',
]

export const tickets: TicketRow[] = Array.from({ length: 100 }, (_, i) => {
  const day = ((i * 7) % 28) + 1
  const month = ((i * 3) % 12) + 1
  return {
    id: 100 - i,
    title: titles[i % titles.length],
    category: categories[i % categories.length],
    priority: priorities[i % priorities.length],
    status: statuses[i % statuses.length],
    created: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  }
})

export const statusStyles: Record<Status, string> = {
  Untouched: 'bg-canvas text-muted border-line',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Opened: 'bg-blue-50 text-blue-700 border-blue-200',
  Solved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export const priorityStyles: Record<Priority, string> = {
  Low: 'bg-canvas text-muted border-line',
  Medium: 'bg-sky-50 text-sky-700 border-sky-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
}
