'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import { AiAssistantDock } from '@/components/ai/ai-assistant-dock'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useLocale } from '@/contexts/locale-context'
import { getBreadcrumbs } from '@/lib/breadcrumbs-i18n'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname() ?? '/panel'
  const { locale, t } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)

  const crumbs = getBreadcrumbs(pathname, locale)

  return (
    <div
      data-dashboard-shell
      className="flex h-dvh max-h-dvh overflow-hidden bg-muted/40"
    >
      <aside className="hidden h-full w-60 shrink-0 border-r bg-card md:flex md:flex-col">
        <AppSidebar pathname={pathname} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100%,18rem)] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Меню</SheetTitle>
          </SheetHeader>
          <AppSidebar
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-card px-4 py-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('openMenu')}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">RiskHub</span>
        </div>

        <AppHeader crumbs={crumbs} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 md:p-6">
          {children}
        </main>
      </div>
      <AiAssistantDock />
    </div>
  )
}
