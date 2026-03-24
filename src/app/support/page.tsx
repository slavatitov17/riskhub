'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

import { SupportHelpSections } from '@/components/help/support-help-sections'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function SupportPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 md:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/">← Назад</Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold tracking-tight">Помощь</h1>
          <p className="mt-2 text-muted-foreground">
            Инструкции по работе с системой и ответы на частые вопросы.
          </p>
        </motion.div>

        <SupportHelpSections />

        <Card className="border bg-card/95 shadow-lg backdrop-blur">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Написать в поддержку
            </div>
            <Input placeholder="Тема обращения" id="support-subject" />
            <Textarea placeholder="Опишите проблему..." rows={4} id="support-body" />
            <Button
              type="button"
              className="gap-2"
              onClick={() => toast.success('Обращение отправлено (демо)')}
            >
              <Mail className="h-4 w-4" />
              Отправить
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
