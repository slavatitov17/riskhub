import type { RiskActivityLogEntry } from '@/lib/risk-types'

export const PROJECT_STATUSES = ['Активен', 'Завершен'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export interface ProjectRecord {
  id: string
  /** Человекочитаемый код, например P-001 */
  code: string
  name: string
  ownerUserId: string
  createdAt: string
  updatedAt: string
  /** Демо-проекты из начальных данных: доступны любому вошедшему пользователю */
  isPublicLegacy: boolean
  status: ProjectStatus
  description: string
  activityLog: RiskActivityLogEntry[]
}

export type ProjectRecordInput = Omit<
  ProjectRecord,
  'status' | 'description' | 'updatedAt' | 'activityLog' | 'code'
> &
  Partial<
    Pick<
      ProjectRecord,
      'status' | 'description' | 'updatedAt' | 'activityLog' | 'code'
    >
  >

const PROJECT_CODE_RE = /^P-\d{3}$/

export function normalizeProjectRecord(raw: ProjectRecordInput): ProjectRecord {
  const created = raw.createdAt
  const defaultLog: RiskActivityLogEntry[] = [
    {
      id: `${raw.id}-created`,
      at: created,
      message: 'Проект создан'
    }
  ]
  const codeRaw = typeof raw.code === 'string' ? raw.code.trim() : ''
  return {
    ...raw,
    code: PROJECT_CODE_RE.test(codeRaw) ? codeRaw : '',
    status: raw.status === 'Завершен' ? 'Завершен' : 'Активен',
    description: typeof raw.description === 'string' ? raw.description : '',
    updatedAt: raw.updatedAt ?? created,
    activityLog:
      raw.activityLog && raw.activityLog.length > 0
        ? raw.activityLog
        : defaultLog
  }
}

export function nextProjectCode(projects: readonly ProjectRecord[]): string {
  const nums = projects
    .map((p) => {
      const m = p.code.match(/^P-(\d{3})$/)
      return m ? parseInt(m[1]!, 10) : NaN
    })
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 0
  return `P-${String(max + 1).padStart(3, '0')}`
}

export interface ProjectMemberRecord {
  id: string
  projectId: string
  userId: string
  email: string
  joinedAt: string
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined'

export interface ProjectInvitationRecord {
  id: string
  projectId: string
  projectName: string
  inviterUserId: string
  inviterName: string
  inviteeEmail: string
  status: InvitationStatus
  createdAt: string
}
