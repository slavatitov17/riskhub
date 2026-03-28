'use client'

import { useMemo } from 'react'

import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'

export function useVisibleRisks() {
  const { risks } = useRisks()
  const { accessibleProjectIds, ready } = useProjects()

  return useMemo(() => {
    if (!ready) return []
    return risks.filter(
      (r) => r.projectId && accessibleProjectIds.has(r.projectId)
    )
  }, [risks, accessibleProjectIds, ready])
}
