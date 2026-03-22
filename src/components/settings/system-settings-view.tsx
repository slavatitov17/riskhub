'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useLocale, type AppLocale } from '@/contexts/locale-context'

export function SystemSettingsView() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl space-y-6"
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/settings">← Назад</Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Системные настройки</h1>
        <p className="text-sm text-muted-foreground">
          Тема оформления и язык интерфейса сохраняются в браузере.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Внешний вид</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Тема</Label>
            <Select
              value={
                !theme || theme === 'system'
                  ? 'system'
                  : theme === 'dark'
                    ? 'dark'
                    : 'light'
              }
              onValueChange={(v) => {
                setTheme(v)
                toast.message(
                  v === 'system'
                    ? 'Как в системе'
                    : v === 'dark'
                      ? 'Тёмная тема'
                      : 'Светлая тема'
                )
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Светлая</SelectItem>
                <SelectItem value="dark">Тёмная</SelectItem>
                <SelectItem value="system">Как в системе</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Язык</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Интерфейс</Label>
          <Select
            value={locale}
            onValueChange={(v) => {
              setLocale(v as AppLocale)
              toast.success(v === 'en' ? 'Language: English' : 'Язык: русский')
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </motion.div>
  )
}
