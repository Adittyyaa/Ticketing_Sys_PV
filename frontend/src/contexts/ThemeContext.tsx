'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  zoom: string
  changeZoom: (zoom: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [zoom, setZoom] = useState('100%')

  useEffect(() => {
    // Use setTimeout to avoid direct setState in effect
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme) {
        setTheme(savedTheme)
      }
      const savedZoom = localStorage.getItem('zoom') || '100%'
      setZoom(savedZoom)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.zoom = zoom
    localStorage.setItem('zoom', zoom)
  }, [zoom])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const changeZoom = (newZoom: string) => {
    setZoom(newZoom)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, zoom, changeZoom }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}