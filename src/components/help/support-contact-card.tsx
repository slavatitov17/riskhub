'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { toast } from '@/lib/app-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/contexts/locale-context'
import { getSession } from '@/lib/auth-storage'
import { getPageCopy } from '@/lib/page-copy'

interface SupportContactCardProps {
  idsPrefix: string
  cardClassName?: string
}

export function SupportContactCard({ idsPrefix, cardClassName }: SupportContactCardProps) {
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const [email, setEmail] = useState('')

  useEffect(() => {
    setEmail(getSession()?.email ?? '')
  }, [])

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className="text-xl">{p.helpContact.title}</CardTitle>
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
            {p.helpContact.subjectPlaceholder}
          </Label>
          <Input
            id={`${idsPrefix}-subject`}
            placeholder={p.helpContact.subjectPlaceholder}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idsPrefix}-body`} className="sr-only">
            {p.helpContact.messageLabel}
          </Label>
          <Textarea
            id={`${idsPrefix}-body`}
            placeholder={p.helpContact.messagePlaceholder}
            rows={4}
          />
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => toast.success(p.helpContact.sentDemo)}
        >
          <Mail className="h-4 w-4" />
          {p.helpContact.send}
        </Button>
      </CardContent>
    </Card>
  )
}
