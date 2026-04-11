import { getSession } from '@/lib/auth-storage'
import { normalizeProjectRecord, type ProjectRecord } from '@/lib/project-types'
import {
  dbDeleteProjectCascade,
  dbEnsureAllProjectCodes,
  dbGetAllProjects,
  dbPutProject,
  dbUpgradeProjectShapesIfNeeded,
  maybeBootstrapInvitationsFromLegacySingletonIdb,
  reconcileAllProjectStoresIntoShared
} from '@/lib/projects-db'
import type { RiskRecord } from '@/lib/risk-types'
import { loadRisks, normalizeRiskRecord, saveRisks } from '@/lib/risks-storage'

export function stableLegacyProjectId(projectName: string): string {
  let h = 5381
  for (let i = 0; i < projectName.length; i++)
    h = ((h << 5) + h) ^ projectName.charCodeAt(i)
  return `proj_legacy_${(h >>> 0).toString(16)}`
}

const LEGACY_SAMPLE_PURGE_KEY = 'riskhub_legacy_sample_yxza_r002_005_purged_v1'

const LEGACY_SAMPLE_PROJECT_NAME_LIST = [
  'Проект Y',
  'Проект X',
  'Проект Z',
  'Проект A'
] as const

const LEGACY_SAMPLE_PROJECT_NAMES = new Set<string>(LEGACY_SAMPLE_PROJECT_NAME_LIST)

const LEGACY_SAMPLE_RISK_CODES = new Set([
  'R-002',
  'R-003',
  'R-004',
  'R-005'
])

const SHARED_RISKS_KEY = 'riskhub_risks_shared_v1'

function shouldDropLegacySampleRisk(r: RiskRecord): boolean {
  const code = (r.code ?? '').trim()
  if (LEGACY_SAMPLE_RISK_CODES.has(code)) return true
  const projName = (r.project ?? '').trim()
  if (LEGACY_SAMPLE_PROJECT_NAMES.has(projName)) return true
  for (const name of LEGACY_SAMPLE_PROJECT_NAME_LIST) {
    if (r.projectId === stableLegacyProjectId(name)) return true
  }
  return false
}

/**
 * Удаляет устаревший тестовый набор (проекты Y/X/Z/A и риски R-002…R-005) из
 * общего каталога и IndexedDB. Выполняется один раз на браузер.
 */
export async function purgeLegacySampleDashboardRowsOnce(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(LEGACY_SAMPLE_PURGE_KEY)) return

  const raw = localStorage.getItem(SHARED_RISKS_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as RiskRecord[]
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((row) => !shouldDropLegacySampleRisk(row))
        localStorage.setItem(SHARED_RISKS_KEY, JSON.stringify(filtered))
      }
    } catch {
      /* ignore */
    }
  }

  await maybeBootstrapInvitationsFromLegacySingletonIdb()
  await reconcileAllProjectStoresIntoShared()
  await dbUpgradeProjectShapesIfNeeded()

  const projects = await dbGetAllProjects()
  for (const p of projects) {
    if (!LEGACY_SAMPLE_PROJECT_NAMES.has(p.name.trim())) continue
    try {
      await dbDeleteProjectCascade(p.id)
    } catch {
      /* ignore */
    }
  }

  localStorage.setItem(LEGACY_SAMPLE_PURGE_KEY, '1')
}

/**
 * Создаёт записи проектов из имён в рисках и проставляет projectId у рисков.
 */
export async function migrateLegacyRisksToProjects(): Promise<void> {
  const session = getSession()
  if (!session?.userId) return

  await purgeLegacySampleDashboardRowsOnce()

  await maybeBootstrapInvitationsFromLegacySingletonIdb()
  await reconcileAllProjectStoresIntoShared()
  await dbUpgradeProjectShapesIfNeeded()
  const existing = await dbGetAllProjects()
  const byName = new Map(existing.map((p) => [p.name, p]))
  const risks = loadRisks()
  const names = Array.from(
    new Set(
      risks.map((r) => r.project).filter((n): n is string => Boolean(n?.trim()))
    )
  )
  const ownerFallback = session.userId
  const now = new Date().toISOString()

  for (const name of names) {
    if (byName.has(name)) continue
    const id = stableLegacyProjectId(name)
    const row = normalizeProjectRecord({
      id,
      name,
      category: '',
      ownerUserId: ownerFallback,
      createdAt: now,
      updatedAt: now,
      isPublicLegacy: true,
      status: 'Активен',
      description: '',
      activityLog: [
        {
          id: `${id}-created`,
          at: now,
          message: 'Проект создан'
        }
      ]
    })
    await dbPutProject(row)
    byName.set(name, row)
  }

  let changed = false
  const nextRisks: RiskRecord[] = risks.map((r) => {
    const norm = normalizeRiskRecord(r)
    if (norm.projectId) return norm
    const p = norm.project?.trim()
    if (!p) return norm
    const proj = byName.get(p)
    if (!proj) return norm
    changed = true
    return { ...norm, projectId: proj.id }
  })

  if (changed) saveRisks(nextRisks)

  await dbEnsureAllProjectCodes()
}
