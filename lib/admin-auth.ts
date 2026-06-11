import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

type AdminAuthResult =
  | { error: string; status: 401 | 403; supabaseAdmin: null; userId: null }
  | { error: null; status: 200; supabaseAdmin: SupabaseClient; userId: string }

export async function verifyAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401, supabaseAdmin: null, userId: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)

  if (verifyError || !user) {
    return { error: 'Invalid token', status: 401, supabaseAdmin: null, userId: null }
  }

  const { data: userData } = await supabaseAdmin
    .from('tbl_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return { error: 'Only admins can access this resource', status: 403, supabaseAdmin: null, userId: null }
  }

  return { error: null, status: 200, supabaseAdmin, userId: user.id }
}
