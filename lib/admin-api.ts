import { supabase } from '@/lib/supabase'

export async function getAdminAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('No active session')
  }
  return `Bearer ${session.access_token}`
}
