import type { Metadata } from 'next'
import { ConfigProvider, theme } from 'antd'
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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0b0f1a' }}>
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorPrimary: '#3b82f6',
              colorBgBase: '#0b0f1a',
              colorBgContainer: '#111827',
              colorBgElevated: '#1a2236',
              colorBgLayout: '#0b0f1a',
              colorTextBase: '#f0f4f8',
              colorTextSecondary: '#94a3b8',
              colorTextTertiary: '#64748b',
              colorBorder: '#253347',
              colorBorderSecondary: '#1e2d45',
              borderRadius: 6,
              borderRadiusSM: 4,
              borderRadiusLG: 8,
              fontSize: 13,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              controlHeight: 32,
              controlHeightLG: 40,
            },
            components: {
              Button: {
                defaultBg: '#1a2236',
                defaultBorderColor: '#253347',
                defaultColor: '#f0f4f8',
                primaryShadow: 'none',
              },
              Input: {
                activeBg: '#0f172a',
                activeBorderColor: '#3b82f6',
                activeShadow: '0 0 0 2px rgba(59, 130, 246, 0.15)',
                colorBgContainer: '#0f172a',
              },
              Select: {
                colorBgContainer: '#0f172a',
                colorBgElevated: '#1a2236',
                optionSelectedBg: 'rgba(59, 130, 246, 0.15)',
              },
              Table: {
                colorBgContainer: 'transparent',
                headerBg: '#111827',
                headerColor: '#94a3b8',
                rowHoverBg: '#1e293b',
                borderColor: '#1e2d45',
              },
              Card: {
                colorBgContainer: '#111827',
                colorBorderSecondary: '#1e2d45',
              },
              Modal: {
                contentBg: '#111827',
                headerBg: '#111827',
                footerBg: '#111827',
              },
              Menu: {
                darkItemBg: 'transparent',
                darkItemSelectedBg: '#1a2236',
                darkItemHoverBg: '#141b2d',
              },
            },
          }}
        >
          <InactivityLogoutProvider>
            <div style={{ minHeight: '100vh', backgroundColor: '#0b0f1a' }}>
              {children}
            </div>
          </InactivityLogoutProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}
