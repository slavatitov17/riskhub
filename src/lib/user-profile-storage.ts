import { getSession, getUsers, saveUsers, setSession } from '@/lib/auth-storage'

export interface UserProfile {
  firstName: string
  lastName: string
  workplace: string
  department: string
  position: string
  about: string
  avatarDataUrl: string | null
}

const PROFILES_KEY = 'riskhub_user_profiles'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function loadMap(): Record<string, UserProfile> {
  if (typeof window === 'undefined') return {}
  return safeParse<Record<string, UserProfile>>(
    localStorage.getItem(PROFILES_KEY),
    {}
  )
}

function saveMap(map: Record<string, UserProfile>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILES_KEY, JSON.stringify(map))
}

function fullNameFromParts(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

function nameToParts(full: string): Pick<UserProfile, 'firstName' | 'lastName'> {
  const p = full.trim().split(/\s+/).filter(Boolean)
  if (p.length === 0) return { firstName: '', lastName: '' }
  if (p.length === 1) return { firstName: p[0]!, lastName: '' }
  return { firstName: p[0]!, lastName: p.slice(1).join(' ') }
}

export function getDefaultProfileFromSessionName(fullName: string): UserProfile {
  const { firstName, lastName } = nameToParts(fullName)
  return {
    firstName,
    lastName,
    workplace: '',
    department: '',
    position: '',
    about: '',
    avatarDataUrl: null
  }
}

export function getProfileForUser(userId: string): UserProfile {
  const map = loadMap()
  const existing = map[userId]
  if (existing) return existing
  const s = getSession()
  const baseName = s?.userId === userId ? (s.name ?? '') : ''
  return getDefaultProfileFromSessionName(baseName)
}

export function saveProfileForUser(
  userId: string,
  patch: Partial<UserProfile>
): UserProfile {
  const map = loadMap()
  const prev = map[userId] ?? getProfileForUser(userId)
  const next: UserProfile = {
    firstName: patch.firstName ?? prev.firstName,
    lastName: patch.lastName ?? prev.lastName,
    workplace: patch.workplace ?? prev.workplace,
    department: patch.department ?? prev.department,
    position: patch.position ?? prev.position,
    about: patch.about ?? prev.about,
    avatarDataUrl:
      patch.avatarDataUrl !== undefined ? patch.avatarDataUrl : prev.avatarDataUrl
  }
  saveMap({ ...map, [userId]: next })
  const s = getSession()
  if (s?.userId === userId) {
    const display =
      fullNameFromParts(next.firstName, next.lastName) || s.name || 'Пользователь'
    setSession({ ...s, name: display })
    const users = getUsers().map((u) =>
      u.id === userId ? { ...u, name: display } : u
    )
    saveUsers(users)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('riskhub-profile-updated'))
  }
  return next
}

export function initProfileForNewUser(
  userId: string,
  firstName: string,
  lastName: string
) {
  const map = loadMap()
  if (map[userId]) return
  saveMap({
    ...map,
    [userId]: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      workplace: '',
      department: '',
      position: '',
      about: '',
      avatarDataUrl: null
    }
  })
}
