'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

import { LocaleProvider } from '@/contexts/locale-context'
import { RisksProvider } from '@/contexts/risks-context'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LocaleProvider>
        <RisksProvider>{children}</RisksProvider>
      </LocaleProvider>
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  )
}
