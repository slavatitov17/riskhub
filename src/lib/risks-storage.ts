import type { RiskRecord } from '@/lib/risk-types'

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

export function loadRisks(): RiskRecord[] {
  if (typeof window === 'undefined') return SEED_RISKS
  const raw = localStorage.getItem(RISKS_KEY)
  if (!raw) {
    localStorage.setItem(RISKS_KEY, JSON.stringify(SEED_RISKS))
    return SEED_RISKS
  }
  const parsed = safeParse<RiskRecord[] | null>(raw, null)
  if (!parsed?.length) {
    localStorage.setItem(RISKS_KEY, JSON.stringify(SEED_RISKS))
    return SEED_RISKS
  }
  return parsed
}

export function saveRisks(risks: RiskRecord[]) {
  localStorage.setItem(RISKS_KEY, JSON.stringify(risks))
}

export function formatDisplayDate(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}
