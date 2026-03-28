'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SupportContactCard } from '@/components/help/support-contact-card'
import { SupportHelpSections } from '@/components/help/support-help-sections'
import { Button } from '@/components/ui/button'

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

        <SupportContactCard
          idsPrefix="support"
          cardClassName="border bg-card/95 shadow-lg backdrop-blur"
        />
      </div>
    </div>
  )
}
