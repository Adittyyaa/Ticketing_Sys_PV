import { supabase } from '@/lib/supabase'

export async function getAdminAuthHeader(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!session?.access_token) {
    throw new Error('No active session')
  }

  if (session.expires_at && session.expires_at * 1000 - Date.now() < 60_000) {
    const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) throw refreshError
    if (!refreshedSession.session?.access_token) {
      throw new Error('No active session')
    }
    return `Bearer ${refreshedSession.session.access_token}`
  }

  return `Bearer ${session.access_token}`
}
