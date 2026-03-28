'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useLocale, type AppLocale } from '@/contexts/locale-context'

const NOTIFICATION_PREFS_KEY = 'riskhub_notification_prefs'

interface NotificationPrefs {
  email: boolean
  inApp: boolean
}

function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return { email: false, inApp: false }
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY)
    if (!raw) return { email: false, inApp: false }
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>
    return {
      email: !!parsed.email,
      inApp: !!parsed.inApp
    }
  } catch {
    return { email: false, inApp: false }
  }
}

export function SystemSettingsView() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: false,
    inApp: false
  })

  useEffect(() => {
    setNotifPrefs(readNotificationPrefs())
  }, [])

  const persistNotif = (next: NotificationPrefs) => {
    setNotifPrefs(next)
    localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next))
  }

  const themeValue = theme === 'dark' ? 'dark' : 'light'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Интерфейс</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Тема</Label>
            <Select
              value={themeValue}
              onValueChange={(v) => {
                setTheme(v)
                toast.message(v === 'dark' ? 'Тёмная тема' : 'Светлая тема')
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Светлая</SelectItem>
                <SelectItem value="dark">Тёмная</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Язык</Label>
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
                <SelectItem value="en">Английский</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Другое</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">Уведомления</p>
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={notifPrefs.email}
                onCheckedChange={(v) =>
                  persistNotif({ ...notifPrefs, email: !!v })
                }
              />
              Получать уведомления на Email
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={notifPrefs.inApp}
                onCheckedChange={(v) =>
                  persistNotif({ ...notifPrefs, inApp: !!v })
                }
              />
              Встроенные оповещения
            </label>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
