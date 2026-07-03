'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Button } from 'antd'
import { SunOutlined, MoonOutlined } from '@ant-design/icons'

interface ThemeToggleProps {
  style?: React.CSSProperties
  size?: 'small' | 'middle' | 'large'
}

export default function ThemeToggle({ style, size = 'middle' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      type="text"
      icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      size={size}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    />
  )
}
