import { Suspense } from 'react'

import { NewRiskPageClient } from './new-risk-client'

export default function NewRiskPage() {
  return (
    <Suspense
      fallback={
        <p className="p-4 text-center text-sm text-muted-foreground">
          Загрузка…
        </p>
      }
    >
      <NewRiskPageClient />
    </Suspense>
  )
}
