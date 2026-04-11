'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  getDemoCredentials,
  getSession,
  type SessionPayload
} from '@/lib/auth-storage'
import { ensureDemoWorldSeeded } from '@/lib/demo-world-seed'
import {
  nextProjectCode,
  type ProjectDocumentationFile,
  type ProjectInvitationRecord,
  type ProjectMemberRecord,
  type ProjectRecord,
  type ProjectStatus
} from '@/lib/project-types'
import { migrateLegacyRisksToProjects } from '@/lib/projects-migration'
import type { RiskActivityLogEntry } from '@/lib/risk-types'
import {
  dbDeleteProjectCascade,
  dbGetAllInvitations,
  dbGetAllProjects,
  dbGetInvitation,
  dbGetMembersForProject,
  dbGetProject,
  dbPutInvitation,
  dbPutMember,
  dbPutProject
} from '@/lib/projects-db'

interface ProjectsContextValue {
  ready: boolean
  projects: ProjectRecord[]
  accessibleProjectIds: ReadonlySet<string>
  myProjects: ProjectRecord[]
  refresh: () => Promise<void>
  getProjectById: (id: string) => ProjectRecord | undefined
  getProjectDisplayName: (projectId: string | undefined, fallbackName: string) => string
  createProject: (input: {
    name: string
    category: string
    description?: string
    inviteEmails?: string[]
    documentationFiles?: ProjectDocumentationFile[]
  }) => Promise<{ ok: true } | { ok: false; error: string }>
  updateProject: (
    projectId: string,
    patch: Partial<
      Pick<
        ProjectRecord,
        'status' | 'description' | 'name' | 'category' | 'documentationFiles'
      >
    >
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  inviteToProject: (
    projectId: string,
    emails: string[]
  ) => Promise<{ ok: true; sent: number } | { ok: false; error: string }>
  listProjectMembers: (projectId: string) => Promise<ProjectMemberRecord[]>
  deleteProject: (
    projectId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  acceptInvitation: (
    invitationId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  declineInvitation: (
    invitationId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  memberCount: (projectId: string) => Promise<number>
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmailLoose(email: string) {
  const t = email.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

async function createPendingInvitations(
  projectId: string,
  projectName: string,
  rawEmails: string[],
  s: SessionPayload
): Promise<number> {
  const self = normalizeEmail(s.email)
  const allInv = await dbGetAllInvitations()
  let sent = 0
  const seen = new Set<string>()
  for (const raw of rawEmails) {
    const t = raw.trim()
    if (!t) continue
    if (!isValidEmailLoose(t)) continue
    const inviteEmail = normalizeEmail(t)
    if (inviteEmail === self) continue
    if (seen.has(inviteEmail)) continue
    seen.add(inviteEmail)
    const dup = allInv.some(
      (i) =>
        i.projectId === projectId &&
        normalizeEmail(i.inviteeEmail) === inviteEmail &&
        i.status === 'pending'
    )
    if (dup) continue
    const inv: ProjectInvitationRecord = {
      id: `inv_${crypto.randomUUID()}`,
      projectId,
      projectName,
      inviterUserId: s.userId,
      inviterName: s.name,
      inviteeEmail: inviteEmail,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    await dbPutInvitation(inv)
    sent += 1
    allInv.push(inv)
  }
  if (sent > 0)
    window.dispatchEvent(new CustomEvent('riskhub-invitations-changed'))
  return sent
}

function projectActivityFromPatch(
  prev: ProjectRecord,
  patch: Partial<
    Pick<
      ProjectRecord,
      'status' | 'description' | 'name' | 'category' | 'documentationFiles'
    >
  >,
  at: string
): RiskActivityLogEntry[] {
  const out: RiskActivityLogEntry[] = []
  const push = (message: string) =>
    out.push({ id: crypto.randomUUID(), at, message })

  if (patch.name !== undefined && patch.name !== prev.name)
    push(`Название изменено на «${patch.name}»`)
  if (patch.category !== undefined && patch.category !== prev.category)
    push(`Категория изменена на «${patch.category}»`)
  if (patch.status !== undefined && patch.status !== prev.status)
    push(`Статус изменён на «${patch.status}»`)
  if (
    patch.description !== undefined &&
    patch.description !== prev.description
  )
    push('Описание проекта обновлено')
  if (patch.documentationFiles !== undefined) push('Документация проекта обновлена')

  return out
}

async function buildAccessibleSet(
  list: ProjectRecord[]
): Promise<Set<string>> {
  const s = getSession()
  const ids = new Set<string>()
  for (const p of list) {
    if (!s) continue
    // Legacy demo projects are only accessible to their owner (the demo account).
    // New regular accounts start with a completely empty workspace.
    if (p.isPublicLegacy) {
      if (p.ownerUserId === s.userId) ids.add(p.id)
      continue
    }
    if (p.ownerUserId === s.userId) {
      ids.add(p.id)
      continue
    }
    const members = await dbGetMembersForProject(p.id)
    if (members.some((m) => m.userId === s.userId)) ids.add(p.id)
  }
  return ids
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [sessionTick, setSessionTick] = useState(0)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [accessibleProjectIds, setAccessibleProjectIds] = useState(
    () => new Set<string>()
  )

  useEffect(() => {
    const onSession = () => setSessionTick((t) => t + 1)
    window.addEventListener('riskhub-session-changed', onSession)
    return () => window.removeEventListener('riskhub-session-changed', onSession)
  }, [])

  const refresh = useCallback(async () => {
    const s = getSession()
    if (!s?.userId) {
      setProjects([])
      setAccessibleProjectIds(new Set())
      return
    }
    const list = await dbGetAllProjects()
    const sorted = [...list].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
    setProjects(sorted)
    setAccessibleProjectIds(await buildAccessibleSet(sorted))
  }, [])

  useEffect(() => {
    const s = getSession()
    if (s?.userId !== getDemoCredentials().userId) return
    void ensureDemoWorldSeeded().then(() => {
      void refresh()
    })
  }, [sessionTick, refresh])

  useEffect(() => {
    let alive = true
    const s = getSession()
    if (!s?.userId) {
      setProjects([])
      setAccessibleProjectIds(new Set())
      setReady(true)
      return
    }
    setReady(false)
    ;(async () => {
      try {
        await migrateLegacyRisksToProjects()
        const list = await dbGetAllProjects()
        const sorted = [...list].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        )
        if (!alive) return
        setProjects(sorted)
        setAccessibleProjectIds(await buildAccessibleSet(sorted))
      } catch (e) {
        console.error(e)
      }
      if (!alive) return
      setReady(true)
      window.dispatchEvent(new CustomEvent('riskhub-projects-ready'))
    })()
    return () => {
      alive = false
    }
  }, [sessionTick])

  useEffect(() => {
    const onSession = () => {
      void refresh()
    }
    window.addEventListener('riskhub-session-changed', onSession)
    return () => window.removeEventListener('riskhub-session-changed', onSession)
  }, [refresh])

  const getProjectById = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  )

  const getProjectDisplayName = useCallback(
    (projectId: string | undefined, fallbackName: string) => {
      if (!projectId) return fallbackName
      return getProjectById(projectId)?.name ?? fallbackName
    },
    [getProjectById]
  )

  const myProjects = useMemo(
    () => projects.filter((p) => accessibleProjectIds.has(p.id)),
    [projects, accessibleProjectIds]
  )

  const createProject = useCallback(
    async (input: {
      name: string
      category: string
      description?: string
      inviteEmails?: string[]
      documentationFiles?: ProjectDocumentationFile[]
    }) => {
      const s = getSession()
      if (!s) return { ok: false as const, error: 'Войдите в систему' }
      const name = input.name.trim()
      if (!name) return { ok: false as const, error: 'Укажите название проекта' }
      const category = input.category.trim()
      if (!category)
        return { ok: false as const, error: 'Выберите категорию проекта' }

      const emails = input.inviteEmails ?? []
      for (const raw of emails) {
        if (raw.trim() && !isValidEmailLoose(raw))
          return {
            ok: false as const,
            error: 'Некорректный email в списке приглашений'
          }
      }

      const id = `proj_${crypto.randomUUID()}`
      const now = new Date().toISOString()
      const existing = await dbGetAllProjects()
      const code = nextProjectCode(existing)
      const docs = input.documentationFiles?.filter(Boolean) ?? []
      const row: ProjectRecord = {
        id,
        code,
        name,
        category,
        ownerUserId: s.userId,
        createdAt: now,
        updatedAt: now,
        isPublicLegacy: false,
        status: 'Активен',
        description: (input.description ?? '').trim(),
        activityLog: [
          { id: `${id}-created`, at: now, message: 'Проект создан' }
        ],
        documentationFiles: docs.length > 0 ? docs : undefined
      }
      await dbPutProject(row)
      await dbPutMember({
        id: `${id}__${s.userId}`,
        projectId: id,
        userId: s.userId,
        email: s.email,
        joinedAt: now
      })

      const sent = await createPendingInvitations(id, name, emails, s)
      if (sent > 0) {
        const p = await dbGetProject(id)
        if (p) {
          const at = new Date().toISOString()
          await dbPutProject({
            ...p,
            updatedAt: at,
            activityLog: [
              ...p.activityLog,
              {
                id: crypto.randomUUID(),
                at,
                message: `Отправлено приглашений: ${sent}`
              }
            ]
          })
        }
      }
      await refresh()
      return { ok: true as const }
    },
    [refresh]
  )

  const updateProject = useCallback(
    async (
      projectId: string,
      patch: Partial<
        Pick<
          ProjectRecord,
          'status' | 'description' | 'name' | 'category' | 'documentationFiles'
        >
      >
    ) => {
      const s = getSession()
      if (!s) return { ok: false as const, error: 'Войдите в систему' }
      const prev = await dbGetProject(projectId)
      if (!prev) return { ok: false as const, error: 'Проект не найден' }
      if (prev.isPublicLegacy)
        return { ok: false as const, error: 'Демо-проект нельзя изменять' }
      if (prev.ownerUserId !== s.userId)
        return { ok: false as const, error: 'Только владелец может менять проект' }

      const nextName = patch.name !== undefined ? patch.name.trim() : prev.name
      if (patch.name !== undefined && !nextName)
        return { ok: false as const, error: 'Название не может быть пустым' }

      const nextCategory =
        patch.category !== undefined ? patch.category.trim() : prev.category
      if (patch.category !== undefined && !nextCategory)
        return { ok: false as const, error: 'Категория не может быть пустой' }

      let status: ProjectStatus = prev.status
      if (patch.status !== undefined) {
        if (patch.status !== 'Активен' && patch.status !== 'Завершен')
          return { ok: false as const, error: 'Некорректный статус' }
        status = patch.status
      }

      const description =
        patch.description !== undefined ? patch.description : prev.description
      const documentationFiles =
        patch.documentationFiles !== undefined
          ? patch.documentationFiles
          : prev.documentationFiles

      const now = new Date().toISOString()
      const logPatch = {
        ...patch,
        ...(patch.name !== undefined ? { name: nextName } : {}),
        ...(patch.category !== undefined ? { category: nextCategory } : {})
      }
      const extraLog = projectActivityFromPatch(prev, logPatch, now)

      await dbPutProject({
        ...prev,
        name: nextName,
        category: nextCategory,
        status,
        description,
        documentationFiles,
        updatedAt: now,
        activityLog: [...prev.activityLog, ...extraLog]
      })
      await refresh()
      return { ok: true as const }
    },
    [refresh]
  )

  const inviteToProject = useCallback(
    async (projectId: string, emails: string[]) => {
      const s = getSession()
      if (!s) return { ok: false as const, error: 'Войдите в систему' }
      const proj = await dbGetProject(projectId)
      if (!proj) return { ok: false as const, error: 'Проект не найден' }
      if (proj.isPublicLegacy)
        return { ok: false as const, error: 'Для демо-проекта приглашения недоступны' }

      const members = await dbGetMembersForProject(projectId)
      const canInvite =
        proj.ownerUserId === s.userId ||
        members.some((m) => m.userId === s.userId)
      if (!canInvite)
        return { ok: false as const, error: 'Нет прав приглашать в этот проект' }

      for (const raw of emails) {
        if (raw.trim() && !isValidEmailLoose(raw))
          return { ok: false as const, error: 'Некорректный email' }
      }

      const sent = await createPendingInvitations(
        projectId,
        proj.name,
        emails,
        s
      )
      if (sent > 0) {
        const at = new Date().toISOString()
        const next = await dbGetProject(projectId)
        if (next)
          await dbPutProject({
            ...next,
            updatedAt: at,
            activityLog: [
              ...next.activityLog,
              {
                id: crypto.randomUUID(),
                at,
                message: `Отправлено приглашений: ${sent}`
              }
            ]
          })
      }
      await refresh()
      return { ok: true as const, sent }
    },
    [refresh]
  )

  const deleteProject = useCallback(
    async (projectId: string) => {
      const s = getSession()
      if (!s) return { ok: false as const, error: 'Войдите в систему' }
      const prev = await dbGetProject(projectId)
      if (!prev) return { ok: false as const, error: 'Проект не найден' }
      if (prev.isPublicLegacy)
        return { ok: false as const, error: 'Демо-проект нельзя удалить' }
      if (prev.ownerUserId !== s.userId)
        return { ok: false as const, error: 'Только владелец может удалить проект' }
      await dbDeleteProjectCascade(projectId)
      await refresh()
      window.dispatchEvent(new CustomEvent('riskhub-invitations-changed'))
      return { ok: true as const }
    },
    [refresh]
  )

  const listProjectMembers = useCallback(async (projectId: string) => {
    return dbGetMembersForProject(projectId)
  }, [])

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      const s = getSession()
      if (!s) return { ok: false as const, error: 'Войдите в систему' }
      const inv = await dbGetInvitation(invitationId)
      if (!inv || inv.status !== 'pending')
        return { ok: false as const, error: 'Приглашение не найдено' }
      if (normalizeEmail(inv.inviteeEmail) !== normalizeEmail(s.email))
        return { ok: false as const, error: 'Это приглашение не для вас' }

      const now = new Date().toISOString()
      await dbPutMember({
        id: `${inv.projectId}__${s.userId}`,
        projectId: inv.projectId,
        userId: s.userId,
        email: s.email,
        joinedAt: now
      })
      await dbPutInvitation({ ...inv, status: 'accepted' })
      await refresh()
      window.dispatchEvent(new CustomEvent('riskhub-invitations-changed'))
      return { ok: true as const }
    },
    [refresh]
  )

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      const s = getSession()
      if (!s) return { ok: false as const, error: 'Войдите в систему' }
      const inv = await dbGetInvitation(invitationId)
      if (!inv || inv.status !== 'pending')
        return { ok: false as const, error: 'Приглашение не найдено' }
      if (normalizeEmail(inv.inviteeEmail) !== normalizeEmail(s.email))
        return { ok: false as const, error: 'Это приглашение не для вас' }

      await dbPutInvitation({ ...inv, status: 'declined' })
      await refresh()
      window.dispatchEvent(new CustomEvent('riskhub-invitations-changed'))
      return { ok: true as const }
    },
    [refresh]
  )

  const memberCount = useCallback(async (projectId: string) => {
    const m = await dbGetMembersForProject(projectId)
    return m.length
  }, [])

  const value = useMemo(
    () => ({
      ready,
      projects,
      accessibleProjectIds,
      myProjects,
      refresh,
      getProjectById,
      getProjectDisplayName,
      createProject,
      updateProject,
      inviteToProject,
      listProjectMembers,
      deleteProject,
      acceptInvitation,
      declineInvitation,
      memberCount
    }),
    [
      ready,
      projects,
      accessibleProjectIds,
      myProjects,
      refresh,
      getProjectById,
      getProjectDisplayName,
      createProject,
      updateProject,
      inviteToProject,
      listProjectMembers,
      deleteProject,
      acceptInvitation,
      declineInvitation,
      memberCount
    ]
  )

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  )
}

export function useProjects() {
  const ctx = useContext(ProjectsContext)
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider')
  return ctx
}
