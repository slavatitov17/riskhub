import type { RiskActivityLogEntry } from '@/lib/risk-types'

export const PROJECT_STATUSES = ['Активен', 'Завершен'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export interface ProjectRecord {
  id: string
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
  'status' | 'description' | 'updatedAt' | 'activityLog'
> &
  Partial<
    Pick<ProjectRecord, 'status' | 'description' | 'updatedAt' | 'activityLog'>
  >

export function normalizeProjectRecord(raw: ProjectRecordInput): ProjectRecord {
  const created = raw.createdAt
  const defaultLog: RiskActivityLogEntry[] = [
    {
      id: `${raw.id}-created`,
      at: created,
      message: 'Проект создан'
    }
  ]
  return {
    ...raw,
    status: raw.status === 'Завершен' ? 'Завершен' : 'Активен',
    description: typeof raw.description === 'string' ? raw.description : '',
    updatedAt: raw.updatedAt ?? created,
    activityLog:
      raw.activityLog && raw.activityLog.length > 0
        ? raw.activityLog
        : defaultLog
  }
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
