import { create } from 'zustand'
import { Ticket, User } from './types'

interface TicketStore {
  tickets: Ticket[]
  setTickets: (tickets: Ticket[]) => void
  addTicket: (ticket: Ticket) => void
  updateTicket: (id: string, ticket: Partial<Ticket>) => void
  deleteTicket: (id: string) => void
  filters: {
    search: string
    priority?: string
    status?: string
    category?: string
    dateRange?: [string, string]
  }
  setFilters: (filters: Partial<TicketStore['filters']>) => void
}

export const useTicketStore = create<TicketStore>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets }),
  addTicket: (ticket) => set((state) => ({ tickets: [ticket, ...state.tickets] })),
  updateTicket: (id, ticket) =>
    set((state) => ({
      tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...ticket } : t)),
    })),
  deleteTicket: (id) =>
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== id),
    })),
  filters: {
    search: '',
  },
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}))

interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  isAdmin: boolean
  setIsAdmin: (isAdmin: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  loading: true,
  setLoading: (loading) => set({ loading }),
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}))
