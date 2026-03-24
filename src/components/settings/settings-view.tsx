'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { getSession, updateSessionName } from '@/lib/auth-storage'

const demoUsers = [
  {
    id: '1',
    name: 'Мария Иванова',
    email: 'maria@company.com',
    role: 'Менеджер'
  },
  {
    id: '2',
    name: 'Пётр Смирнов',
    email: 'petr@company.com',
    role: 'Пользователь'
  }
]

export function SettingsView() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const s = getSession()
    if (s?.name) setName(s.name)
    if (s?.email) setEmail(s.email)
  }, [])
  const [emailNotif, setEmailNotif] = useState(true)
  const [inApp, setInApp] = useState(true)

  const handleSaveProfile = () => {
    updateSessionName(name)
    toast.success('Профиль сохранён')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-6xl flex-col gap-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Профиль
        </h1>
        <Button variant="outline" asChild>
          <Link href="/settings">Системные настройки</Link>
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="access">Права доступа</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Ваш профиль</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback>
                      {name.slice(0, 2).toUpperCase() || 'RH'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{name || 'Пользователь'}</p>
                    <Badge variant="secondary" className="mt-1">
                      Менеджер
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="set-name">Имя</Label>
                  <Input
                    id="set-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="set-email">Email</Label>
                  <Input id="set-email" value={email} readOnly />
                </div>
                <Button type="button" className="w-full" onClick={handleSaveProfile}>
                  Сохранить изменения
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Настройки уведомлений</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={emailNotif}
                    onCheckedChange={(v) => setEmailNotif(!!v)}
                  />
                  Получать уведомления на Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={inApp} onCheckedChange={(v) => setInApp(!!v)} />
                  Встроенные оповещения
                </label>
                <Separator />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => toast.success('Настройки уведомлений сохранены')}
                >
                  Сохранить уведомления
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Управление правами пользователей
              </CardTitle>
              <Badge variant="outline" className="w-fit">
                Только для администраторов
              </Badge>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Пользователь</TableHead>
                    <TableHead className="whitespace-nowrap">Email</TableHead>
                    <TableHead className="whitespace-nowrap">Роль</TableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      Действия
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {u.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{u.email}</TableCell>
                      <TableCell className="whitespace-nowrap">{u.role}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0"
                          onClick={() =>
                            toast.success(`Роль для ${u.name} сохранена (демо)`)
                          }
                        >
                          Сохранить
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-destructive"
                          onClick={() =>
                            toast.message('Удаление пользователя отключено в демо')
                          }
                        >
                          Удалить
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">История действий</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>25.05.2025 08:15 — {name || 'Пользователь'} изменил статус риска</p>
              <p>24.05.2025 17:40 — Система: резервная копия (демо)</p>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => toast.message('Загрузка истории (демо)')}
              >
                Показать ещё
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
