export interface ProjectRecord {
  id: string
  name: string
  ownerUserId: string
  createdAt: string
  /** Демо-проекты из начальных данных: доступны любому вошедшему пользователю */
  isPublicLegacy: boolean
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
