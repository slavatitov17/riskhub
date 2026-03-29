import { getSession } from '@/lib/auth-storage'
import {
  normalizeProjectRecord,
  type ProjectInvitationRecord,
  type ProjectMemberRecord,
  type ProjectRecord,
  type ProjectRecordInput
} from '@/lib/project-types'

const DB_VERSION = 1

/** Старый общий IndexedDB до изоляции по пользователям. */
const LEGACY_SINGLETON_DB_NAME = 'riskhub_projects'

/** Единая БД проектов и участников для всех аккаунтов в этом браузере (коллаборация). */
export const SHARED_PROJECTS_DB_NAME = 'riskhub_projects_shared_v2'

const STORES = {
  projects: 'projects',
  members: 'projectMembers',
  invitations: 'projectInvitations'
} as const

/** Приглашения общие для всех аккаунтов (приглашающий и приглашённый видят одну запись). */
const INVITATIONS_LS_KEY = 'riskhub_project_invitations_v1'

const INVITATIONS_IDB_SINGLETON_BOOTSTRAP_KEY =
  'riskhub_invitations_bootstrapped_from_idb'

function loadInvitationsLs(): ProjectInvitationRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(INVITATIONS_LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as ProjectInvitationRecord[]
  } catch {
    return []
  }
}

function saveInvitationsLs(rows: ProjectInvitationRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(INVITATIONS_LS_KEY, JSON.stringify(rows))
}

/**
 * Однократно подтягивает приглашения из старого общего IndexedDB в localStorage.
 */
export async function maybeBootstrapInvitationsFromLegacySingletonIdb(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(INVITATIONS_IDB_SINGLETON_BOOTSTRAP_KEY)) return

  try {
    const legacyDb = await openDatabase(LEGACY_SINGLETON_DB_NAME)
    const legacyInv = await new Promise<ProjectInvitationRecord[]>(
      (resolve, reject) => {
        const tx = legacyDb.transaction(STORES.invitations, 'readonly')
        const req = tx.objectStore(STORES.invitations).getAll()
        req.onsuccess = () =>
          resolve((req.result as ProjectInvitationRecord[]) ?? [])
        req.onerror = () => reject(req.error)
      }
    )
    for (const inv of legacyInv) await dbPutInvitation(inv)
  } catch {
    /* нет старой БД */
  }

  localStorage.setItem(INVITATIONS_IDB_SINGLETON_BOOTSTRAP_KEY, '1')
}

function getProjectsDbName(): string {
  return SHARED_PROJECTS_DB_NAME
}

function idbGetAllProjectsFromDb(db: IDBDatabase): Promise<ProjectRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, 'readonly')
    const req = tx.objectStore(STORES.projects).getAll()
    req.onsuccess = () =>
      resolve(
        ((req.result as ProjectRecordInput[]) ?? []).map((r) =>
          normalizeProjectRecord(r)
        )
      )
    req.onerror = () => reject(req.error)
  })
}

function idbGetAllMembersFromDb(db: IDBDatabase): Promise<ProjectMemberRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.members, 'readonly')
    const req = tx.objectStore(STORES.members).getAll()
    req.onsuccess = () =>
      resolve((req.result as ProjectMemberRecord[]) ?? [])
    req.onerror = () => reject(req.error)
  })
}

let reconcileInFlight: Promise<void> | null = null

/**
 * Сливает проекты и участников из всех старых IndexedDB (общая, per-user) в общую БД.
 */
export async function reconcileAllProjectStoresIntoShared(): Promise<void> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return
  if (reconcileInFlight) return reconcileInFlight

  reconcileInFlight = (async () => {
    const projects = new Map<string, ProjectRecord>()
    const members = new Map<string, ProjectMemberRecord>()

    const mergeProject = (p: ProjectRecord) => {
      const prev = projects.get(p.id)
      if (!prev || p.updatedAt >= prev.updatedAt) projects.set(p.id, p)
    }

    async function absorbDbName(dbName: string) {
      try {
        const db = await openDatabase(dbName)
        const prows = await idbGetAllProjectsFromDb(db)
        const mrows = await idbGetAllMembersFromDb(db)
        for (const p of prows) mergeProject(p)
        for (const m of mrows) members.set(m.id, m)
      } catch {
        /* база отсутствует */
      }
    }

    const names = new Set<string>()
    names.add(LEGACY_SINGLETON_DB_NAME)
    names.add(SHARED_PROJECTS_DB_NAME)
    const s = getSession()
    if (s?.userId) names.add(`riskhub_projects__${s.userId}`)

    if (typeof indexedDB.databases === 'function') {
      try {
        const dbs = await indexedDB.databases()
        for (const d of dbs) {
          const n = d.name
          if (!n) continue
          if (
            n === LEGACY_SINGLETON_DB_NAME ||
            n === SHARED_PROJECTS_DB_NAME ||
            n.startsWith('riskhub_projects__')
          )
            names.add(n)
        }
      } catch {
        /* ignore */
      }
    }

    for (const n of Array.from(names)) await absorbDbName(n)

    for (const p of Array.from(projects.values())) await dbPutProject(p)
    for (const m of Array.from(members.values())) await dbPutMember(m)
  })().finally(() => {
    reconcileInFlight = null
  })

  return reconcileInFlight
}

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB недоступен'))
      return
    }
    const req = indexedDB.open(name, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.projects))
        db.createObjectStore(STORES.projects, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.members))
        db.createObjectStore(STORES.members, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.invitations))
        db.createObjectStore(STORES.invitations, { keyPath: 'id' })
    }
  })
}

