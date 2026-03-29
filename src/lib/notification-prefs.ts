export const NOTIFICATION_PREFS_KEY = 'riskhub_notification_prefs'

export const RISKHUB_NOTIFICATION_PREFS_CHANGED = 'riskhub-notification-prefs-changed'

export interface NotificationPrefs {
  email: boolean
  inApp: boolean
}

export function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return { email: false, inApp: true }
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_KEY)
    if (!raw) return { email: false, inApp: true }
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>
    return {
      email: !!parsed.email,
      inApp: parsed.inApp !== false
    }
  } catch {
    return { email: false, inApp: true }
  }
}

export function writeNotificationPrefs(next: NotificationPrefs) {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(RISKHUB_NOTIFICATION_PREFS_CHANGED))
}

export function readBuiltInNotificationsEnabled(): boolean {
  return readNotificationPrefs().inApp
}
