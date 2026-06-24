export async function getAdminAuthHeader(): Promise<string> {
  // For client-side usage, get token from document.cookie
  if (typeof window !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1]

    if (!token) {
      throw new Error('No active session')
    }

    return `Bearer ${token}`
  }

  // For server-side usage, this shouldn't be called from client components
  throw new Error('getAdminAuthHeader called on server side - use cookies() directly instead')
}