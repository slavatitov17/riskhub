import { getSession } from '@/lib/auth-storage'
import { getProfileForUser } from '@/lib/user-profile-storage'

function normalizeDisplayName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** True when the signed-in user matches the risk card author (by display name). */
export function isCurrentUserRiskAuthor(riskAuthor: string): boolean {
  const s = getSession()
  if (!s) return false
  const me = normalizeDisplayName(getCurrentUserDisplayName())
  const author = normalizeDisplayName(riskAuthor)
  if (!author) return false
  return me === author
}

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
