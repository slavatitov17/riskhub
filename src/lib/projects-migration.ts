import { getSession } from '@/lib/auth-storage'
import { normalizeProjectRecord, type ProjectRecord } from '@/lib/project-types'
import {
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

/**
 * Создаёт записи проектов из имён в рисках и проставляет projectId у рисков.
 */
export async function migrateLegacyRisksToProjects(): Promise<void> {
  const session = getSession()
  if (!session?.userId) return

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
