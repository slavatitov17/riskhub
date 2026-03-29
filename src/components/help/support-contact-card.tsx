'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { toast } from '@/lib/app-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getSession } from '@/lib/auth-storage'

interface SupportContactCardProps {
  idsPrefix: string
  cardClassName?: string
}

export function SupportContactCard({ idsPrefix, cardClassName }: SupportContactCardProps) {
  const [email, setEmail] = useState('')

  useEffect(() => {
    setEmail(getSession()?.email ?? '')
  }, [])

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className="text-xl">Обращение в поддержку</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`${idsPrefix}-email`}>Email</Label>
          <Input
            id={`${idsPrefix}-email`}
            type="email"
            autoComplete="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idsPrefix}-subject`} className="sr-only">
            Тема обращения
          </Label>
          <Input
            id={`${idsPrefix}-subject`}
            placeholder="Тема обращения"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idsPrefix}-body`} className="sr-only">
            Сообщение
          </Label>
          <Textarea
            id={`${idsPrefix}-body`}
            placeholder="Опишите проблему..."
            rows={4}
          />
        </div>
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
  )
}
