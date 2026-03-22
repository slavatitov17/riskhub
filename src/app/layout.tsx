import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'RiskHub — база знаний по рискам',
  description: 'Панель управления рисками ИТ-проектов'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
