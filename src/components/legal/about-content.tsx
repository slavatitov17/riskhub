'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useLocale } from '@/contexts/locale-context'
import { getPageCopy } from '@/lib/page-copy'

export function AboutContent() {
  const { locale } = useLocale()
  const { legal } = getPageCopy(locale)

  return (
    <Card className="border bg-card/95 shadow-lg backdrop-blur">
      <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
        {legal.about.sections.map((section) => (
          <section key={section.title} className="space-y-2 rounded-lg border p-4">
            <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}
