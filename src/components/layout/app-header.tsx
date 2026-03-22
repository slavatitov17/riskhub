import { Bell, ChevronDown } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface AppHeaderProps {
  title?: string
  userName?: string
}

export function AppHeader({
  title,
  userName = 'Алексей'
}: AppHeaderProps) {
  const initials = userName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6">
      {title ? (
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      ) : (
        <p className="text-lg text-foreground">
          Добро пожаловать,{' '}
          <span className="font-semibold">{userName}</span>!
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Уведомления"
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
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Профиль</DropdownMenuItem>
            <DropdownMenuItem>Выйти</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
