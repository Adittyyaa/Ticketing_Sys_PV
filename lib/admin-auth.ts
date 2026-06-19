import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

type AuthenticatedRequestResult =
  | { error: string; status: 401 | 403 | 500; supabaseAdmin: null; userId: null; role: null }
  | { error: null; status: 200; supabaseAdmin: SupabaseClient; userId: string; role: string | null }

type AdminAuthResult =
  | { error: string; status: 401 | 403 | 500; supabaseAdmin: null; userId: null }
  | { error: null; status: 200; supabaseAdmin: SupabaseClient; userId: string }

function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function verifyAuthenticatedRequest(request: NextRequest): Promise<AuthenticatedRequestResult> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Unauthorized', status: 401, supabaseAdmin: null, userId: null, role: null }
  }

  const supabaseAdmin = createSupabaseAdmin()
  if (!supabaseAdmin) {
    return { error: 'Server configuration error', status: 500, supabaseAdmin: null, userId: null, role: null }
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token)

  if (verifyError || !user) {
    console.error('verifyAuthenticatedRequest - verifyError:', verifyError, 'user:', user, 'token length:', token?.length)
    return { error: 'Invalid token', status: 401, supabaseAdmin: null, userId: null, role: null }
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from('tbl_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError) {
    console.error('verifyAuthenticatedRequest - userError:', userError)
    return { error: 'Unable to verify user role', status: 500, supabaseAdmin: null, userId: null, role: null }
  }

  return { error: null, status: 200, supabaseAdmin, userId: user.id, role: userData?.role || null }
}

export async function verifyAdminRequest(request: NextRequest): Promise<AdminAuthResult> {
  const auth = await verifyAuthenticatedRequest(request)
  if (auth.error || !auth.supabaseAdmin || !auth.userId) {
    return { error: auth.error || 'Unauthorized', status: auth.error ? auth.status : 401, supabaseAdmin: null, userId: null }
  }

  if (auth.role !== 'admin') {
    return { error: 'Admin access required', status: 403, supabaseAdmin: null, userId: null }
  }

  return { error: null, status: 200, supabaseAdmin: auth.supabaseAdmin, userId: auth.userId }
}
