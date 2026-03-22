'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ensureDemoUser,
  getSession,
  loginUser,
  registerUser
} from '@/lib/auth-storage'

export function AuthPage() {
  const router = useRouter()
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')

  useEffect(() => {
    ensureDemoUser()
    if (getSession()) router.replace('/panel')
  }, [router])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const res = loginUser({ email: loginEmail, password: loginPassword })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('С возвращением!')
    router.push('/panel')
    router.refresh()
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    const res = registerUser({
      name: regName,
      email: regEmail,
      password: regPassword
    })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Аккаунт создан, вы вошли в систему')
    router.push('/panel')
    router.refresh()
  }

  const handleDemoFill = () => {
    setLoginEmail('demo@riskhub.local')
    setLoginPassword('demo123')
    toast.message('Подставлен демо-аккаунт — нажмите «Войти»')
  }

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex w-full max-w-lg flex-col gap-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            RiskHub
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            База знаний по рискам ИТ-проектов
          </p>
        </div>

        <Card className="border bg-card/95 shadow-lg backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Доступ к системе</CardTitle>
            <CardDescription>
              Войдите или создайте локальный аккаунт — данные хранятся в браузере.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Вход</TabsTrigger>
                <TabsTrigger value="register">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4 space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="login-password">Пароль</Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-xs"
                          >
                            Забыли пароль?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Восстановление доступа</DialogTitle>
                            <DialogDescription>
                              Демо-режим: укажите email — мы покажем подсказку
                              (без реальной отправки писем).
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label htmlFor="forgot">Email</Label>
                            <Input
                              id="forgot"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="you@company.com"
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              onClick={() => {
                                toast.success(
                                  forgotEmail
                                    ? `Инструкция «отправлена» на ${forgotEmail}`
                                    : 'Введите email для подсказки'
                                )
                              }}
                            >
                              Отправить подсказку
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Войти
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={handleDemoFill}
                  >
                    Заполнить демо-данные
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-4 space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Имя</Label>
                    <Input
                      id="reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      placeholder="Алексей Иванов"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Пароль</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={4}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Создать аккаунт
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Нажимая «Войти» или «Создать аккаунт», вы соглашаетесь с{' '}
          <Link href="/terms" className="underline underline-offset-2">
            условиями
          </Link>{' '}
          и{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            политикой конфиденциальности
          </Link>
          .
        </p>

        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link
            href="/about"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            О системе
          </Link>
          <Link
            href="/support"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Помощь
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
