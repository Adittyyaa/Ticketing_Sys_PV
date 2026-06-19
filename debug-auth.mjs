import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

async function run() {
  try {
    console.log('Fetching users from tbl_users...')
    const { data, error } = await supabaseAdmin
      .from('tbl_users')
      .select('*')

    if (error) {
      throw error
    }

    console.log('Found users in tbl_users:')
    console.log(JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error:', err.message || err)
  }
}

run()
