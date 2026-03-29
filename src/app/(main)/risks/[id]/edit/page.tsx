'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { RiskFormView } from '@/components/risks/risk-form-view'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import { isCurrentUserRiskAuthor } from '@/lib/user-display'

export default function EditRiskPage() {
  const params = useParams()
  const id = params?.id as string
  const { getById } = useRisks()
  const { accessibleProjectIds, ready } = useProjects()
  const risk = getById(id)

  if (!risk) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Риск не найден</h1>
        <Button asChild>
          <Link href="/risks">К рискам</Link>
        </Button>
      </div>
    )
  }

  if (!isCurrentUserRiskAuthor(risk.author)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Нет доступа</h1>
        <p className="text-sm text-muted-foreground">
          Редактирование доступно только автору карточки риска.
        </p>
        <Button asChild>
          <Link href={`/risks/${risk.id}`}>К карточке риска</Link>
        </Button>
      </div>
    )
  }

  if (
    ready &&
    risk.projectId &&
    !accessibleProjectIds.has(risk.projectId)
  ) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Нет доступа</h1>
        <p className="text-sm text-muted-foreground">
          Редактирование недоступно: нет доступа к проекту этого риска.
        </p>
        <Button asChild>
          <Link href="/risks">К рискам</Link>
        </Button>
      </div>
    )
  }

  return <RiskFormView mode="edit" initial={risk} />
}
