'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { useLocale } from '@/contexts/locale-context'
import { useProjects } from '@/contexts/projects-context'
import { getSession } from '@/lib/auth-storage'
import { dbGetAllInvitations } from '@/lib/projects-db'
import {
  RISKHUB_NOTIFICATION_PREFS_CHANGED,
  readBuiltInNotificationsEnabled
} from '@/lib/notification-prefs'
import type { RiskRecord } from '@/lib/risk-types'
import { loadRisks } from '@/lib/risks-storage'

type NotificationTone = 'default' | 'destructive'

export type NotificationKind = 'demo' | 'project_invite'

export interface NotificationItem {
  id: string
  kind: NotificationKind
  title: string
  body: string
  tone: NotificationTone
  actionHref: string
  isRead: boolean
  invitationId?: string
  /** Для приглашений — проект, в который пригласили */
  projectId?: string
}

interface NotificationsContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  notifOpen: boolean
  openNotifications: () => void
  closeNotifications: () => void
  markAllRead: () => void
  markRead: (id: string) => void
  refreshInvitations: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
)

function notifReadStorageKey(): string {
  const s = getSession()
  if (!s?.userId) return 'riskhub_notifications_read_v2__guest'
  return `riskhub_notifications_read_v2__${s.userId}`
}

function buildDemoRiskNotifications(
  risks: RiskRecord[],
  accessibleProjectIds: ReadonlySet<string>,
  locale: 'ru' | 'en'
): Omit<NotificationItem, 'isRead'>[] {
  const scoped = risks.filter(
    (r) => r.projectId && accessibleProjectIds.has(r.projectId)
  )
  if (scoped.length === 0) return []
  const sorted = [...scoped].sort(
    (a, b) => Date.parse(b.created) - Date.parse(a.created)
  )
  const pick = sorted.slice(0, 8)
  const title = locale === 'en' ? 'Risk created' : 'Создан риск'
  return pick.map((r) => {
    const pid = r.projectId ?? '—'
    const body =
      locale === 'en'
        ? `User ${r.author} created risk ${r.code} in project ${pid}.`
        : `Пользователь ${r.author} создал риск ${r.code} в проекте ${pid}.`
    return {
      id: `demo_risk_${r.id}`,
      kind: 'demo' as const,
      title,
      body,
      tone: 'default' as const,
      actionHref: `/risks/${r.id}`
    }
  })
}

interface InvitePendingRaw {
  id: string
  invitationId: string
  projectId: string
  inviterName: string
  projectName: string
}

interface InviteResolvedRaw {
  id: string
  projectId: string
  projectName: string
  status: 'accepted' | 'declined'
}

function mapInvitePendingToItems(
  raw: InvitePendingRaw[],
  locale: 'ru' | 'en'
): Omit<NotificationItem, 'isRead'>[] {
  return raw.map((inv) => ({
    id: inv.id,
    kind: 'project_invite' as const,
    title: locale === 'en' ? 'Project invitation' : 'Приглашение в проект',
    body:
      locale === 'en'
        ? `${inv.inviterName} invited you to the project «${inv.projectName}».`
        : `${inv.inviterName} пригласил вас в проект «${inv.projectName}».`,
    tone: 'default' as const,
    actionHref: '/projects',
    invitationId: inv.invitationId,
    projectId: inv.projectId
  }))
}

function mapInviteResolvedToItems(
  raw: InviteResolvedRaw[],
  locale: 'ru' | 'en'
): Omit<NotificationItem, 'isRead'>[] {
  return raw.map((inv) => ({
    id: inv.id,
    kind: 'project_invite' as const,
    title:
      inv.status === 'accepted'
        ? locale === 'en'
          ? 'Invitation accepted'
          : 'Приглашение принято'
        : locale === 'en'
          ? 'Invitation declined'
          : 'Приглашение отклонено',
    body:
      inv.status === 'accepted'
        ? locale === 'en'
          ? `You joined the project «${inv.projectName}».`
          : `Вы вступили в проект «${inv.projectName}».`
        : locale === 'en'
          ? `You declined the invitation to «${inv.projectName}».`
          : `Вы отклонили приглашение в проект «${inv.projectName}».`,
    tone: 'default' as const,
    actionHref: '/projects',
    projectId: inv.projectId
  }))
}

function loadReadMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(notifReadStorageKey())
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}

    const record: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>))
      record[key] = value === true

    return record
  } catch {
    return {}
  }
}

function persistReadMap(readMap: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    notifReadStorageKey(),
    JSON.stringify(readMap)
  )
}

function normInviteEmail(email: string) {
  return email.trim().toLowerCase()
}

async function fetchInviteRaws(): Promise<{
  pending: InvitePendingRaw[]
  resolved: InviteResolvedRaw[]
}> {
  const s = getSession()
  if (!s?.email) return { pending: [], resolved: [] }
  const me = normInviteEmail(s.email)
  const all = await dbGetAllInvitations()
  const pendingInv = all.filter(
    (i) => i.status === 'pending' && normInviteEmail(i.inviteeEmail) === me
  )
  const resolvedInv = all.filter(
    (i) =>
      (i.status === 'accepted' || i.status === 'declined') &&
      normInviteEmail(i.inviteeEmail) === me
  )
  return {
    pending: pendingInv.map((inv) => ({
      id: `inv_notif_${inv.id}`,
      invitationId: inv.id,
      projectId: inv.projectId,
      inviterName: inv.inviterName,
      projectName: inv.projectName
    })),
    resolved: resolvedInv.map((inv) => ({
      id: `inv_notif_${inv.id}`,
      projectId: inv.projectId,
      projectName: inv.projectName,
      status: inv.status as 'accepted' | 'declined'
    }))
  }
}

