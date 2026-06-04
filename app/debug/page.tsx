'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get session
        const { data: { session } } = await supabase.auth.getSession()
        
        console.log('Session:', session?.user)

        if (!session?.user) {
          setData({ error: 'Not logged in' })
          setLoading(false)
          return
        }

        // Try to get user from database
        const { data: userData, error: userError } = await supabase
          .from('tbl_users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('User data:', userData)
        console.log('User error:', userError)

        // Also try calling the RLS function directly
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role')

        console.log('Role from function:', roleData)
        console.log('Role error:', roleError)

        setData({
          session: session.user,
          dbUser: userData,
          dbError: userError?.message,
          roleData: roleData,
          roleError: roleError?.message,
        })
      } catch (error) {
        console.error('Error:', error)
        setData({ error: error })
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Debug: User & Role Data</h1>
      <pre className="bg-slate-800 p-4 rounded-lg overflow-auto text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-blue-600 rounded"
      >
        Refresh
      </button>
    </div>
  )
}
