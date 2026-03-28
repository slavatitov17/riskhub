import {
  normalizeProjectRecord,
  type ProjectInvitationRecord,
  type ProjectMemberRecord,
  type ProjectRecord,
  type ProjectRecordInput
} from '@/lib/project-types'

const DB_NAME = 'riskhub_projects'
const DB_VERSION = 1

const STORES = {
  projects: 'projects',
  members: 'projectMembers',
  invitations: 'projectInvitations'
} as const

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB недоступен'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
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
    if (
      r.status !== undefined &&
      typeof r.description === 'string' &&
      typeof r.updatedAt === 'string' &&
      hasLog
    )
      continue
    await dbPutProject(normalizeProjectRecord(row))
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
