import type { RiskActivityLogEntry, RiskRecord } from '@/lib/risk-types'

const RISKS_KEY = 'riskhub_risks'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
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

export function loadRisks(): RiskRecord[] {
  if (typeof window === 'undefined') return SEED_RISKS.map(normalizeRiskRecord)
  const raw = localStorage.getItem(RISKS_KEY)
  if (!raw) {
    localStorage.setItem(RISKS_KEY, JSON.stringify(SEED_RISKS))
    return SEED_RISKS.map(normalizeRiskRecord)
  }
  const parsed = safeParse<RiskRecord[] | null>(raw, null)
  if (!parsed?.length) {
    localStorage.setItem(RISKS_KEY, JSON.stringify(SEED_RISKS))
    return SEED_RISKS.map(normalizeRiskRecord)
  }
  return parsed.map(normalizeRiskRecord)
}

export function saveRisks(risks: RiskRecord[]) {
  localStorage.setItem(RISKS_KEY, JSON.stringify(risks))
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
