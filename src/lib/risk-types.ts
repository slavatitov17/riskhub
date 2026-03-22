export interface RiskRecord {
  id: string
  code: string
  name: string
  description: string
  category: string
  probability: string
  impact: string
  status: string
  project: string
  author: string
  created: string
  updated: string
}

export const RISK_CATEGORIES = [
  'Технологический',
  'Организационный',
  'Финансовый',
  'Операционный',
  'Внешний',
  'Прочее'
] as const

export const RISK_STATUSES = [
  'Активный',
  'В работе',
  'Закрыт',
  'Мониторинг'
] as const

export const LEVELS = ['Низкая', 'Средняя', 'Высокая'] as const
export const IMPACTS = ['Низкое', 'Среднее', 'Высокое'] as const
