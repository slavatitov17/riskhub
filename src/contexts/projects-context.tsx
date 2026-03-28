'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { getSession } from '@/lib/auth-storage'
import type { ProjectInvitationRecord, ProjectRecord } from '@/lib/project-types'
import { migrateLegacyRisksToProjects } from '@/lib/projects-migration'
import {
  dbGetAllInvitations,
  dbGetAllProjects,
  dbGetInvitation,
  dbGetMembersForProject,
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
    inviteEmail?: string
  }) => Promise<{ ok: true } | { ok: false; error: string }>
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

async function buildAccessibleSet(
  list: ProjectRecord[]
): Promise<Set<string>> {
  const s = getSession()
  const ids = new Set<string>()
  for (const p of list) {
    if (p.isPublicLegacy) {
      ids.add(p.id)
      continue
    }
    if (!s) continue
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
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [accessibleProjectIds, setAccessibleProjectIds] = useState(
    () => new Set<string>()
  )

  const refresh = useCallback(async () => {
    const list = await dbGetAllProjects()
    const sorted = [...list].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    )
    setProjects(sorted)
    setAccessibleProjectIds(await buildAccessibleSet(sorted))
  }, [])

  useEffect(() => {
    let alive = true
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
  }, [])

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
    async (input: { name: string; inviteEmail?: string }) => {
      const s = getSession()
      if (!s) return { ok: false as const, error: 'Войдите в систему' }
      const name = input.name.trim()
      if (!name) return { ok: false as const, error: 'Укажите название проекта' }

      const inviteRaw = input.inviteEmail?.trim()
      if (inviteRaw && !isValidEmailLoose(inviteRaw))
        return { ok: false as const, error: 'Некорректный email приглашения' }

      const id = `proj_${crypto.randomUUID()}`
      const now = new Date().toISOString()
      const row: ProjectRecord = {
        id,
        name,
        ownerUserId: s.userId,
        createdAt: now,
        isPublicLegacy: false
      }
      await dbPutProject(row)
      await dbPutMember({
        id: `${id}__${s.userId}`,
        projectId: id,
        userId: s.userId,
        email: s.email,
        joinedAt: now
      })

      const inviteEmail = inviteRaw ? normalizeEmail(inviteRaw) : ''
      if (inviteEmail) {
        if (inviteEmail === normalizeEmail(s.email))
          return { ok: false as const, error: 'Нельзя пригласить самого себя' }

        const allInv = await dbGetAllInvitations()
        const dup = allInv.some(
          (i) =>
            i.projectId === id &&
            normalizeEmail(i.inviteeEmail) === inviteEmail &&
            i.status === 'pending'
        )
        if (!dup) {
          const inv: ProjectInvitationRecord = {
            id: `inv_${crypto.randomUUID()}`,
            projectId: id,
            projectName: name,
            inviterUserId: s.userId,
            inviterName: s.name,
            inviteeEmail: inviteEmail,
            status: 'pending',
            createdAt: now
          }
          await dbPutInvitation(inv)
          window.dispatchEvent(new CustomEvent('riskhub-invitations-changed'))
        }
      }

      await refresh()
      return { ok: true as const }
    },
    [refresh]
  )

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
