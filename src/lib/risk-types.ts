export interface RiskCommentAttachment {
  name: string
}

export interface RiskComment {
  id: string
  at: string
  authorName: string
  /** Data URL of avatar at post time; optional for legacy comments */
  authorAvatarUrl?: string | null
  text: string
  attachment?: RiskCommentAttachment
}

export interface RiskResponseMeasure {
  id: string
  label: string
  done: boolean
}

export interface RiskActivityLogEntry {
  id: string
  at: string
  message: string
}

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
  /** ISO date (YYYY-MM-DD) or full ISO datetime */
  created: string
  /** ISO date (YYYY-MM-DD) or full ISO datetime */
  updated: string
  comments?: RiskComment[]
  responseMeasures?: RiskResponseMeasure[]
  activityLog?: RiskActivityLogEntry[]
}

export type RiskCreateInput = Omit<
  RiskRecord,
  | 'id'
  | 'code'
  | 'created'
  | 'updated'
  | 'comments'
  | 'responseMeasures'
  | 'activityLog'
>

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
