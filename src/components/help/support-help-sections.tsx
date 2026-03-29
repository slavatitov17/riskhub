'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocale } from '@/contexts/locale-context'
import { getPageCopy } from '@/lib/page-copy'

export function SupportHelpSections() {
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const [openId, setOpenId] = useState('0')
  const faq = p.helpFaq

  return (
    <>
      <Card className="border bg-card/95 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">{p.help.helpTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 text-base font-semibold text-foreground">
              {p.help.supportUsers}
            </h2>
            <p>{p.help.supportIntro}</p>
          </section>
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 text-base font-semibold text-foreground">
              {p.help.helpFormatTitle}
            </h2>
            <p>{p.help.helpFormatBody}</p>
          </section>
        </CardContent>
      </Card>

      <Card className="border bg-card/95 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">{p.help.faqTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {faq.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden border bg-card/95 shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  onClick={() =>
                    setOpenId((prev) => (prev === String(i) ? '' : String(i)))
                  }
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${openId === String(i) ? 'rotate-180' : ''}`}
                  />
                </button>
                {openId === String(i) && (
                  <CardContent className="border-t pb-4 pt-4 text-sm text-muted-foreground">
                    {item.a}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
