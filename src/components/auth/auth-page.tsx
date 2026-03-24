'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false)
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false)

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
    const strength = getPasswordStrength(regPassword)
    if (strength.level === 'weak') {
      toast.error('Введенный пароль является слабым. Изменить пароль')
      return
    }

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

  const getPasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 6
    const hasLower = /[a-zа-я]/.test(password)
    const hasUpper = /[A-ZА-Я]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecial = /[^A-Za-zА-Яа-я0-9]/.test(password)

    if (!hasMinLength || !hasLower || !hasUpper || !hasDigit)
      return {
        level: 'weak',
        value: 33,
        label: 'Слабый пароль',
        textClass: 'text-red-500',
        barClass: 'bg-red-500'
      } as const
    if (!hasSpecial)
      return {
        level: 'medium',
        value: 66,
        label: 'Средний пароль',
        textClass: 'text-amber-500',
        barClass: 'bg-amber-500'
      } as const
    return {
      level: 'strong',
      value: 100,
      label: 'Надежный пароль',
      textClass: 'text-emerald-500',
      barClass: 'bg-emerald-500'
    } as const
  }

  const registerStrength = getPasswordStrength(regPassword)

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex w-full max-w-lg flex-col gap-6"
      >
        <div className="text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="h-6 w-6" aria-hidden />
            </span>
            RiskHub
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            База знаний по рискам ИТ-проектов
          </p>
        </div>

        <Card className="border bg-card/95 shadow-lg backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Вход в систему</CardTitle>
            <CardDescription>
              Введите данные для входа в систему
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Авторизация</TabsTrigger>
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
                      placeholder="example@mail.ru"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={isLoginPasswordVisible ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
                        aria-label={isLoginPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                        onClick={() => setIsLoginPasswordVisible((prev) => !prev)}
                      >
                        {isLoginPasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
                    Использовать демо-аккаунт
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
                      placeholder="Иван Иванов"
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
                      placeholder="example@mail.ru"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={isRegisterPasswordVisible ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
                        aria-label={isRegisterPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
                        onClick={() => setIsRegisterPasswordVisible((prev) => !prev)}
                      >
                        {isRegisterPasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Минимум 6 символов, включая цифры, строчные и заглавные буквы
                    </p>
                    {regPassword && (
                      <div className="space-y-1">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all ${registerStrength.barClass}`}
                            style={{ width: `${registerStrength.value}%` }}
                          />
                        </div>
                        <p className={`text-xs ${registerStrength.textClass}`}>
                          {registerStrength.label}
                        </p>
                      </div>
                    )}
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
        </p>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">2026, RiskHub</p>
          <div className="flex items-center gap-4">
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
        </div>
      </motion.div>
    </div>
  )
}
