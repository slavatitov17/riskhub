'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import type {
  RiskActivityLogEntry,
  RiskCreateInput,
  RiskRecord
} from '@/lib/risk-types'
import { loadRisks, saveRisks } from '@/lib/risks-storage'

interface RisksContextValue {
  risks: RiskRecord[]
  refresh: () => void
  addRisk: (risk: RiskCreateInput) => RiskRecord
  updateRisk: (id: string, patch: Partial<RiskRecord>) => void
  removeRisk: (id: string) => void
  getById: (id: string) => RiskRecord | undefined
}

function activityEntriesFromPatch(
  prev: RiskRecord,
  patch: Partial<RiskRecord>,
  at: string
): RiskActivityLogEntry[] {
  const out: RiskActivityLogEntry[] = []
  const push = (message: string) =>
    out.push({ id: crypto.randomUUID(), at, message })

  if (patch.name !== undefined && patch.name !== prev.name)
    push(`Название изменено на «${patch.name}»`)
  if (patch.category !== undefined && patch.category !== prev.category)
    push(`Категория изменена на «${patch.category}»`)
  if (patch.status !== undefined && patch.status !== prev.status)
    push(`Статус изменён на «${patch.status}»`)
  if (
    patch.probability !== undefined &&
    patch.probability !== prev.probability
  )
    push(`Вероятность изменена на «${patch.probability}»`)
  if (patch.impact !== undefined && patch.impact !== prev.impact)
    push(`Воздействие изменено на «${patch.impact}»`)
  if (
    (patch.projectId !== undefined && patch.projectId !== prev.projectId) ||
    (patch.project !== undefined && patch.project !== prev.project)
  ) {
    const label = patch.project ?? prev.project
    push(`Проект изменён на «${label}»`)
  }
  if (patch.author !== undefined && patch.author !== prev.author)
    push(`Автор изменён на «${patch.author}»`)
  if (
    patch.description !== undefined &&
    patch.description !== prev.description
  )
    push('Описание риска обновлено')

  return out
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

  useEffect(() => {
    const handleProjectsReady = () => refresh()
    window.addEventListener('riskhub-projects-ready', handleProjectsReady)
    return () =>
      window.removeEventListener('riskhub-projects-ready', handleProjectsReady)
  }, [refresh])

  const persist = useCallback((next: RiskRecord[]) => {
    saveRisks(next)
    setRisks(next)
    window.dispatchEvent(new CustomEvent('riskhub-risks-changed'))
  }, [])

  const addRisk = useCallback(
    (input: RiskCreateInput): RiskRecord => {
      const list = loadRisks()
      const now = new Date().toISOString()
      const id = `r_${crypto.randomUUID()}`
      const row: RiskRecord = {
        ...input,
        id,
        code: nextCode(list),
        created: now,
        updated: now,
        comments: [],
        responseMeasures: [],
        activityLog: [
          { id: `${id}-created`, at: now, message: 'Риск создан' }
        ]
      }
      persist([row, ...list])
      return row
    },
    [persist]
  )

  const updateRisk = useCallback(
    (id: string, patch: Partial<RiskRecord>) => {
      const list = loadRisks()
      const prev = list.find((r) => r.id === id)
      if (!prev) return
      const now = new Date().toISOString()
      const merged: RiskRecord = { ...prev, ...patch, updated: now }
      const logPatch = { ...patch }
      if ('updated' in logPatch) delete logPatch.updated
      const extraLog = activityEntriesFromPatch(prev, logPatch, now)
      const next: RiskRecord = {
        ...merged,
        activityLog: [...(prev.activityLog ?? []), ...extraLog]
      }
      persist(list.map((r) => (r.id === id ? next : r)))
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
