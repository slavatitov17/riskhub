'use client'

import Link from 'next/link'
import {
  BarChart3,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield
} from 'lucide-react'

import { useLocale } from '@/contexts/locale-context'
import { cn } from '@/lib/utils'

interface AppSidebarProps {
  pathname: string
  onNavigate?: () => void
}

export function AppSidebar({ pathname, onNavigate }: AppSidebarProps) {
  const { t } = useLocale()

  const navItems = [
    { href: '/panel', label: t('navPanel'), icon: LayoutDashboard },
    { href: '/projects', label: t('navProjects'), icon: FolderKanban },
    { href: '/risks', label: t('navRisks'), icon: ListChecks },
    { href: '/analytics', label: t('navAnalytics'), icon: BarChart3 },
    { href: '/settings', label: t('navSettings'), icon: Settings }
  ] as const

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" aria-hidden />
        </div>
        <span className="text-lg font-semibold tracking-tight">RiskHub</span>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3"
        aria-label="Основная навигация"
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/panel'
              ? pathname === '/panel'
              : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')}
                aria-hidden
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 border-t p-3">
        <Link
          href="/help"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <CircleHelp className="h-5 w-5 shrink-0" aria-hidden />
          {t('navHelp')}
        </Link>
      </div>
    </div>
  )
}