export function NotificationsProvider({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { locale } = useLocale()
  const { accessibleProjectIds, ready: projectsReady } = useProjects()
  const [notifOpen, setNotifOpen] = useState(false)
  const [sessionTick, setSessionTick] = useState(0)
  const [inAppEnabled, setInAppEnabled] = useState(() =>
    typeof window !== 'undefined' ? readBuiltInNotificationsEnabled() : true
  )
  const [readMap, setReadMap] = useState<Record<string, boolean>>({})
  const [invitePendingRaw, setInvitePendingRaw] = useState<InvitePendingRaw[]>(
    []
  )
  const [inviteResolvedRaw, setInviteResolvedRaw] = useState<
    InviteResolvedRaw[]
  >([])
  const [risksTick, setRisksTick] = useState(0)

  const syncInvites = useCallback(async () => {
    try {
      const { pending, resolved } = await fetchInviteRaws()
      setInvitePendingRaw(pending)
      setInviteResolvedRaw(resolved)
    } catch {
      setInvitePendingRaw([])
      setInviteResolvedRaw([])
    }
  }, [])

  useEffect(() => {
    const onSession = () => setSessionTick((t) => t + 1)
    window.addEventListener('riskhub-session-changed', onSession)
    return () => window.removeEventListener('riskhub-session-changed', onSession)
  }, [])

  useEffect(() => {
    const onPrefs = () => setInAppEnabled(readBuiltInNotificationsEnabled())
    window.addEventListener(RISKHUB_NOTIFICATION_PREFS_CHANGED, onPrefs)
    return () =>
      window.removeEventListener(RISKHUB_NOTIFICATION_PREFS_CHANGED, onPrefs)
  }, [])

  useEffect(() => {
    setInAppEnabled(readBuiltInNotificationsEnabled())
    setReadMap(loadReadMap())
    void syncInvites()
  }, [syncInvites, sessionTick])

  useEffect(() => {
    const onChange = () => void syncInvites()
    window.addEventListener('riskhub-invitations-changed', onChange)
    window.addEventListener('riskhub-session-changed', onChange)
    return () => {
      window.removeEventListener('riskhub-invitations-changed', onChange)
      window.removeEventListener('riskhub-session-changed', onChange)
    }
  }, [syncInvites])

  useEffect(() => {
    const onRisks = () => setRisksTick((t) => t + 1)
    window.addEventListener('riskhub-risks-changed', onRisks)
    return () => window.removeEventListener('riskhub-risks-changed', onRisks)
  }, [])

  const invitePendingTemplates = useMemo(
    () => mapInvitePendingToItems(invitePendingRaw, locale),
    [invitePendingRaw, locale]
  )

  const inviteResolvedTemplates = useMemo(
    () => mapInviteResolvedToItems(inviteResolvedRaw, locale),
    [inviteResolvedRaw, locale]
  )

  const demoTemplates = useMemo(() => {
    void risksTick
    if (!projectsReady) return []
    return buildDemoRiskNotifications(loadRisks(), accessibleProjectIds, locale)
  }, [risksTick, projectsReady, accessibleProjectIds, locale])

  const notifications = useMemo((): NotificationItem[] => {
    if (!inAppEnabled) return []
    const demos: NotificationItem[] = demoTemplates.map((n) => ({
      ...n,
      isRead: readMap[n.id] ?? false
    }))
    const pendingInv: NotificationItem[] = invitePendingTemplates.map((n) => ({
      ...n,
      isRead: readMap[n.id] ?? false
    }))
    const resolvedInv: NotificationItem[] = inviteResolvedTemplates.map(
      (n) => ({
        ...n,
        isRead: true
      })
    )
    return [...pendingInv, ...resolvedInv, ...demos]
  }, [
    readMap,
    invitePendingTemplates,
    inviteResolvedTemplates,
    demoTemplates,
    inAppEnabled
  ])

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0),
    [notifications]
  )

  const closeNotifications = useCallback(() => setNotifOpen(false), [])
  const openNotifications = useCallback(() => setNotifOpen(true), [])

  const markAllRead = useCallback(() => {
    setReadMap((prev) => {
      const next = { ...prev }
      for (const n of invitePendingTemplates) next[n.id] = true
      for (const n of demoTemplates) next[n.id] = true
      persistReadMap(next)
      return next
    })
  }, [invitePendingTemplates, demoTemplates])

  const markRead = useCallback((id: string) => {
    setReadMap((prev) => {
      const next = { ...prev, [id]: true }
      persistReadMap(next)
      return next
    })
  }, [])

  const refreshInvitations = useCallback(() => {
    void syncInvites()
  }, [syncInvites])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      notifOpen,
      openNotifications,
      closeNotifications,
      markAllRead,
      markRead,
      refreshInvitations
    }),
    [
      notifications,
      unreadCount,
      notifOpen,
      openNotifications,
      closeNotifications,
      markAllRead,
      markRead,
      refreshInvitations
    ]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx)
    throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
