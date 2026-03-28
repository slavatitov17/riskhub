'use client'

import { useSearchParams } from 'next/navigation'

import { RiskFormView } from '@/components/risks/risk-form-view'

export function NewRiskPageClient() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') ?? undefined
  return <RiskFormView mode="new" presetProjectId={projectId} />
}
