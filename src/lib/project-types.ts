export const PROJECT_STATUSES = ['Активен', 'Завершен'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export interface ProjectRecord {
  id: string
  name: string
  ownerUserId: string
  createdAt: string
  /** Демо-проекты из начальных данных: доступны любому вошедшему пользователю */
  isPublicLegacy: boolean
  status: ProjectStatus
  description: string
}

export type ProjectRecordInput = Omit<ProjectRecord, 'status' | 'description'> &
  Partial<Pick<ProjectRecord, 'status' | 'description'>>

export function normalizeProjectRecord(raw: ProjectRecordInput): ProjectRecord {
  return {
    ...raw,
    status: raw.status === 'Завершен' ? 'Завершен' : 'Активен',
    description: typeof raw.description === 'string' ? raw.description : ''
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
