'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const items = [
  {
    id: '1',
    q: 'Как добавить риск?',
    a: 'Нажмите «Новый риск» в списке или на панели, заполните форму и сохраните.'
  },
  {
    id: '2',
    q: 'Где хранятся данные?',
    a: 'В localStorage вашего браузера. Не очищайте данные сайта, если нужно сохранить реестр.'
  },
  {
    id: '3',
    q: 'Как экспортировать отчёт?',
    a: 'На странице аналитики используйте кнопки Excel/PDF — в демо это имитация.'
  }
]

export function HelpView() {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Помощь</h1>
        <p className="text-muted-foreground">
          Быстрые ответы и обратная связь (демо).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isOpen = open === item.id
          return (
            <Card key={item.id} className="overflow-hidden">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 p-4 text-left"
                onClick={() => setOpen(isOpen ? null : item.id)}
              >
                <span className="font-medium">{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <CardContent className="border-t pt-0 text-sm text-muted-foreground">
                  <p className="py-3">{item.a}</p>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-medium">
            <MessageCircle className="h-4 w-4" />
            Написать в поддержку
          </div>
          <Input placeholder="Тема обращения" id="help-subject" />
          <Textarea placeholder="Опишите проблему..." rows={4} id="help-body" />
          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              toast.success('Обращение отправлено (демо)')
            }}
          >
            <Mail className="h-4 w-4" />
            Отправить
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 text-sm">
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/support">Публичная справка</Link>
        </Button>
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/privacy">Политика конфиденциальности</Link>
        </Button>
      </div>
    </motion.div>
  )
}
