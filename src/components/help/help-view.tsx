'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { SupportContactCard } from '@/components/help/support-contact-card'
import { SupportHelpSections } from '@/components/help/support-help-sections'
import { Button } from '@/components/ui/button'

export function HelpView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-3xl flex-col gap-6"
    >
      <SupportHelpSections />

      <SupportContactCard idsPrefix="help" />

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
