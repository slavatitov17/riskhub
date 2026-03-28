import { getSession } from '@/lib/auth-storage'
import { getProfileForUser } from '@/lib/user-profile-storage'

export function getCurrentUserDisplayName(): string {
  const s = getSession()
  if (!s) return 'Не указан'
  const p = getProfileForUser(s.userId)
  const fromProfile = `${p.firstName} ${p.lastName}`.trim()
  return fromProfile || s.name.trim() || 'Не указан'
}

export function getCurrentUserCommentAuthor(): {
  name: string
  avatarUrl: string | null
} {
  const s = getSession()
  if (!s) return { name: 'Пользователь', avatarUrl: null }
  const p = getProfileForUser(s.userId)
  const name =
    `${p.firstName} ${p.lastName}`.trim() || s.name.trim() || 'Пользователь'
  return { name, avatarUrl: p.avatarDataUrl }
}
