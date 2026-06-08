'use client'

import { useInactivityLogout } from '@/lib/useInactivityLogout'

export function InactivityLogoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useInactivityLogout()

  return <>{children}</>
}
