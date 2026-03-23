'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

type NotificationTone = 'default' | 'destructive'

interface NotificationItem {
  id: string
  title: string
  body: string
  tone: NotificationTone
  riskRoute: string
  isRead: boolean
}

interface NotificationsContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  notifOpen: boolean
  openNotifications: () => void
  closeNotifications: () => void
  markAllRead: () => void
  markRead: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
)

const NOTIF_READ_KEY = 'riskhub_notifications_read_v1'

const defaultNotifications: Omit<NotificationItem, 'isRead'>[] = [
  {
    id: '1',
    title: 'Просрочена мера',
    body: 'Риск R-104 — обновите документацию до конца недели.',
    tone: 'destructive',
    riskRoute: '/risks'
  },
  {
    id: '2',
    title: 'Напоминание',
    body: 'Проверка риска R-101 через 2 дня.',
    tone: 'default',
    riskRoute: '/risks'
  },
  {
    id: '3',
    title: 'Комментарий',
    body: 'Новый комментарий к риску R-99.',
    tone: 'default',
    riskRoute: '/risks'
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

export function NotificationsProvider({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    defaultNotifications.map((n, index) => ({
      ...n,
      // Чтобы в UI были и “Непрочитанные”, и “Прочитанные” группы.
      isRead: index === 2
    }))
  )

  useEffect(() => {
    const readMap = loadReadMap()
    const next = defaultNotifications.map((n, index) => ({
      ...n,
      isRead: readMap[n.id] ?? (index === 2)
    }))

    setNotifications(next)
  }, [])

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => acc + (n.isRead ? 0 : 1), 0),
    [notifications]
  )

  const closeNotifications = useCallback(() => setNotifOpen(false), [])
  const openNotifications = useCallback(() => setNotifOpen(true), [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }))
      const readMap = Object.fromEntries(next.map((n) => [n.id, true]))
      persistReadMap(readMap)
      return next
    })
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      const readMap = Object.fromEntries(next.map((n) => [n.id, n.isRead]))
      persistReadMap(readMap)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      notifOpen,
      openNotifications,
      closeNotifications,
      markAllRead,
      markRead
    }),
    [
      notifications,
      unreadCount,
      notifOpen,
      openNotifications,
      closeNotifications,
      markAllRead,
      markRead
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
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}

