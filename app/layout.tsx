import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ticketing App — Support & Issue Tracking',
  description: 'Enterprise-grade ticket management platform for PV Advisory.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} bg-canvas`}>
      <body className="bg-canvas text-ink font-sans antialiased">{children}</body>
    </html>
  )
}
