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

const STORES = {
  projects: 'projects',
  members: 'projectMembers',
  invitations: 'projectInvitations'
} as const

function getProjectsDbName(): string {
  const uid = getSession()?.userId
  if (!uid) throw new Error('Требуется сессия для базы проектов')
  return `riskhub_projects__${uid}`
}

function legacyImportDoneKey(userId: string) {
  return `riskhub_idb_legacy_singleton_import__${userId}`
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

/**
 * Однократно переносит в БД текущего пользователя проекты из старого общего IndexedDB
 * (владелец или участник, без публичных legacy-проектов).
 */
export async function maybeMigrateLegacySingletonProjectsDb(): Promise<void> {
  if (typeof window === 'undefined') return
  const s = getSession()
  if (!s?.userId) return

  const flag = legacyImportDoneKey(s.userId)
  if (localStorage.getItem(flag)) return

  const normEmail = s.email.trim().toLowerCase()

  let existingCount = 0
  try {
    const db = await openDb()
    existingCount = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORES.projects, 'readonly')
      const req = tx.objectStore(STORES.projects).count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return
  }

  if (existingCount > 0) {
    localStorage.setItem(flag, '1')
    return
  }

  let legacyDb: IDBDatabase
  try {
    legacyDb = await openDatabase(LEGACY_SINGLETON_DB_NAME)
  } catch {
    localStorage.setItem(flag, '1')
    return
  }

  const legacyProjects = await new Promise<ProjectRecordInput[]>((resolve, reject) => {
    const tx = legacyDb.transaction(STORES.projects, 'readonly')
    const req = tx.objectStore(STORES.projects).getAll()
    req.onsuccess = () => resolve((req.result as ProjectRecordInput[]) ?? [])
    req.onerror = () => reject(req.error)
  })

  const legacyMembers = await new Promise<ProjectMemberRecord[]>((resolve, reject) => {
    const tx = legacyDb.transaction(STORES.members, 'readonly')
    const req = tx.objectStore(STORES.members).getAll()
    req.onsuccess = () => resolve((req.result as ProjectMemberRecord[]) ?? [])
    req.onerror = () => reject(req.error)
  })

  const legacyInv = await new Promise<ProjectInvitationRecord[]>((resolve, reject) => {
    const tx = legacyDb.transaction(STORES.invitations, 'readonly')
    const req = tx.objectStore(STORES.invitations).getAll()
    req.onsuccess = () => resolve((req.result as ProjectInvitationRecord[]) ?? [])
    req.onerror = () => reject(req.error)
  })

  const relevantIds = new Set<string>()
  for (const row of legacyProjects) {
    const p = normalizeProjectRecord(row)
    if (p.isPublicLegacy) continue
    if (p.ownerUserId === s.userId) relevantIds.add(p.id)
  }
  for (const m of legacyMembers) {
    if (m.userId !== s.userId) continue
    const proj = legacyProjects.find((x) => (x as ProjectRecord).id === m.projectId)
    if (proj && !normalizeProjectRecord(proj as ProjectRecordInput).isPublicLegacy)
      relevantIds.add(m.projectId)
  }

  for (const inv of legacyInv) {
    if (inv.inviteeEmail.trim().toLowerCase() !== normEmail) continue
    if (relevantIds.has(inv.projectId)) continue
    const proj = legacyProjects.find((x) => (x as ProjectRecord).id === inv.projectId)
    if (proj && !normalizeProjectRecord(proj as ProjectRecordInput).isPublicLegacy)
      relevantIds.add(inv.projectId)
  }

  if (relevantIds.size === 0) {
    localStorage.setItem(flag, '1')
    return
  }

  for (const row of legacyProjects) {
    const p = normalizeProjectRecord(row)
    if (!relevantIds.has(p.id)) continue
    await dbPutProject(p)
  }

  for (const m of legacyMembers) {
    if (relevantIds.has(m.projectId)) await dbPutMember(m)
  }

  for (const inv of legacyInv) {
    if (!relevantIds.has(inv.projectId)) continue
    if (inv.inviteeEmail.trim().toLowerCase() !== normEmail) continue
    await dbPutInvitation(inv)
  }

  localStorage.setItem(flag, '1')
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
  const allInv = await dbGetAllInvitations()
  const invToDel = allInv.filter((i) => i.projectId === projectId)
  const db = await openDb()
  const tx = db.transaction(
    [STORES.members, STORES.invitations, STORES.projects],
    'readwrite'
  )
  const mStore = tx.objectStore(STORES.members)
  const iStore = tx.objectStore(STORES.invitations)
  const pStore = tx.objectStore(STORES.projects)
  for (const m of members) mStore.delete(m.id)
  for (const i of invToDel) iStore.delete(i.id)
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
  const db = await openDb()
  const tx = db.transaction(STORES.invitations, 'readwrite')
  tx.objectStore(STORES.invitations).put(row)
  await txDone(tx)
}

export async function dbGetInvitation(id: string): Promise<ProjectInvitationRecord | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.invitations, 'readonly')
    const req = tx.objectStore(STORES.invitations).get(id)
    req.onsuccess = () => resolve(req.result as ProjectInvitationRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function dbGetAllInvitations(): Promise<ProjectInvitationRecord[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.invitations, 'readonly')
    const req = tx.objectStore(STORES.invitations).getAll()
    req.onsuccess = () => resolve((req.result as ProjectInvitationRecord[]) ?? [])
    req.onerror = () => reject(req.error)
  })
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
