'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { RiskDetailView } from '@/components/risks/risk-detail-view'
import { Button } from '@/components/ui/button'
import { useRisks } from '@/contexts/risks-context'

export default function RiskDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { getById } = useRisks()
  const risk = getById(id)

  if (!risk) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Риск не найден</h1>
        <p className="text-sm text-muted-foreground">
          Возможно, запись удалена или ссылка устарела.
        </p>
        <Button asChild>
          <Link href="/risks">К списку рисков</Link>
        </Button>
      </div>
    )
  }

  return <RiskDetailView risk={risk} />
}
