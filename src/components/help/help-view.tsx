'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

import { SupportContactCard } from '@/components/help/support-contact-card'
import { SupportHelpSections } from '@/components/help/support-help-sections'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/contexts/locale-context'
import { getPageCopy } from '@/lib/page-copy'

export function HelpView() {
  const { locale } = useLocale()
  const p = getPageCopy(locale)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-0 max-w-3xl flex-col gap-6"
    >
      <SupportHelpSections />

      <SupportContactCard idsPrefix="help" />

      <div className="flex flex-wrap gap-4 text-sm">
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/legal/about">{p.help.aboutLink}</Link>
        </Button>
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/legal/terms">{p.help.termsLink}</Link>
        </Button>
        <Button variant="link" className="h-auto p-0" asChild>
          <Link href="/legal/privacy">{p.help.privacyLink}</Link>
        </Button>
      </div>
    </motion.div>
  )
}
