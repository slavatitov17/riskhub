'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

import { useProjects } from '@/contexts/projects-context'
import { getSession } from '@/lib/auth-storage'
import { dbGetPendingInvitationsForEmail } from '@/lib/projects-db'
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
  accessibleProjectIds: ReadonlySet<string>
): Omit<NotificationItem, 'isRead'>[] {
  const scoped = risks.filter(
    (r) => r.projectId && accessibleProjectIds.has(r.projectId)
  )
  if (scoped.length === 0) return []
  const sorted = [...scoped].sort(
    (a, b) => Date.parse(b.created) - Date.parse(a.created)
  )
  const pick = sorted.slice(0, 3)
  const templates: Array<{
    title: string
    body: (r: RiskRecord) => string
  }> = [
    {
      title: 'Просрочена мера',
      body: (r) =>
        `Риск ${r.code} «${r.name}» — обновите документацию до конца недели.`
    },
    {
      title: 'Напоминание',
      body: (r) =>
        `По риску ${r.code} «${r.name}» запланирована проверка через 2 дня.`
    },
    {
      title: 'Комментарий',
      body: (r) => `Новый комментарий к риску ${r.code} «${r.name}».`
    }
  ]
  return pick.map((r, i) => ({
    id: `demo_risk_${r.id}`,
    kind: 'demo' as const,
    title: templates[i]!.title,
    body: templates[i]!.body(r),
    tone: 'default' as const,
    actionHref: `/risks/${r.id}`
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

async function fetchInviteTemplates(): Promise<Omit<NotificationItem, 'isRead'>[]> {
  const s = getSession()
  if (!s?.email) return []
  const pending = await dbGetPendingInvitationsForEmail(s.email)
  return pending.map((inv) => ({
    id: `inv_notif_${inv.id}`,
    kind: 'project_invite' as const,
    title: 'Приглашение в проект',
    body: `${inv.inviterName} пригласил вас в проект «${inv.projectName}».`,
    tone: 'default' as const,
    actionHref: '/projects',
    invitationId: inv.id,
    projectId: inv.projectId
  }))
}

export function NotificationsProvider({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const { accessibleProjectIds, ready: projectsReady } = useProjects()
  const [notifOpen, setNotifOpen] = useState(false)
  const [sessionTick, setSessionTick] = useState(0)
  const [inAppEnabled, setInAppEnabled] = useState(() =>
    typeof window !== 'undefined' ? readBuiltInNotificationsEnabled() : true
  )
  const [readMap, setReadMap] = useState<Record<string, boolean>>({})
  const [inviteTemplates, setInviteTemplates] = useState<
    Omit<NotificationItem, 'isRead'>[]
  >([])
  const [risksTick, setRisksTick] = useState(0)

  const syncInvites = useCallback(async () => {
    try {
      const next = await fetchInviteTemplates()
      setInviteTemplates(next)
    } catch {
      setInviteTemplates([])
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

  const demoTemplates = useMemo(() => {
    void risksTick
    if (!projectsReady) return []
    return buildDemoRiskNotifications(loadRisks(), accessibleProjectIds)
  }, [risksTick, projectsReady, accessibleProjectIds])

  const notifications = useMemo((): NotificationItem[] => {
    if (!inAppEnabled) return []
    const demos: NotificationItem[] = demoTemplates.map((n) => ({
      ...n,
      isRead: readMap[n.id] ?? false
    }))
    const invites: NotificationItem[] = inviteTemplates.map((n) => ({
      ...n,
      isRead: readMap[n.id] ?? false
    }))
    return [...invites, ...demos]
  }, [readMap, inviteTemplates, demoTemplates, inAppEnabled])

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0),
    [notifications]
  )

  const closeNotifications = useCallback(() => setNotifOpen(false), [])
  const openNotifications = useCallback(() => setNotifOpen(true), [])

  const markAllRead = useCallback(() => {
    setReadMap((prev) => {
      const next = { ...prev }
      for (const n of inviteTemplates) next[n.id] = true
      for (const n of demoTemplates) next[n.id] = true
      persistReadMap(next)
      return next
    })
  }, [inviteTemplates, demoTemplates])

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
