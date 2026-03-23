'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

import { LocaleProvider } from '@/contexts/locale-context'
import { NotificationsProvider } from '@/contexts/notifications-context'
import { RisksProvider } from '@/contexts/risks-context'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LocaleProvider>
        <NotificationsProvider>
          <RisksProvider>{children}</RisksProvider>
        </NotificationsProvider>
      </LocaleProvider>
      <Toaster richColors position="top-center" closeButton />
    </ThemeProvider>
  )
}
