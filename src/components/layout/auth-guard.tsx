'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { getSession } from '@/lib/auth-storage'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/')
      setAllowed(false)
      return
    }
    setAllowed(true)
  }, [router])

  if (allowed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}
