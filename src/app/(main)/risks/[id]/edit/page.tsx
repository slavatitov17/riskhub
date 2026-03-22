'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { RiskFormView } from '@/components/risks/risk-form-view'
import { Button } from '@/components/ui/button'
import { useRisks } from '@/contexts/risks-context'

export default function EditRiskPage() {
  const params = useParams()
  const id = params?.id as string
  const { getById } = useRisks()
  const risk = getById(id)

  if (!risk) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Риск не найден</h1>
        <Button asChild>
          <Link href="/risks">К списку</Link>
        </Button>
      </div>
    )
  }

  return <RiskFormView mode="edit" initial={risk} />
}
