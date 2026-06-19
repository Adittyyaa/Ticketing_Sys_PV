import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

type AdminAuthResult =
  | { error: string; status: 401 | 403 | 500; supabaseAdmin: null; userId: null }
  | { error: null; status: 200; supabaseAdmin: SupabaseClient; userId: string }

export async function verifyAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401, supabaseAdmin: null, userId: null }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: 'Server configuration error', status: 500, supabaseAdmin: null, userId: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)

  if (verifyError || !user) {
    console.error('verifyAdminRequest - verifyError:', verifyError, 'user:', user, 'token length:', token?.length)
    return { error: 'Invalid token', status: 401, supabaseAdmin: null, userId: null }
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from('tbl_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || userData.role !== 'admin') {
    return { error: 'Admin access required', status: 403, supabaseAdmin: null, userId: null }
  }

  return { error: null, status: 200, supabaseAdmin, userId: user.id }
}
