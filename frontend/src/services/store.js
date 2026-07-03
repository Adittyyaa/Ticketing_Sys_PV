import { create } from 'zustand'
import { USER_ROLES } from '../types/types'
import { apiClient } from '../services/api'

// ============================================
// TICKET STORE
// ============================================

export const useTicketStore = create((set) => ({
    // State
    tickets: [],
    filters: {
        search: '',
        priority: undefined,
        status: undefined,
        category: undefined,
        dateRange: undefined
    },
    customStatuses: [],

    // Actions
    setTickets: (tickets) => set({ tickets }),

    addTicket: (ticket) => set((state) => ({
        tickets: [ticket, ...state.tickets]
    })),

    updateTicket: (id, ticketUpdate) =>
        set((state) => ({
            tickets: state.tickets.map((t) =>
                t.id === id ? { ...t, ...ticketUpdate } : t
            ),
        })),

    deleteTicket: (id) =>
        set((state) => ({
            tickets: state.tickets.filter((t) => t.id !== id),
        })),

    setFilters: (newFilters) =>
        set((state) => ({
            filters: { ...state.filters, ...newFilters },
        })),

    clearFilters: () =>
        set({
            filters: {
                search: '',
                priority: undefined,
                status: undefined,
                category: undefined,
                dateRange: undefined
            }
        }),

    setCustomStatuses: (customStatuses) => set({ customStatuses }),

    // Helper methods
    getTicketById: (id) => (state) =>
        state.tickets.find(ticket => ticket.id === id),

    getFilteredTickets: () => (state) => {
        let filtered = state.tickets

        if (state.filters.search) {
            const searchTerm = state.filters.search.toLowerCase()
            filtered = filtered.filter(ticket =>
                ticket.title.toLowerCase().includes(searchTerm) ||
                ticket.description.toLowerCase().includes(searchTerm) ||
                ticket.user_email?.toLowerCase().includes(searchTerm)
            )
        }

        if (state.filters.priority) {
            filtered = filtered.filter(ticket =>
                ticket.priority === state.filters.priority
            )
        }

        if (state.filters.status) {
            filtered = filtered.filter(ticket =>
                ticket.status === state.filters.status
            )
        }

        if (state.filters.category) {
            filtered = filtered.filter(ticket =>
                ticket.category_id === state.filters.category
            )
        }

        return filtered
    }
}))

// ============================================
// AUTH STORE
// ============================================

export const useAuthStore = create((set, get) => ({
    // State
    user: null,
    loading: true,
    isAdmin: false,
    token: null,

    // Actions
    setUser: (user) => {
        const isAdmin = user?.role === USER_ROLES.ADMIN
        set({
            user,
            isAdmin,
            loading: false
        })
    },

    setLoading: (loading) => set({ loading }),

    setIsAdmin: (isAdmin) => set({ isAdmin }),

    setToken: (token) => {
        set({ token })
        if (token) {
            localStorage.setItem('pv_advisory_token', token)
        } else {
            localStorage.removeItem('pv_advisory_token')
        }
    },

    logout: () => {
        set({
            user: null,
            isAdmin: false,
            token: null,
            loading: false
        })
        localStorage.removeItem('pv_advisory_token')
        localStorage.removeItem('pv_advisory_user')
        apiClient.clearAuthToken()
    },

    // Initialize auth from localStorage
    initializeAuth: () => {
        const token = localStorage.getItem('pv_advisory_token')
        if (token) {
            set({ token })
            // Restore the auth header on the apiClient singleton so
            // requests made after a page navigation are authenticated.
            apiClient.setAuthToken(token)
        } else {
            set({ loading: false })
        }
    },

    // Helper methods
    isAuthenticated: () => {
        const state = get()
        return !!state.user && !!state.token
    },

    hasRole: (role) => {
        const state = get()
        return state.user?.role === role
    },

    canAccessAdmin: () => {
        const state = get()
        return state.isAdmin || state.user?.role === USER_ROLES.ADMIN
    }
}))

// ============================================
// UI STORE (for app-wide UI state)
// ============================================

export const useUIStore = create((set) => ({
    // State
    sidebarOpen: false,
    theme: 'light',
    notifications: [],

    // Actions
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
    })),

    setTheme: (theme) => {
        set({ theme })
        localStorage.setItem('theme', theme)
    },

    addNotification: (notification) => {
        const id = Date.now().toString()
        const newNotification = {
            id,
            type: 'info',
            duration: 5000,
            ...notification
        }

        set((state) => ({
            notifications: [...state.notifications, newNotification]
        }))

        // Auto remove after duration
        if (newNotification.duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    notifications: state.notifications.filter(n => n.id !== id)
                }))
            }, newNotification.duration)
        }

        return id
    },

    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),

    clearNotifications: () => set({ notifications: [] }),

    // Initialize theme from localStorage
    initializeTheme: () => {
        const savedTheme = localStorage.getItem('theme') || 'light'
        set({ theme: savedTheme })
    }
}))

// ============================================
// FORM STORE (for managing form state)
// ============================================

export const useFormStore = create((set) => ({
    // State
    formData: {},
    formErrors: {},
    formTouched: {},
    isSubmitting: false,

    // Actions
    setFormData: (formId, data) => set((state) => ({
        formData: {
            ...state.formData,
            [formId]: { ...state.formData[formId], ...data }
        }
    })),

    setFormField: (formId, field, value) => set((state) => ({
        formData: {
            ...state.formData,
            [formId]: {
                ...state.formData[formId],
                [field]: value
            }
        }
    })),

    setFormErrors: (formId, errors) => set((state) => ({
        formErrors: {
            ...state.formErrors,
            [formId]: errors
        }
    })),

    setFieldError: (formId, field, error) => set((state) => ({
        formErrors: {
            ...state.formErrors,
            [formId]: {
                ...state.formErrors[formId],
                [field]: error
            }
        }
    })),

    setFieldTouched: (formId, field, touched = true) => set((state) => ({
        formTouched: {
            ...state.formTouched,
            [formId]: {
                ...state.formTouched[formId],
                [field]: touched
            }
        }
    })),

    setSubmitting: (formId, isSubmitting) => set((state) => ({
        isSubmitting: {
            ...state.isSubmitting,
            [formId]: isSubmitting
        }
    })),

    resetForm: (formId) => set((state) => {
        const newState = { ...state }
        delete newState.formData[formId]
        delete newState.formErrors[formId]
        delete newState.formTouched[formId]
        delete newState.isSubmitting[formId]
        return newState
    }),

    clearAllForms: () => set({
        formData: {},
        formErrors: {},
        formTouched: {},
        isSubmitting: false
    })
}))

// ============================================
// STORE INITIALIZATION
// ============================================

// Initialize stores that need localStorage data
if (typeof window !== 'undefined') {
    useAuthStore.getState().initializeAuth()
    useUIStore.getState().initializeTheme()
}