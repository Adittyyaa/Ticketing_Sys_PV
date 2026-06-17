import { create } from 'zustand'
import { Notification } from '../types/types'
import { supabase } from './supabase'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  fetchNotifications: (userId: string) => Promise<void>
  clearNotifications: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ 
    notifications, 
    unreadCount: notifications.filter(n => !n.is_read).length 
  }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
  })),
  markAsRead: async (id) => {
    const { error } = await supabase.from('tbl_notifications').update({ is_read: true }).eq('id', id)
    if (!error) {
      set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
        unreadCount: Math.max(0, state.notifications.filter(n => n.id !== id && !n.is_read).length)
      }))
    }
  },
  markAllAsRead: async () => {
    const { error } = await supabase.from('tbl_notifications').update({ is_read: true }).eq('is_read', false)
    if (!error) {
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }))
    }
  },
  fetchNotifications: async (userId) => {
    if (!userId) return
    const { data, error } = await supabase.from('tbl_notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
    if (!error) {
      get().setNotifications(data as Notification[])
    }
  },
  clearNotifications: () => set({ notifications: [], unreadCount: 0 })
}))