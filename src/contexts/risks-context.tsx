'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import type { RiskRecord } from '@/lib/risk-types'
import { loadRisks, saveRisks } from '@/lib/risks-storage'

interface RisksContextValue {
  risks: RiskRecord[]
  refresh: () => void
  addRisk: (risk: Omit<RiskRecord, 'id' | 'code' | 'created' | 'updated'>) => RiskRecord
  updateRisk: (id: string, patch: Partial<RiskRecord>) => void
  removeRisk: (id: string) => void
  getById: (id: string) => RiskRecord | undefined
}

const RisksContext = createContext<RisksContextValue | null>(null)

function nextCode(list: RiskRecord[]) {
  const nums = list
    .map((r) => parseInt(r.code.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `R-${String(max + 1).padStart(3, '0')}`
}

export function RisksProvider({ children }: { children: React.ReactNode }) {
  const [risks, setRisks] = useState<RiskRecord[]>([])

  const refresh = useCallback(() => {
    setRisks(loadRisks())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const persist = useCallback((next: RiskRecord[]) => {
    saveRisks(next)
    setRisks(next)
  }, [])

  const addRisk = useCallback(
    (
      input: Omit<RiskRecord, 'id' | 'code' | 'created' | 'updated'>
    ): RiskRecord => {
      const list = loadRisks()
      const today = new Date().toISOString().slice(0, 10)
      const row: RiskRecord = {
        ...input,
        id: `r_${crypto.randomUUID()}`,
        code: nextCode(list),
        created: today,
        updated: today
      }
      persist([row, ...list])
      return row
    },
    [persist]
  )

  const updateRisk = useCallback(
    (id: string, patch: Partial<RiskRecord>) => {
      const list = loadRisks()
      const today = new Date().toISOString().slice(0, 10)
      persist(
        list.map((r) =>
          r.id === id ? { ...r, ...patch, updated: today } : r
        )
      )
    },
    [persist]
  )

  const removeRisk = useCallback(
    (id: string) => {
      persist(loadRisks().filter((r) => r.id !== id))
    },
    [persist]
  )

  const getById = useCallback(
    (id: string) => risks.find((r) => r.id === id),
    [risks]
  )

  const value = useMemo(
    () => ({
      risks,
      refresh,
      addRisk,
      updateRisk,
      removeRisk,
      getById
    }),
    [risks, refresh, addRisk, updateRisk, removeRisk, getById]
  )

  return (
    <RisksContext.Provider value={value}>{children}</RisksContext.Provider>
  )
}

export function useRisks() {
  const ctx = useContext(RisksContext)
  if (!ctx) throw new Error('useRisks must be used within RisksProvider')
  return ctx
}
