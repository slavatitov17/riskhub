import type { RiskActivityLogEntry } from '@/lib/risk-types'

export const PROJECT_STATUSES = ['Активен', 'Завершен'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

/** Вложения проектной документации (локальное хранилище). */
export interface ProjectDocumentationFile {
  id: string
  name: string
  mimeType: string
  size: number
  uploadedAt: string
  /** Data URL для скачивания; крупные файлы могут быть без тела */
  dataUrl?: string
}

export interface ProjectRecord {
  id: string
  /** Человекочитаемый код, например P-001 */
  code: string
  name: string
  /** Категория проекта (произвольная строка или пресет) */
  category: string
  ownerUserId: string
  createdAt: string
  updatedAt: string
  /** Демо-проекты из начальных данных: доступны любому вошедшему пользователю */
  isPublicLegacy: boolean
  status: ProjectStatus
  description: string
  activityLog: RiskActivityLogEntry[]
  /** Файлы проектной документации, прикреплённые при создании или позже */
  documentationFiles?: ProjectDocumentationFile[]
}

export type ProjectRecordInput = Omit<
  ProjectRecord,
  'status' | 'description' | 'updatedAt' | 'activityLog' | 'code' | 'category'
> &
  Partial<
    Pick<
      ProjectRecord,
      | 'status'
      | 'description'
      | 'updatedAt'
      | 'activityLog'
      | 'code'
      | 'category'
      | 'documentationFiles'
    >
  >

const PROJECT_CODE_RE = /^P-\d{3}$/

function normalizeDocumentationFiles(
  raw: unknown
): ProjectDocumentationFile[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!Array.isArray(raw)) return []
  const out: ProjectDocumentationFile[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const name = typeof o.name === 'string' ? o.name.trim() : ''
    const mimeType = typeof o.mimeType === 'string' ? o.mimeType : ''
    const size = typeof o.size === 'number' && o.size >= 0 ? o.size : 0
    const uploadedAt =
      typeof o.uploadedAt === 'string' ? o.uploadedAt : ''
    const dataUrl =
      typeof o.dataUrl === 'string' && o.dataUrl.startsWith('data:')
        ? o.dataUrl
        : undefined
    if (!id || !name) continue
    out.push({ id, name, mimeType, size, uploadedAt, dataUrl })
  }
  return out
}

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
  const categoryRaw =
    typeof raw.category === 'string' ? raw.category.trim() : ''
  const docs = normalizeDocumentationFiles(raw.documentationFiles)
  return {
    ...raw,
    code: PROJECT_CODE_RE.test(codeRaw) ? codeRaw : '',
    category: categoryRaw,
    status: raw.status === 'Завершен' ? 'Завершен' : 'Активен',
    description: typeof raw.description === 'string' ? raw.description : '',
    updatedAt: raw.updatedAt ?? created,
    activityLog:
      raw.activityLog && raw.activityLog.length > 0
        ? raw.activityLog
        : defaultLog,
    documentationFiles: docs && docs.length > 0 ? docs : undefined
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
