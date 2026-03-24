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

export function HelpView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <SupportHelpSections />

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 font-medium">
            <MessageCircle className="h-4 w-4" aria-hidden />
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

      <div className="flex flex-wrap gap-4 text-sm">
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/legal/about">О системе</Link>
        </Button>
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/legal/terms">Условия использования</Link>
        </Button>
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/legal/privacy">Политика конфиденциальности</Link>
        </Button>
      </div>
    </motion.div>
  )
}
