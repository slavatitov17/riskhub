'use client'

import { usePathname } from 'next/navigation'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  headerTitle?: string
}

export function DashboardShell({ children, headerTitle }: DashboardShellProps) {
  const pathname = usePathname() ?? '/'

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AppSidebar pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title={headerTitle} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
