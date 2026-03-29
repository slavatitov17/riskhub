'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useLocale, type AppLocale } from '@/contexts/locale-context'
import { toast } from '@/lib/app-toast'
import { getPageCopy } from '@/lib/page-copy'
import {
  readNotificationPrefs,
  writeNotificationPrefs,
  type NotificationPrefs
} from '@/lib/notification-prefs'

export function SystemSettingsView() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()
  const p = getPageCopy(locale)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: false,
    inApp: true
  })

  useEffect(() => {
    setNotifPrefs(readNotificationPrefs())
  }, [])

  const persistNotif = (next: NotificationPrefs) => {
    setNotifPrefs(next)
    writeNotificationPrefs(next)
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
          <CardTitle className="text-base">{p.settingsSystem.interface}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{p.settingsSystem.theme}</Label>
            <Select
              value={themeValue}
              onValueChange={(v) => {
                setTheme(v)
                toast.message(
                  v === 'dark'
                    ? p.settingsSystem.themeToastDark
                    : p.settingsSystem.themeToastLight
                )
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{p.settingsSystem.themeLight}</SelectItem>
                <SelectItem value="dark">{p.settingsSystem.themeDark}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{p.settingsSystem.language}</Label>
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
          <CardTitle className="text-base">{p.settingsSystem.other}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium">{p.settingsSystem.notificationsHeading}</p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-foreground">
                {p.settingsSystem.emailNotif}
              </span>
              <Switch
                checked={notifPrefs.email}
                onCheckedChange={(v) =>
                  persistNotif({ ...notifPrefs, email: v })
                }
                aria-label={p.settingsSystem.emailNotifAria}
              />
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-foreground">{p.settingsSystem.inAppNotif}</span>
              <Switch
                checked={notifPrefs.inApp}
                onCheckedChange={(v) =>
                  persistNotif({ ...notifPrefs, inApp: v })
                }
                aria-label={p.settingsSystem.inAppNotifAria}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
