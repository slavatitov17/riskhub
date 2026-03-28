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
import { dbGetPendingInvitationsForEmail } from '@/lib/projects-db'

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

const NOTIF_READ_KEY = 'riskhub_notifications_read_v2'

const defaultNotifications: Omit<NotificationItem, 'isRead'>[] = [
  {
    id: 'demo_1',
    kind: 'demo',
    title: 'Просрочена мера',
    body: 'Риск R-104 — обновите документацию до конца недели.',
    tone: 'destructive',
    actionHref: '/risks'
  },
  {
    id: 'demo_2',
    kind: 'demo',
    title: 'Напоминание',
    body: 'Проверка риска R-101 через 2 дня.',
    tone: 'default',
    actionHref: '/risks'
  },
  {
    id: 'demo_3',
    kind: 'demo',
    title: 'Комментарий',
    body: 'Новый комментарий к риску R-99.',
    tone: 'default',
    actionHref: '/risks'
  }
]

function loadReadMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(NOTIF_READ_KEY)
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
  window.localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(readMap))
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
    invitationId: inv.id
  }))
}

export function NotificationsProvider({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [readMap, setReadMap] = useState<Record<string, boolean>>({})
  const [inviteTemplates, setInviteTemplates] = useState<
    Omit<NotificationItem, 'isRead'>[]
  >([])

  const syncInvites = useCallback(async () => {
    try {
      const next = await fetchInviteTemplates()
      setInviteTemplates(next)
    } catch {
      setInviteTemplates([])
    }
  }, [])

  useEffect(() => {
    setReadMap(loadReadMap())
    void syncInvites()
  }, [syncInvites])

  useEffect(() => {
    const onChange = () => void syncInvites()
    window.addEventListener('riskhub-invitations-changed', onChange)
    window.addEventListener('riskhub-session-changed', onChange)
    return () => {
      window.removeEventListener('riskhub-invitations-changed', onChange)
      window.removeEventListener('riskhub-session-changed', onChange)
    }
  }, [syncInvites])

  const notifications = useMemo((): NotificationItem[] => {
    const demos: NotificationItem[] = defaultNotifications.map((n, index) => ({
      ...n,
      isRead: readMap[n.id] ?? index === 2
    }))
    const invites: NotificationItem[] = inviteTemplates.map((n) => ({
      ...n,
      isRead: readMap[n.id] ?? false
    }))
    return [...invites, ...demos]
  }, [readMap, inviteTemplates])

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
      for (const n of defaultNotifications) next[n.id] = true
      persistReadMap(next)
      return next
    })
  }, [inviteTemplates])

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
