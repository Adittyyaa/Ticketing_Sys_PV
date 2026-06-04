import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ticketing System',
  description: 'Modern ticketing system for support and issue tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
