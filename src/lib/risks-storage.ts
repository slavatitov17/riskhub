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

export const SEED_RISKS: RiskRecord[] = [
  {
    id: 'r1',
    code: 'R-001',
    name: 'Сбой сервера',
    description:
      'Риск отказа основного сервера приложений при пиковой нагрузке.',
    category: 'Технологический',
    probability: 'Высокая',
    impact: 'Высокое',
    status: 'Активный',
    project: 'Проект X',
    author: 'Иван',
    created: '2024-03-10',
    updated: '2024-03-18'
  },
  {
    id: 'r2',
    code: 'R-002',
    name: 'Пропуск сроков поставки',
    description: 'Задержка поставки оборудования от подрядчика.',
    category: 'Организационный',
    probability: 'Средняя',
    impact: 'Среднее',
    status: 'В работе',
    project: 'Проект Y',
    author: 'Ольга',
    created: '2024-03-05',
    updated: '2024-03-15'
  },
  {
    id: 'r3',
    code: 'R-003',
    name: 'Недостаток финансирования',
    description: 'Возможное сокращение бюджета этапа внедрения.',
    category: 'Финансовый',
    probability: 'Низкая',
    impact: 'Высокое',
    status: 'Активный',
    project: 'Проект Z',
    author: 'Мария',
    created: '2024-03-01',
    updated: '2024-03-12'
  },
  {
    id: 'r4',
    code: 'R-004',
    name: 'Утечка данных',
    description: 'Несанкционированный доступ к персональным данным.',
    category: 'Технологический',
    probability: 'Низкая',
    impact: 'Высокое',
    status: 'Мониторинг',
    project: 'Проект X',
    author: 'Иван',
    created: '2024-02-20',
    updated: '2024-03-01'
  },
  {
    id: 'r5',
    code: 'R-005',
    name: 'Смена регуляторных требований',
    description: 'Изменение требований отрасли к отчётности.',
    category: 'Внешний',
    probability: 'Средняя',
    impact: 'Среднее',
    status: 'Закрыт',
    project: 'Проект А',
    author: 'Дмитрий',
    created: '2024-01-15',
    updated: '2024-02-28'
  }
]

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

export function normalizeRiskRecord(r: RiskRecord): RiskRecord {
  return {
    ...r,
    comments: r.comments ?? [],
    responseMeasures: r.responseMeasures ?? [],
    activityLog: r.activityLog?.length ? r.activityLog : defaultActivityLog(r)
  }
}

function seedDemoCatalog(): RiskRecord[] {
  const legacyRaw = localStorage.getItem(LEGACY_FLAT_KEY)
  if (legacyRaw) {
    const parsed = safeParse<RiskRecord[] | null>(legacyRaw, null)
    if (parsed?.length) {
      localStorage.setItem(SHARED_RISKS_KEY, legacyRaw)
      localStorage.removeItem(LEGACY_FLAT_KEY)
      return parsed.map(normalizeRiskRecord)
    }
  }
  localStorage.setItem(SHARED_RISKS_KEY, JSON.stringify(SEED_RISKS))
  return SEED_RISKS.map(normalizeRiskRecord)
}

export function loadRisks(): RiskRecord[] {
  if (typeof window === 'undefined') return []
  migrateToSharedCatalogOnce()

  const raw = localStorage.getItem(SHARED_RISKS_KEY)
  if (!raw) {
    const s = getSession()
    if (s?.userId === 'demo_user') return seedDemoCatalog()
    return []
  }

  const parsed = safeParse<RiskRecord[] | null>(raw, null)
  if (!parsed?.length) {
    const s = getSession()
    if (s?.userId === 'demo_user') return seedDemoCatalog()
    return []
  }

  return parsed.map(normalizeRiskRecord)
}

export function saveRisks(risks: RiskRecord[]) {
  if (typeof window === 'undefined') return
  if (!getSession()?.userId) return
  migrateToSharedCatalogOnce()
  localStorage.setItem(SHARED_RISKS_KEY, JSON.stringify(risks))
}

export function formatDisplayDate(iso: string) {
  const datePart = iso.slice(0, 10)
  const [y, m, d] = datePart.split('-')
  if (!y || !m || !d) return iso
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

export function riskDateKey(iso: string) {
  return iso.slice(0, 10)
}
