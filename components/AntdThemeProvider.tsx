'use client'

import { ConfigProvider, theme } from 'antd'
import { useTheme } from '@/contexts/ThemeContext'
import { ReactNode } from 'react'

export function AntdThemeProvider({ children }: { children: ReactNode }) {
  const { theme: currentTheme } = useTheme()

  const isDark = currentTheme === 'dark'

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgBase: isDark ? '#0b0f1a' : '#ffffff',
          colorBgContainer: isDark ? '#111827' : '#f8fafc',
          colorBgElevated: isDark ? '#1a2236' : '#f1f5f9',
          colorBgLayout: isDark ? '#0b0f1a' : '#ffffff',
          colorTextBase: isDark ? '#f0f4f8' : '#0f172a',
          colorTextSecondary: isDark ? '#94a3b8' : '#475569',
          colorTextTertiary: isDark ? '#64748b' : '#64748b',
          colorBorder: isDark ? '#253347' : '#cbd5e1',
          colorBorderSecondary: isDark ? '#1e2d45' : '#e2e8f0',
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
            defaultBg: isDark ? '#1a2236' : '#ffffff',
            defaultBorderColor: isDark ? '#253347' : '#cbd5e1',
            defaultColor: isDark ? '#f0f4f8' : '#0f172a',
            primaryShadow: 'none',
          },
          Input: {
            activeBg: isDark ? '#0f172a' : '#ffffff',
            activeBorderColor: '#3b82f6',
            activeShadow: '0 0 0 2px rgba(59, 130, 246, 0.15)',
            colorBgContainer: isDark ? '#0f172a' : '#ffffff',
          },
          Select: {
            colorBgContainer: isDark ? '#0f172a' : '#ffffff',
            colorBgElevated: isDark ? '#1a2236' : '#f1f5f9',
            optionSelectedBg: 'rgba(59, 130, 246, 0.15)',
          },
          Table: {
            colorBgContainer: 'transparent',
            headerBg: isDark ? '#111827' : '#f8fafc',
            headerColor: isDark ? '#94a3b8' : '#475569',
            rowHoverBg: isDark ? '#1e293b' : '#e2e8f0',
            borderColor: isDark ? '#1e2d45' : '#e2e8f0',
          },
          Card: {
            colorBgContainer: isDark ? '#111827' : '#f8fafc',
            colorBorderSecondary: isDark ? '#1e2d45' : '#e2e8f0',
          },
          Modal: {
            contentBg: isDark ? '#111827' : '#ffffff',
            headerBg: isDark ? '#111827' : '#ffffff',
            footerBg: isDark ? '#111827' : '#ffffff',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: isDark ? '#1a2236' : '#e2e8f0',
            darkItemHoverBg: isDark ? '#141b2d' : '#f1f5f9',
          },
        },
      }}
    >
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: isDark ? '#0b0f1a' : '#ffffff',
        transition: 'background-color 0.2s ease'
      }}>
        {children}
      </div>
    </ConfigProvider>
  )
}
