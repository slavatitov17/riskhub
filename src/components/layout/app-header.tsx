'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useLocale } from '@/contexts/locale-context'
import type { Crumb } from '@/lib/breadcrumbs-i18n'
import { clearSession, getSession } from '@/lib/auth-storage'

const demoNotifications = [
  {
    id: '1',
    title: 'Просрочена мера',
    body: 'Риск R-104 — обновите документацию до конца недели.',
    tone: 'destructive' as const
  },
  {
    id: '2',
    title: 'Напоминание',
    body: 'Проверка риска R-101 через 2 дня.',
    tone: 'default' as const
  },
  {
    id: '3',
    title: 'Комментарий',
    body: 'Новый комментарий к риску R-99.',
    tone: 'default' as const
  }
]

interface AppHeaderProps {
  crumbs: Crumb[]
}

export function AppHeader({ crumbs }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useLocale()
  const [userName, setUserName] = useState('Пользователь')

  useEffect(() => {
    setUserName(getSession()?.name ?? 'Пользователь')
  }, [pathname])

  const [notifOpen, setNotifOpen] = useState(false)

  const initials = userName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    clearSession()
    toast.success(
      locale === 'en' ? 'Signed out' : 'Вы вышли из системы'
    )
    router.replace('/')
    router.refresh()
  }

  const handleProfile = () => {
    router.push('/settings')
    toast.message(
      locale === 'en'
        ? 'Open profile in Settings'
        : 'Профиль открыт в разделе «Настройки»'
    )
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 md:h-16 md:px-6">
        <div className="min-w-0 flex-1">
          <AppBreadcrumbs items={crumbs} />
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Уведомления"
            onClick={() => setNotifOpen(true)}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="gap-2 px-2"
                aria-label="Меню профиля"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="" />
                  <AvatarFallback className="bg-primary/15 text-xs text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>
                {locale === 'en' ? 'Profile' : 'Профиль'}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/system">
                  {locale === 'en' ? 'System settings' : 'Системные настройки'}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                {locale === 'en' ? 'Sign out' : 'Выйти'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === 'en' ? 'Notifications' : 'Уведомления'}
            </DialogTitle>
          </DialogHeader>
          <ul className="flex flex-col gap-2">
            {demoNotifications.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border p-3 text-sm leading-snug"
              >
                <p
                  className={
                    n.tone === 'destructive'
                      ? 'font-medium text-destructive'
                      : 'font-medium'
                  }
                >
                  {n.title}
                </p>
                <p className="mt-1 text-muted-foreground">{n.body}</p>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0 text-primary"
                  type="button"
                  onClick={() => {
                    setNotifOpen(false)
                    router.push('/risks')
                    toast.success(
                      locale === 'en'
                        ? 'Opening risk from notification'
                        : 'Переход к риску из уведомления'
                    )
                  }}
                >
                  {locale === 'en' ? 'Open in list' : 'Открыть в списке'}
                </Button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setNotifOpen(false)
              toast.success(
                locale === 'en'
                  ? 'All notifications marked as read'
                  : 'Все уведомления отмечены прочитанными'
              )
            }}
          >
            {locale === 'en' ? 'Mark all as read' : 'Отметить все прочитанными'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
