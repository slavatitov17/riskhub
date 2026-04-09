const RISK_CATEGORIES_KEY = 'riskhub_custom_risk_categories_v1'
const PROJECT_CATEGORIES_KEY = 'riskhub_custom_project_categories_v1'

type CategoryKind = 'risk' | 'project'

function getStorageKey(kind: CategoryKind) {
  return kind === 'risk' ? RISK_CATEGORIES_KEY : PROJECT_CATEGORIES_KEY
}

function readList(key: string): string[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(key)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  } catch {
    return []
  }
}

function writeList(key: string, list: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(list))
}

export function getCustomCategories(kind: CategoryKind): string[] {
  return readList(getStorageKey(kind))
}

export function saveCustomCategory(kind: CategoryKind, rawValue: string) {
  const value = rawValue.trim()
  if (!value) return
  const key = getStorageKey(kind)
  const list = readList(key)
  if (list.some((item) => item.toLowerCase() === value.toLowerCase())) return
  writeList(key, [value, ...list])
}