function openDb(): Promise<IDBDatabase> {
  return openDatabase(getProjectsDbName())
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
  })
}

export async function dbUpgradeProjectShapesIfNeeded(): Promise<void> {
  const db = await openDb()
  const rows = await new Promise<ProjectRecordInput[]>((resolve, reject) => {
    const tx = db.transaction(STORES.projects, 'readonly')
    const req = tx.objectStore(STORES.projects).getAll()
    req.onsuccess = () => resolve((req.result as ProjectRecordInput[]) ?? [])
    req.onerror = () => reject(req.error)
  })
  for (const row of rows) {
    const r = row as Partial<ProjectRecord>
    const hasLog = Array.isArray(r.activityLog) && r.activityLog.length > 0
    const codeOk =
      typeof r.code === 'string' && /^P-\d{3}$/.test(r.code.trim())
    if (
      r.status !== undefined &&
      typeof r.description === 'string' &&
      typeof r.updatedAt === 'string' &&
      hasLog &&
      codeOk
    )
      continue
    await dbPutProject(normalizeProjectRecord(row))
  }
}

export async function dbEnsureAllProjectCodes(): Promise<void> {
  const db = await openDb()
  const rawRows = await new Promise<ProjectRecordInput[]>((resolve, reject) => {
    const tx = db.transaction(STORES.projects, 'readonly')
    const req = tx.objectStore(STORES.projects).getAll()
    req.onsuccess = () => resolve((req.result as ProjectRecordInput[]) ?? [])
    req.onerror = () => reject(req.error)
  })
  const normalized = rawRows.map((r) =>
    normalizeProjectRecord(r as ProjectRecordInput)
  )
  if (!normalized.some((p) => !p.code || !/^P-\d{3}$/.test(p.code))) return

  const sorted = [...normalized].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )
  const used = new Set<string>()
  for (const p of sorted) {
    if (p.code && /^P-\d{3}$/.test(p.code)) used.add(p.code)
  }
  for (const p of sorted) {
    if (p.code && /^P-\d{3}$/.test(p.code)) continue
    let num = 1
    let code = `P-${String(num).padStart(3, '0')}`
    while (used.has(code)) {
      num += 1
      code = `P-${String(num).padStart(3, '0')}`
    }
    used.add(code)
    await dbPutProject({ ...p, code })
  }
}

export async function dbDeleteProjectCascade(projectId: string): Promise<void> {
  const members = await dbGetMembersForProject(projectId)
  const allInv = loadInvitationsLs()
  saveInvitationsLs(allInv.filter((i) => i.projectId !== projectId))
  const db = await openDb()
  const tx = db.transaction([STORES.members, STORES.projects], 'readwrite')
  const mStore = tx.objectStore(STORES.members)
  const pStore = tx.objectStore(STORES.projects)
  for (const m of members) mStore.delete(m.id)
  pStore.delete(projectId)
  await txDone(tx)
}

export async function dbGetAllProjects(): Promise<ProjectRecord[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, 'readonly')
    const req = tx.objectStore(STORES.projects).getAll()
    req.onsuccess = () =>
      resolve(
        ((req.result as ProjectRecordInput[]) ?? []).map(normalizeProjectRecord)
      )
    req.onerror = () => reject(req.error)
  })
}

export async function dbPutProject(row: ProjectRecord): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORES.projects, 'readwrite')
  tx.objectStore(STORES.projects).put(row)
  await txDone(tx)
}

export async function dbGetProject(id: string): Promise<ProjectRecord | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.projects, 'readonly')
    const req = tx.objectStore(STORES.projects).get(id)
    req.onsuccess = () => {
      const r = req.result as ProjectRecordInput | undefined
      resolve(r ? normalizeProjectRecord(r) : undefined)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function dbGetMembersForProject(
  projectId: string
): Promise<ProjectMemberRecord[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.members, 'readonly')
    const store = tx.objectStore(STORES.members)
    const req = store.getAll()
    req.onsuccess = () => {
      const all = (req.result as ProjectMemberRecord[]) ?? []
      resolve(all.filter((m) => m.projectId === projectId))
    }
    req.onerror = () => reject(req.error)
  })
}

export async function dbPutMember(row: ProjectMemberRecord): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORES.members, 'readwrite')
  tx.objectStore(STORES.members).put(row)
  await txDone(tx)
}

export async function dbPutInvitation(row: ProjectInvitationRecord): Promise<void> {
  const all = loadInvitationsLs()
  const idx = all.findIndex((i) => i.id === row.id)
  const next =
    idx >= 0 ? all.map((i, j) => (j === idx ? row : i)) : [...all, row]
  saveInvitationsLs(next)
}

export async function dbGetInvitation(id: string): Promise<ProjectInvitationRecord | undefined> {
  return loadInvitationsLs().find((i) => i.id === id)
}

export async function dbGetAllInvitations(): Promise<ProjectInvitationRecord[]> {
  return loadInvitationsLs()
}

export async function dbGetPendingInvitationsForEmail(
  email: string
): Promise<ProjectInvitationRecord[]> {
  const norm = email.trim().toLowerCase()
  const all = await dbGetAllInvitations()
  return all.filter(
    (i) =>
      i.inviteeEmail.trim().toLowerCase() === norm && i.status === 'pending'
  )
}
