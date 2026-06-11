'use client'

import { ConfigProvider } from 'antd'
import { InactivityLogoutProvider } from '@/components/InactivityLogoutProvider'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AntdThemeProvider } from '@/components/AntdThemeProvider'
import './globals.css'

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
        <title>Ticket System</title>
        <meta name="description" content="Support & Issue Tracking Platform" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ThemeProvider>
          <AntdThemeProvider>
            <InactivityLogoutProvider>
              {children}
            </InactivityLogoutProvider>
          </AntdThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
