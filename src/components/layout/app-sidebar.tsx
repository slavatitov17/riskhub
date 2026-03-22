import Link from 'next/link'
import {
  BarChart3,
  CircleHelp,
  LayoutDashboard,
  ListChecks,
  Settings,
  Shield
} from 'lucide-react'

import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Панель', icon: LayoutDashboard },
  { href: '/risks', label: 'Список рисков', icon: ListChecks },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/settings', label: 'Настройки', icon: Settings }
] as const

interface AppSidebarProps {
  pathname: string
}

export function AppSidebar({ pathname }: AppSidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" aria-hidden />
        </div>
        <span className="text-lg font-semibold tracking-tight">RiskHub</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Основная навигация">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-5 w-5', isActive && 'text-primary')}
                aria-hidden
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <CircleHelp className="h-5 w-5" aria-hidden />
          Помощь
        </Link>
      </div>
    </aside>
  )
}
