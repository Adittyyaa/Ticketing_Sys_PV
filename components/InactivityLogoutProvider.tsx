'use client'

import { useInactivityLogout } from '@/hooks/useInactivityLogout'

export function InactivityLogoutProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useInactivityLogout()

  return <>{children}</>
}
