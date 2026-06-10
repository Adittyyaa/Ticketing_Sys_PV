import type { Metadata } from 'next'
import { ConfigProvider } from 'antd'
import { InactivityLogoutProvider } from '@/components/InactivityLogoutProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stellar CRM',
  description: 'Enterprise CRM & Deal Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F9FAFB' }}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1f2937',
              colorBgBase: '#F9FAFB',
              colorTextBase: '#111827',
              borderRadius: 6,
              colorBorder: '#e5e7eb',
              colorBgContainer: '#FFFFFF',
              colorBgElevated: '#FFFFFF',
              colorTextSecondary: '#6b7280',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
          }}
        >
          <InactivityLogoutProvider>
            <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
              {children}
            </div>
          </InactivityLogoutProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
