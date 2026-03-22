'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faq = [
  {
    q: 'Где хранятся мои данные?',
    a: 'В локальном хранилище браузера. Очистка кеша может удалить аккаунт и риски.'
  },
  {
    q: 'Как сбросить пароль?',
    a: 'В демо-режиме используйте форму «Забыли пароль?» — письма не отправляются, это имитация UX.'
  },
  {
    q: 'Есть ли мобильная версия?',
    a: 'Да, интерфейс адаптирован под телефоны и планшеты: меню открывается слева.'
  }
]

export default function SupportPage() {
  return (
    <div className="min-h-dvh bg-muted/30 px-4 py-10 md:py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" asChild>
            <Link href="/">← Вход</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">О системе</Link>
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Справка и FAQ</h1>
          <p className="mt-2 text-muted-foreground">
            Ответы на частые вопросы до входа в систему.
          </p>
        </motion.div>
        <div className="flex flex-col gap-4">
          {faq.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.q}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {item.a}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
