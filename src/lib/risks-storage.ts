import type { AppLocale } from '@/contexts/locale-context'
import type { RiskActivityLogEntry, RiskRecord } from '@/lib/risk-types'
import { getSession } from '@/lib/auth-storage'

/** Общий каталог рисков по проектам (видимость через участие в проекте). */
const SHARED_RISKS_KEY = 'riskhub_risks_shared_v1'

const MIGRATED_TO_SHARED_FLAG = 'riskhub_risks_shared_v1_migrated'

/** Старые ключи до общего каталога. */
const LEGACY_FLAT_KEY = 'riskhub_risks'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function migrateToSharedCatalogOnce() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGRATED_TO_SHARED_FLAG)) return

  const byId = new Map<string, RiskRecord>()
  const ingest = (raw: string | null) => {
    const arr = safeParse<RiskRecord[] | null>(raw, null)
    if (!arr?.length) return
    for (const r of arr) byId.set(r.id, normalizeRiskRecord(r))
  }

  ingest(localStorage.getItem(SHARED_RISKS_KEY))
  ingest(localStorage.getItem(LEGACY_FLAT_KEY))

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('riskhub_risks__')) ingest(localStorage.getItem(k))
  }

  if (byId.size > 0)
    localStorage.setItem(
      SHARED_RISKS_KEY,
      JSON.stringify(Array.from(byId.values()))
    )

  localStorage.setItem(MIGRATED_TO_SHARED_FLAG, '1')
}

function defaultActivityLog(r: RiskRecord): RiskActivityLogEntry[] {
  const at =
    r.created.length > 10 ? r.created : `${r.created}T12:00:00.000Z`
  return [
    {
      id: `${r.id}-created`,
      at,
      message: 'Риск создан'
    }
  ]
}

function stripTrailingDot(value: string) {
  const trimmed = value.trim()
  return trimmed.endsWith('.') ? trimmed.slice(0, -1).trimEnd() : trimmed
}

export function normalizeRiskRecord(r: RiskRecord): RiskRecord {
  return {
    ...r,
    comments: (r.comments ?? []).map((comment) => ({
      ...comment,
      text: stripTrailingDot(comment.text)
    })),
    responseMeasures: r.responseMeasures ?? [],
    activityLog: r.activityLog?.length ? r.activityLog : defaultActivityLog(r)
  }
}

export function mergeRisksIntoSharedCatalog(incoming: RiskRecord[]) {
  if (typeof window === 'undefined' || incoming.length === 0) return
  migrateToSharedCatalogOnce()
  const raw = localStorage.getItem(SHARED_RISKS_KEY)
  const parsed = safeParse<RiskRecord[] | null>(raw, null) ?? []
  const byId = new Map(parsed.map((row) => [row.id, normalizeRiskRecord(row)]))
  for (const row of incoming) byId.set(row.id, normalizeRiskRecord(row))
  localStorage.setItem(
    SHARED_RISKS_KEY,
    JSON.stringify(Array.from(byId.values()))
  )
}

function tryMigrateLegacyRisksToShared(): RiskRecord[] {
  const legacyRaw = localStorage.getItem(LEGACY_FLAT_KEY)
  if (!legacyRaw) return []
  const parsed = safeParse<RiskRecord[] | null>(legacyRaw, null)
  if (!parsed?.length) return []
  localStorage.setItem(SHARED_RISKS_KEY, legacyRaw)
  localStorage.removeItem(LEGACY_FLAT_KEY)
  return parsed.map(normalizeRiskRecord)
}

export function loadRisks(): RiskRecord[] {
  if (typeof window === 'undefined') return []
  migrateToSharedCatalogOnce()

  const raw = localStorage.getItem(SHARED_RISKS_KEY)
  if (!raw) {
    const migrated = tryMigrateLegacyRisksToShared()
    return migrated.length ? migrated : []
  }

  const parsed = safeParse<RiskRecord[] | null>(raw, null)
  if (!parsed?.length) return []

  return parsed.map(normalizeRiskRecord)
}

export function saveRisks(risks: RiskRecord[]) {
  if (typeof window === 'undefined') return
  if (!getSession()?.userId) return
  migrateToSharedCatalogOnce()
  localStorage.setItem(SHARED_RISKS_KEY, JSON.stringify(risks))
}

export function formatDisplayDate(iso: string, locale: AppLocale = 'ru') {
  const datePart = iso.slice(0, 10)
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return iso
  if (locale === 'en') return `${d}/${m}/${y}`
  return `${d}.${m}.${y}`
}

export function formatRuDateTime(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatLocaleDateTime(iso: string, locale: AppLocale) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  const d = new Date(t)
  if (locale === 'en') {
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function riskDateKey(iso: string) {
  return iso.slice(0, 10)
}
