export interface StoredUser {
  id: string
  name: string
  email: string
  password: string
}

export interface SessionPayload {
  userId: string
  email: string
  name: string
}

const USERS_KEY = 'riskhub_users'
const SESSION_KEY = 'riskhub_session'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return []
  return safeParse<StoredUser[]>(localStorage.getItem(USERS_KEY), [])
}

export function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/** Создаёт демо-пользователя без автоматического входа (для кнопки «Заполнить демо»). */
export function ensureDemoUser() {
  if (typeof window === 'undefined') return
  const users = getUsers()
  if (users.some((u) => u.email === 'demo@riskhub.local')) return
  saveUsers([
    ...users,
    {
      id: 'demo_user',
      name: 'Демо пользователь',
      email: 'demo@riskhub.local',
      password: 'demo123'
    }
  ])
}

export function registerUser(input: {
  name: string
  email: string
  password: string
}): { ok: true; user: StoredUser } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase()
  const users = getUsers()
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, error: 'Пользователь с таким email уже зарегистрирован' }
  }
  const user: StoredUser = {
    id: `u_${crypto.randomUUID()}`,
    name: input.name.trim(),
    email,
    password: input.password
  }
  saveUsers([...users, user])
  setSession({ userId: user.id, email: user.email, name: user.name })
  return { ok: true, user }
}

export function loginUser(input: {
  email: string
  password: string
}): { ok: true } | { ok: false; error: string } {
  const email = input.email.trim().toLowerCase()
  const user = getUsers().find((u) => u.email.toLowerCase() === email)
  if (!user || user.password !== input.password) {
    return { ok: false, error: 'Неверный email или пароль' }
  }
  setSession({ userId: user.id, email: user.email, name: user.name })
  return { ok: true }
}

export function setSession(payload: SessionPayload) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export function getSession(): SessionPayload | null {
  if (typeof window === 'undefined') return null
  return safeParse<SessionPayload | null>(localStorage.getItem(SESSION_KEY), null)
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function updateSessionName(name: string) {
  const s = getSession()
  if (!s) return
  const trimmed = name.trim()
  if (!trimmed) return
  setSession({ ...s, name: trimmed })
  const users = getUsers().map((u) =>
    u.id === s.userId ? { ...u, name: trimmed } : u
  )
  saveUsers(users)
}
