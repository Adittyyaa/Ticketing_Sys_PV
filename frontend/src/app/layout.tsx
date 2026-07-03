'use client'

import { Providers } from '@/components'
import { ThemeProvider } from '@/contexts/ThemeContext'
import '@/styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/logo.jpeg" type="image/jpeg" />
        <title>Ticketing System</title>
        <meta name="description" content="Support & Issue Tracking Platform" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProvider>
          <Providers.AuthInitProvider>
            <Providers.AntdThemeProvider>
              <Providers.InactivityLogoutProvider>
                {children}
              </Providers.InactivityLogoutProvider>
            </Providers.AntdThemeProvider>
          </Providers.AuthInitProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
