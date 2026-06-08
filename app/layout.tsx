import type { Metadata } from 'next'
import { ConfigProvider } from 'antd'
import { InactivityLogoutProvider } from '@/components/InactivityLogoutProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ticket System',
  description: 'Support & Issue Tracking Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0e1a' }}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#3b82f6',
              colorBgBase: '#0a0e1a',
              colorTextBase: '#f1f5f9',
              borderRadius: 8,
              colorBorder: '#334155',
              colorBgContainer: '#1e293b',
              colorBgElevated: '#1e293b',
              colorTextSecondary: '#94a3b8',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
          }}
        >
          <InactivityLogoutProvider>
            <div style={{ minHeight: '100vh', backgroundColor: '#0a0e1a' }}>
              {children}
            </div>
          </InactivityLogoutProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
