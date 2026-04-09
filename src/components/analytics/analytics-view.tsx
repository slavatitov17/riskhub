'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from 'recharts'
import { CalendarDays, ChevronDown, Download, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/app-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLocale } from '@/contexts/locale-context'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import { useVisibleRisks } from '@/hooks/use-visible-risks'
import {
  exportAnalyticsPdfDocument,
  formatProjectPdfFilterLines,
  formatRiskPdfFilterLines
} from '@/lib/analytics-pdf-export'
import { getUsers } from '@/lib/auth-storage'
import { getPageCopy } from '@/lib/page-copy'
import type { ProjectRecord } from '@/lib/project-types'
import type { RiskRecord } from '@/lib/risk-types'
import { formatLocaleDateTime, riskDateKey } from '@/lib/risks-storage'
import {
  IMPACTS,
  LEVELS,
  RISK_CATEGORIES,
  RISK_STATUSES
} from '@/lib/risk-types'

const MONTH_LABELS_RU = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек'
] as const

const MONTH_LABELS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
] as const

const PROJECT_STATUS_CHART_BLUE = 'hsl(217 91% 60%)'

const PIE_COLORS = [
  'hsl(217 91% 60%)',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(280 65% 60%)',
  'hsl(0 84% 60%)',
  'hsl(199 89% 48%)',
  'hsl(330 81% 60%)'
]

function probabilityBarColor(name: string) {
  if (name === 'Высокая') return 'hsl(350 82% 48%)'
  if (name === 'Средняя') return 'hsl(38 85% 45%)'
  return 'hsl(142 76% 38%)'
}

function AnalyticsTooltip({
  active,
  payload,
  label,
  valueSeriesLabel
}: TooltipProps<number, string> & { valueSeriesLabel: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
      {label != null && String(label) !== '' ? (
        <p className="mb-1 font-medium text-foreground">{label}</p>
      ) : null}
      <div className="space-y-0.5">
        {payload.map((entry, i) => {
          const rawName = entry.name
          const isValueSeries =
            entry.dataKey === 'value' ||
            (typeof rawName === 'string' && rawName.toLowerCase() === 'value')
          const nameStr = isValueSeries ? valueSeriesLabel : String(rawName ?? '')
          const key = `${String(entry.dataKey ?? '')}-${i}`
          return (
            <p key={key} className="text-foreground">
              <span
                className="mr-1.5 inline-block size-2 rounded-full align-middle"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              {nameStr}:{' '}
              <span className="font-medium tabular-nums">{entry.value}</span>
            </p>
          )
        })}
      </div>
    </div>
  )
}

export type ReportFilters = {
  periodFrom: string
  periodTo: string
  probability: string[]
  impact: string[]
  status: string[]
  riskId: string[]
  category: string[]
  project: string[]
  keywords: string
}

type AnalyticsMode = 'risks' | 'projects'

export type ProjectReportFilters = {
  periodFrom: string
  periodTo: string
  status: string[]
  category: string[]
  projectId: string[]
  participants: string[]
  keywords: string
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultReportFilters(): ReportFilters {
  const to = new Date()
  to.setHours(12, 0, 0, 0)
  const from = new Date(to)
  from.setFullYear(from.getFullYear() - 1)
  return {
    periodFrom: isoDate(from),
    periodTo: isoDate(to),
    probability: [],
    impact: [],
    status: [],
    riskId: [],
    category: [],
    project: [],
    keywords: ''
  }
}

function defaultProjectReportFilters(): ProjectReportFilters {
  const to = new Date()
  to.setHours(12, 0, 0, 0)
  const from = new Date(to)
  from.setFullYear(from.getFullYear() - 1)
  return {
    periodFrom: isoDate(from),
    periodTo: isoDate(to),
    status: [],
    category: [],
    projectId: [],
    participants: [],
    keywords: ''
  }
}

function parseYmd(s: string): Date | null {
  if (!s || s.length < 10) return null
  const d = new Date(`${s.slice(0, 10)}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function eachDateInInclusiveRange(from: Date, to: Date): Date[] {
  const res: Date[] = []
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  const end = new Date(to)
  end.setHours(12, 0, 0, 0)
  while (d <= end) {
    res.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return res
}

function buildTimelineFromReport(
  periodFrom: string,
  periodTo: string,
  filteredRisks: RiskRecord[],
  activeKey: string,
  closedKey: string,
  monthLabels: readonly string[]
): Record<string, string | number>[] {
  let fromD = parseYmd(periodFrom)
  let toD = parseYmd(periodTo)
  if (!fromD || !toD || fromD > toD) {
    toD = new Date()
    toD.setHours(12, 0, 0, 0)
    fromD = new Date(toD)
    fromD.setDate(fromD.getDate() - 6)
  }

  const days = eachDateInInclusiveRange(fromD, toD)

  const countsForKeys = (kf: string, kt: string) => {
    const inRange = filteredRisks.filter((r) => {
      const k = riskDateKey(r.created)
      return k >= kf && k <= kt
    })
    return {
      [activeKey]: inRange.filter((r) => r.status !== 'Закрыт').length,
      [closedKey]: inRange.filter((r) => r.status === 'Закрыт').length
    }
  }

  if (days.length <= 45) {
    return days.map((d) => {
      const key = isoDate(d)
      const inDay = filteredRisks.filter((r) => riskDateKey(r.created) === key)
      return {
        month: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
        [activeKey]: inDay.filter((r) => r.status !== 'Закрыт').length,
        [closedKey]: inDay.filter((r) => r.status === 'Закрыт').length
      }
    })
  }

  if (days.length <= 120) {
    const out: Record<string, string | number>[] = []
    for (let i = 0; i < days.length; i += 7) {
      const chunk = days.slice(i, i + 7)
      const kf = isoDate(chunk[0]!)
      const kt = isoDate(chunk[chunk.length - 1]!)
      out.push({
        month: `${kf.slice(8, 10)}.${kf.slice(5, 7)}–${kt.slice(8, 10)}.${kt.slice(5, 7)}`,
        ...countsForKeys(kf, kt)
      })
    }
    return out
  }

  const out: Record<string, string | number>[] = []
  const cur = new Date(fromD.getFullYear(), fromD.getMonth(), 1)
  const endM = new Date(toD.getFullYear(), toD.getMonth(), 1)
  while (cur <= endM) {
    const ym = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`
    const inMonth = filteredRisks.filter((r) => r.created.slice(0, 7) === ym)
    out.push({
      month: monthLabels[cur.getMonth()] ?? ym,
      [activeKey]: inMonth.filter((r) => r.status !== 'Закрыт').length,
      [closedKey]: inMonth.filter((r) => r.status === 'Закрыт').length
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return out
}

function ChartEmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-8 text-center opacity-60">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-foreground">{hint}</p>
    </div>
  )
}

function matchesReportFilters(
  r: RiskRecord,
  f: ReportFilters,
  projectLabel: string
) {
  const createdDay = riskDateKey(r.created)
  if (f.periodFrom && createdDay < f.periodFrom) return false
  if (f.periodTo && createdDay > f.periodTo) return false
  if (f.probability.length && !f.probability.includes(r.probability))
    return false
  if (f.impact.length && !f.impact.includes(r.impact)) return false
  if (f.status.length && !f.status.includes(r.status)) return false
  if (f.riskId.length && !f.riskId.includes(r.code)) return false
  if (f.category.length && !f.category.includes(r.category)) return false
  if (f.project.length && !f.project.includes(projectLabel)) return false
  if (f.keywords.trim()) {
    const q = f.keywords.toLowerCase().trim()
    if (
      !r.name.toLowerCase().includes(q) &&
      !r.description.toLowerCase().includes(q)
    )
      return false
  }
  return true
}

function projectStatusMatchesFilter(projectStatus: string, selected: string[]) {
  return selected.some((sel) => {
    if (sel === 'Закрыт') return projectStatus === 'Завершен'
    return sel === projectStatus
  })
}

function matchesProjectReportFilters(
  project: ProjectRecord,
  filters: ProjectReportFilters,
  participantDisplayNames: readonly string[]
) {
  const createdDay = riskDateKey(project.createdAt)
  if (filters.periodFrom && createdDay < filters.periodFrom) return false
  if (filters.periodTo && createdDay > filters.periodTo) return false
  if (filters.status.length && !projectStatusMatchesFilter(project.status, filters.status))
    return false
  if (filters.category.length && !filters.category.includes(project.category))
    return false
  if (filters.projectId.length && !filters.projectId.includes(project.code)) return false
  if (filters.participants.length) {
    const hit = filters.participants.some((sel) => participantDisplayNames.includes(sel))
    if (!hit) return false
  }
  if (filters.keywords.trim()) {
    const query = filters.keywords.toLowerCase().trim()
    const text = `${project.name} ${project.description} ${project.category}`.toLowerCase()
    if (!text.includes(query)) return false
  }
  return true
}

function buildProjectTimeline(
  periodFrom: string,
  periodTo: string,
  filteredProjects: ProjectRecord[],
  activeKey: string,
  doneKey: string,
  monthLabels: readonly string[]
) {
  let fromD = parseYmd(periodFrom)
  let toD = parseYmd(periodTo)
  if (!fromD || !toD || fromD > toD) {
    toD = new Date()
    toD.setHours(12, 0, 0, 0)
    fromD = new Date(toD)
    fromD.setDate(fromD.getDate() - 6)
  }

  const days = eachDateInInclusiveRange(fromD, toD)
  if (days.length <= 45) {
    return days.map((d) => {
      const key = isoDate(d)
      const inDay = filteredProjects.filter((project) => riskDateKey(project.createdAt) === key)
      return {
        month: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
        [activeKey]: inDay.filter((project) => project.status !== 'Завершен').length,
        [doneKey]: inDay.filter((project) => project.status === 'Завершен').length
      }
    })
  }

  const out: Record<string, string | number>[] = []
  const current = new Date(fromD.getFullYear(), fromD.getMonth(), 1)
  const end = new Date(toD.getFullYear(), toD.getMonth(), 1)
  while (current <= end) {
    const ym = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    const inMonth = filteredProjects.filter((project) => project.createdAt.slice(0, 7) === ym)
    out.push({
      month: monthLabels[current.getMonth()] ?? ym,
      [activeKey]: inMonth.filter((project) => project.status !== 'Завершен').length,
      [doneKey]: inMonth.filter((project) => project.status === 'Завершен').length
    })
    current.setMonth(current.getMonth() + 1)
  }
  return out
}

function ReportFilterMultiSelect({
  label,
  allLabel,
  options,
  selected,
  onChange,
  formatSelected
}: {
  label: string
  allLabel: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  formatSelected: (n: number) => string
}) {
  const isAll = selected.length === 0
  const summary = isAll ? allLabel : formatSelected(selected.length)

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between px-3 font-normal"
          >
            <span className="truncate">{summary}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
          align="start"
        >
          <DropdownMenuCheckboxItem
            checked={isAll}
            onCheckedChange={(c) => {
              if (c) onChange([])
            }}
            onSelect={(e) => e.preventDefault()}
          >
            {allLabel}
          </DropdownMenuCheckboxItem>
          {options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={!isAll && selected.includes(opt)}
              onCheckedChange={(c) => {
                if (c) {
                  onChange(
                    selected.length === 0
                      ? [opt]
                      : Array.from(new Set([...selected, opt]))
                  )
                } else {
                  onChange(selected.filter((x) => x !== opt))
                }
              }}
              onSelect={(e) => e.preventDefault()}
            >
              {opt}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ReportFilterSearchableMultiSelect({
  label,
  allLabel,
  options,
  selected,
  onChange,
  searchPlaceholder,
  formatSelected,
  notFoundLabel,
  searchAriaPrefix
}: {
  label: string
  allLabel: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  searchPlaceholder: string
  formatSelected: (n: number) => string
  notFoundLabel: string
  searchAriaPrefix: string
}) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const isAll = selected.length === 0
  const summary = isAll ? allLabel : formatSelected(selected.length)
  const q = query.trim().toLowerCase()
  const filteredOptions = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(q)),
    [options, q]
  )

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between px-3 font-normal"
          >
            <span className="truncate">{summary}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-border p-2">
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9"
              onKeyDown={(e) => e.stopPropagation()}
              aria-label={`${searchAriaPrefix} ${label}`}
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            <DropdownMenuCheckboxItem
              checked={isAll}
              onCheckedChange={(c) => {
                if (c) onChange([])
              }}
              onSelect={(e) => e.preventDefault()}
            >
              {allLabel}
            </DropdownMenuCheckboxItem>
            {filteredOptions.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt}
                checked={!isAll && selected.includes(opt)}
                onCheckedChange={(c) => {
                  if (c) {
                    onChange(
                      selected.length === 0
                        ? [opt]
                        : Array.from(new Set([...selected, opt]))
                    )
                  } else {
                    onChange(selected.filter((x) => x !== opt))
                  }
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {opt}
              </DropdownMenuCheckboxItem>
            ))}
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                {notFoundLabel}
              </p>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

type AnalyticsChartCaptureKey =
  | 'riskByCategory'
  | 'riskTimeline'
  | 'riskPieCategory'
  | 'riskByStatus'
  | 'riskProbability'
  | 'projByCategory'
  | 'projTimeline'
  | 'projByStatus'

export function AnalyticsView() {
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const monthLabels = locale === 'en' ? MONTH_LABELS_EN : MONTH_LABELS_RU
  const formatSelected = (n: number) =>
    p.analytics.selectedCount.replace('{n}', String(n))
  const searchAriaPrefix = locale === 'en' ? 'Search:' : 'Поиск:'

  const { refresh } = useRisks()
  const risks = useVisibleRisks()
  const { getProjectDisplayName, listProjectMembers, myProjects } = useProjects()
  const [mode, setMode] = useState<AnalyticsMode>('risks')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [draft, setDraft] = useState<ReportFilters>(() => defaultReportFilters())
  const [applied, setApplied] = useState<ReportFilters>(() => defaultReportFilters())
  const [draftProject, setDraftProject] = useState<ProjectReportFilters>(() =>
    defaultProjectReportFilters()
  )
  const [appliedProject, setAppliedProject] = useState<ProjectReportFilters>(() =>
    defaultProjectReportFilters()
  )
  const [projectParticipantNamesByProject, setProjectParticipantNamesByProject] =
    useState<Record<string, string[]>>({})
  const [participantNameOptions, setParticipantNameOptions] = useState<string[]>([])
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const coverPdfRef = useRef<HTMLDivElement>(null)
  const chartCaptureRef = useRef<
    Partial<Record<AnalyticsChartCaptureKey, HTMLDivElement | null>>
  >({})

  const setChartCaptureRef = (key: AnalyticsChartCaptureKey) => (node: HTMLDivElement | null) => {
    chartCaptureRef.current[key] = node
  }

  const riskCodes = useMemo(
    () => Array.from(new Set(risks.map((r) => r.code))).sort(),
    [risks]
  )
  const projects = useMemo(
    () =>
      Array.from(
        new Set(
          risks.map((r) => getProjectDisplayName(r.projectId, r.project))
        )
      ).sort(),
    [risks, getProjectDisplayName]
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      const users = getUsers()
      const idToName = new Map(users.map((u) => [u.id, u.name]))
      const byProject: Record<string, string[]> = {}
      const allNames = new Set<string>()
      for (const project of myProjects) {
        const set = new Set<string>()
        const ownerName = idToName.get(project.ownerUserId)
        if (ownerName) {
          set.add(ownerName)
          allNames.add(ownerName)
        }
        const members = await listProjectMembers(project.id)
        for (const m of members) {
          const label = idToName.get(m.userId) ?? m.email
          set.add(label)
          allNames.add(label)
        }
        byProject[project.id] = Array.from(set)
      }
      if (alive) {
        setProjectParticipantNamesByProject(byProject)
        setParticipantNameOptions(Array.from(allNames).sort((a, b) => a.localeCompare(b)))
      }
    })()
    return () => {
      alive = false
    }
  }, [myProjects, listProjectMembers])

  const filteredRisks = useMemo(
    () =>
      risks.filter((r) =>
        matchesReportFilters(
          r,
          applied,
          getProjectDisplayName(r.projectId, r.project)
        )
      ),
    [risks, applied, getProjectDisplayName]
  )

  const projectCodes = useMemo(
    () => myProjects.map((project) => project.code).filter(Boolean).sort(),
    [myProjects]
  )
  const projectCategories = useMemo(
    () =>
      Array.from(new Set(myProjects.map((project) => project.category)))
        .filter(Boolean)
        .sort(),
    [myProjects]
  )
  const projectStatusFilterOptions = useMemo(() => {
    const set = new Set<string>(myProjects.map((project) => project.status))
    set.add('Закрыт')
    return Array.from(set).sort((a, b) => {
      const rank = (s: string) =>
        s === 'Активен' ? 0 : s === 'Завершен' ? 1 : s === 'Закрыт' ? 2 : 3
      const d = rank(a) - rank(b)
      return d !== 0 ? d : a.localeCompare(b)
    })
  }, [myProjects])

  const filteredProjects = useMemo(
    () =>
      myProjects.filter((project) =>
        matchesProjectReportFilters(
          project,
          appliedProject,
          projectParticipantNamesByProject[project.id] ?? []
        )
      ),
    [myProjects, appliedProject, projectParticipantNamesByProject]
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    filteredRisks.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + 1))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredRisks])

  const byStatus = useMemo(() => {
    const map = new Map<string, number>()
    filteredRisks.forEach((r) => map.set(r.status, (map.get(r.status) ?? 0) + 1))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredRisks])

  const byProbability = useMemo(() => {
    const map = new Map<string, number>()
    filteredRisks.forEach((r) =>
      map.set(r.probability, (map.get(r.probability) ?? 0) + 1)
    )
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredRisks])

  const timeline = useMemo(
    () =>
      buildTimelineFromReport(
        applied.periodFrom,
        applied.periodTo,
        filteredRisks,
        p.analytics.timelineActive,
        p.analytics.timelineClosed,
        monthLabels
      ),
    [
      applied.periodFrom,
      applied.periodTo,
      filteredRisks,
      p.analytics.timelineActive,
      p.analytics.timelineClosed,
      monthLabels
    ]
  )

  const projectsByCategory = useMemo(() => {
    const map = new Map<string, number>()
    filteredProjects.forEach((project) =>
      map.set(project.category, (map.get(project.category) ?? 0) + 1)
    )
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredProjects])

  const projectsByStatusForChart = useMemo(() => {
    const active = filteredProjects.filter((p) => p.status === 'Активен').length
    const closed = filteredProjects.filter((p) => p.status === 'Завершен').length
    return [
      { name: 'Активен', value: active },
      { name: 'Закрыт', value: closed }
    ]
  }, [filteredProjects])

  const projectTimeline = useMemo(
    () =>
      buildProjectTimeline(
        appliedProject.periodFrom,
        appliedProject.periodTo,
        filteredProjects,
        p.analytics.timelineActive,
        p.analytics.timelineClosed,
        monthLabels
      ),
    [
      appliedProject.periodFrom,
      appliedProject.periodTo,
      filteredProjects,
      p.analytics.timelineActive,
      p.analytics.timelineClosed,
      monthLabels
    ]
  )

  const isRiskMode = mode === 'risks'

  const pdfFilterLines = useMemo(() => {
    if (mode === 'risks') return formatRiskPdfFilterLines(p.analytics, applied)
    return formatProjectPdfFilterLines(p.analytics, appliedProject)
  }, [mode, p.analytics, applied, appliedProject])

  const chartEmptyCopy =
    (isRiskMode ? risks.length : myProjects.length) === 0
      ? {
          title: p.analytics.emptyNoRisksTitle,
          hint: p.analytics.emptyNoRisksHint
        }
      : {
          title: p.analytics.emptyFilteredTitle,
          hint: p.analytics.emptyFilteredHint
        }

  const handleResetFilters = () => {
    if (isRiskMode) {
      const next = defaultReportFilters()
      setDraft(next)
      setApplied(next)
      return
    }
    const next = defaultProjectReportFilters()
    setDraftProject(next)
    setAppliedProject(next)
  }

  const handleApplyFilters = () => {
    if (isRiskMode) {
      setApplied({ ...draft })
      return
    }
    setAppliedProject({ ...draftProject })
  }

  const handleExportPdf = async () => {
    const cover = coverPdfRef.current
    if (!cover) {
      toast.error(p.analytics.pdfExportError)
      return
    }
    setIsExportingPdf(true)
    try {
      await new Promise((r) => window.setTimeout(r, 450))
      const order: AnalyticsChartCaptureKey[] =
        mode === 'risks'
          ? [
              'riskByCategory',
              'riskTimeline',
              'riskPieCategory',
              'riskByStatus',
              'riskProbability'
            ]
          : ['projByCategory', 'projTimeline', 'projByStatus']
      const chartEls = order
        .map((k) => chartCaptureRef.current[k])
        .filter((n): n is HTMLDivElement => Boolean(n))
      if (chartEls.length !== order.length) {
        toast.error(p.analytics.pdfExportError)
        return
      }
      const slides = [{ element: cover }, ...chartEls.map((element) => ({ element }))]
      const stamp = new Date().toISOString().slice(0, 10)
      await exportAnalyticsPdfDocument({
        slides,
        fileName: `riskhub-analytics-${stamp}.pdf`
      })
      toast.success(p.analytics.pdfExportSuccess)
    } catch {
      toast.error(p.analytics.pdfExportError)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm text-muted-foreground">{p.lastUpdated} </span>
          <span className="text-sm font-medium text-foreground">
            {formatLocaleDateTime(lastUpdated.toISOString(), locale)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              refresh()
              setLastUpdated(new Date())
            }}
          >
            <RefreshCw className="h-4 w-4" />
            {p.refresh}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={isExportingPdf}
            aria-busy={isExportingPdf}
            onClick={() => void handleExportPdf()}
          >
            <Download className="h-4 w-4" />
            {p.analytics.exportPdfButton}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <CardTitle className="text-base">{p.analytics.filtersTitle}</CardTitle>
          <div className="flex items-center gap-1 rounded-md border border-border p-1">
            <Button
              type="button"
              size="sm"
              variant={isRiskMode ? 'default' : 'ghost'}
              onClick={() => setMode('risks')}
            >
              {p.analytics.modeRisks}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!isRiskMode ? 'default' : 'ghost'}
              onClick={() => setMode('projects')}
            >
              {p.analytics.modeProjects}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
              {p.analytics.periodLabel}
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 sm:max-w-md">
              <Input
                type="date"
                className="calendar-input accent-primary"
                value={isRiskMode ? draft.periodFrom : draftProject.periodFrom}
                onChange={(e) =>
                  isRiskMode
                    ? setDraft((d) => ({ ...d, periodFrom: e.target.value }))
                    : setDraftProject((d) => ({ ...d, periodFrom: e.target.value }))
                }
                aria-label={p.analytics.periodFrom}
              />
              <Input
                type="date"
                className="calendar-input accent-primary"
                value={isRiskMode ? draft.periodTo : draftProject.periodTo}
                onChange={(e) =>
                  isRiskMode
                    ? setDraft((d) => ({ ...d, periodTo: e.target.value }))
                    : setDraftProject((d) => ({ ...d, periodTo: e.target.value }))
                }
                aria-label={p.analytics.periodTo}
              />
            </div>
          </div>

          {isRiskMode ? (
            <>
              <ReportFilterMultiSelect
                label={p.analytics.riskProbability}
                allLabel={p.analytics.all}
                options={LEVELS}
                selected={draft.probability}
                onChange={(probability) => setDraft((d) => ({ ...d, probability }))}
                formatSelected={formatSelected}
              />
              <ReportFilterMultiSelect
                label={p.analytics.riskImpact}
                allLabel={p.analytics.all}
                options={IMPACTS}
                selected={draft.impact}
                onChange={(impact) => setDraft((d) => ({ ...d, impact }))}
                formatSelected={formatSelected}
              />
              <ReportFilterMultiSelect
                label={p.analytics.riskStatus}
                allLabel={p.analytics.all}
                options={RISK_STATUSES}
                selected={draft.status}
                onChange={(status) => setDraft((d) => ({ ...d, status }))}
                formatSelected={formatSelected}
              />
              <ReportFilterSearchableMultiSelect
                label={p.analytics.riskId}
                allLabel={p.analytics.all}
                options={riskCodes}
                selected={draft.riskId}
                onChange={(riskId) => setDraft((d) => ({ ...d, riskId }))}
                searchPlaceholder={p.analytics.searchRiskId}
                formatSelected={formatSelected}
                notFoundLabel={p.analytics.notFound}
                searchAriaPrefix={searchAriaPrefix}
              />
              <ReportFilterSearchableMultiSelect
                label={p.analytics.riskCategory}
                allLabel={p.analytics.allCategories}
                options={RISK_CATEGORIES}
                selected={draft.category}
                onChange={(category) => setDraft((d) => ({ ...d, category }))}
                searchPlaceholder={p.analytics.searchRiskCategory}
                formatSelected={formatSelected}
                notFoundLabel={p.analytics.notFound}
                searchAriaPrefix={searchAriaPrefix}
              />
              <ReportFilterSearchableMultiSelect
                label={p.analytics.project}
                allLabel={p.analytics.allProjects}
                options={projects}
                selected={draft.project}
                onChange={(project) => setDraft((d) => ({ ...d, project }))}
                searchPlaceholder={p.analytics.searchProject}
                formatSelected={formatSelected}
                notFoundLabel={p.analytics.notFound}
                searchAriaPrefix={searchAriaPrefix}
              />
            </>
          ) : (
            <>
              <ReportFilterMultiSelect
                label={p.analytics.projectStatus}
                allLabel={p.analytics.all}
                options={projectStatusFilterOptions}
                selected={draftProject.status}
                onChange={(status) => setDraftProject((d) => ({ ...d, status }))}
                formatSelected={formatSelected}
              />
              <ReportFilterSearchableMultiSelect
                label={p.analytics.projectCategory}
                allLabel={p.analytics.allCategories}
                options={projectCategories}
                selected={draftProject.category}
                onChange={(category) => setDraftProject((d) => ({ ...d, category }))}
                searchPlaceholder={p.analytics.searchProjectCategory}
                formatSelected={formatSelected}
                notFoundLabel={p.analytics.notFound}
                searchAriaPrefix={searchAriaPrefix}
              />
              <ReportFilterSearchableMultiSelect
                label={p.analytics.participants}
                allLabel={p.analytics.all}
                options={participantNameOptions}
                selected={draftProject.participants}
                onChange={(participants) =>
                  setDraftProject((d) => ({ ...d, participants }))
                }
                searchPlaceholder={p.analytics.searchParticipants}
                formatSelected={formatSelected}
                notFoundLabel={p.analytics.notFound}
                searchAriaPrefix={searchAriaPrefix}
              />
              <ReportFilterSearchableMultiSelect
                label={p.analytics.projectId}
                allLabel={p.analytics.all}
                options={projectCodes}
                selected={draftProject.projectId}
                onChange={(projectId) => setDraftProject((d) => ({ ...d, projectId }))}
                searchPlaceholder={p.analytics.searchProjectId}
                formatSelected={formatSelected}
                notFoundLabel={p.analytics.notFound}
                searchAriaPrefix={searchAriaPrefix}
              />
            </>
          )}

          <div className="space-y-2 md:col-span-2 lg:col-span-2">
            <Label>{p.analytics.keywords}</Label>
            <Input
              placeholder={p.analytics.keywordsPlaceholder}
              value={isRiskMode ? draft.keywords : draftProject.keywords}
              onChange={(e) =>
                isRiskMode
                  ? setDraft((d) => ({ ...d, keywords: e.target.value }))
                  : setDraftProject((d) => ({ ...d, keywords: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              {p.analytics.reset}
            </Button>
            <Button type="button" onClick={handleApplyFilters}>
              {p.analytics.apply}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {isRiskMode ? (
          <>
        <div ref={setChartCaptureRef('riskByCategory')}>
        <Card className="min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-base">{p.analytics.chartByCategory}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {filteredRisks.length === 0 ? (
              <ChartEmptyState
                title={chartEmptyCopy.title}
                hint={chartEmptyCopy.hint}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byCategory}
                  margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    height={52}
                  />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                    content={
                      <AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />
                    }
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(217 91% 60%)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={52}
                    isAnimationActive
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    height={28}
                    wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                    formatter={() => p.analytics.chartShareCategory}
                    iconType="square"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        </div>

        <div ref={setChartCaptureRef('riskTimeline')}>
        <Card className="min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-base">{p.analytics.chartTimeline}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {filteredRisks.length === 0 ? (
              <ChartEmptyState
                title={chartEmptyCopy.title}
                hint={chartEmptyCopy.hint}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeline}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={
                      <AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    height={32}
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey={p.analytics.timelineActive}
                    stroke="hsl(217 91% 52%)"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: 'hsl(var(--card))' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey={p.analytics.timelineClosed}
                    stroke="hsl(142 76% 34%)"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: 'hsl(var(--card))' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        </div>

        <div ref={setChartCaptureRef('riskPieCategory')}>
        <Card className="min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-base">{p.analytics.chartPieCategory}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {filteredRisks.length === 0 ? (
              <ChartEmptyState
                title={chartEmptyCopy.title}
                hint={chartEmptyCopy.hint}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 4, bottom: 4, left: 4 }}>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="44%"
                    outerRadius={82}
                    paddingAngle={2}
                    label={false}
                    isAnimationActive
                  >
                    {byCategory.map((_, i) => (
                      <Cell
                        key={`c-${i}`}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    layout="horizontal"
                    align="center"
                    wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        </div>

        <div ref={setChartCaptureRef('riskByStatus')}>
        <Card className="min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-base">{p.analytics.chartByStatus}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {filteredRisks.length === 0 ? (
              <ChartEmptyState
                title={chartEmptyCopy.title}
                hint={chartEmptyCopy.hint}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 4, bottom: 4, left: 4 }}>
                  <Pie
                    data={byStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="44%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                    label={false}
                    isAnimationActive
                  >
                    {byStatus.map((_, i) => (
                      <Cell
                        key={`s-${i}`}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    layout="horizontal"
                    align="center"
                    wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        </div>

            <div ref={setChartCaptureRef('riskProbability')} className="lg:col-span-2">
            <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-base">{p.analytics.chartProbability}</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {filteredRisks.length === 0 ? (
              <ChartEmptyState
                title={chartEmptyCopy.title}
                hint={chartEmptyCopy.hint}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byProbability}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    horizontal={false}
                  />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={92}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
                    content={
                      <AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />
                    }
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                    isAnimationActive
                  >
                    {byProbability.map((row) => (
                      <Cell
                        key={row.name}
                        fill={probabilityBarColor(row.name)}
                      />
                    ))}
                  </Bar>
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    content={() => (
                      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-xs text-muted-foreground">
                        {byProbability.map((row) => (
                          <li key={row.name} className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-7 rounded-sm"
                              style={{
                                backgroundColor: probabilityBarColor(row.name)
                              }}
                              aria-hidden
                            />
                            <span className="text-foreground">{row.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
            </Card>
            </div>
          </>
        ) : (
          <>
            <div ref={setChartCaptureRef('projByCategory')}>
            <Card className="min-h-[340px]">
              <CardHeader>
                <CardTitle className="text-base">
                  {p.analytics.chartProjectByCategory}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {filteredProjects.length === 0 ? (
                  <ChartEmptyState
                    title={chartEmptyCopy.title}
                    hint={chartEmptyCopy.hint}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectsByCategory}
                      margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        height={52}
                      />
                      <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                        content={
                          <AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />
                        }
                      />
                      <Bar
                        dataKey="value"
                        fill="hsl(217 91% 60%)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={52}
                        isAnimationActive
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        height={28}
                        wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                        formatter={() => p.analytics.chartShareProject}
                        iconType="square"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            </div>

            <div ref={setChartCaptureRef('projTimeline')}>
            <Card className="min-h-[340px]">
              <CardHeader>
                <CardTitle className="text-base">
                  {p.analytics.chartProjectTimeline}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {filteredProjects.length === 0 ? (
                  <ChartEmptyState
                    title={chartEmptyCopy.title}
                    hint={chartEmptyCopy.hint}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} />
                      <Tooltip content={<AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />} />
                      <Legend />
                      <Line type="monotone" dataKey={p.analytics.timelineActive} stroke="hsl(217 91% 52%)" strokeWidth={2} />
                      <Line type="monotone" dataKey={p.analytics.timelineClosed} stroke="hsl(142 76% 34%)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            </div>

            <div ref={setChartCaptureRef('projByStatus')}>
            <Card className="min-h-[340px]">
              <CardHeader>
                <CardTitle className="text-base">
                  {p.analytics.chartProjectByStatus}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                {filteredProjects.length === 0 ? (
                  <ChartEmptyState
                    title={chartEmptyCopy.title}
                    hint={chartEmptyCopy.hint}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectsByStatusForChart}
                      layout="vertical"
                      margin={{ top: 8, right: 16, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        horizontal={false}
                      />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={88}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
                        content={
                          <AnalyticsTooltip valueSeriesLabel={p.analytics.tooltipValues} />
                        }
                      />
                      <Bar
                        dataKey="value"
                        fill={PROJECT_STATUS_CHART_BLUE}
                        radius={[0, 4, 4, 0]}
                        maxBarSize={28}
                        isAnimationActive
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        content={() => (
                          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-xs text-muted-foreground">
                            {projectsByStatusForChart.map((row) => (
                              <li key={row.name} className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-7 rounded-sm"
                                  style={{ backgroundColor: PROJECT_STATUS_CHART_BLUE }}
                                  aria-hidden
                                />
                                <span className="text-foreground">{row.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            </div>
          </>
        )}
      </div>

      <div
        ref={coverPdfRef}
        aria-hidden
        className="pointer-events-none fixed left-[-12000px] top-0 z-[-1] box-border w-[794px] max-w-[794px] bg-white p-10 text-left text-slate-900"
        style={{ fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif' }}
      >
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          {p.analytics.pdfBrandLine}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {p.analytics.pdfReportTitle}
        </h1>
        <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {p.analytics.pdfGeneratedLabel}
        </p>
        <p className="mt-1 text-base text-slate-800">
          {formatLocaleDateTime(new Date().toISOString(), locale)}
        </p>
        <h2 className="mt-10 text-xl font-semibold text-slate-900">
          {p.analytics.pdfFiltersHeading}
        </h2>
        <p className="mt-3 text-sm text-slate-800">
          <span className="font-semibold">{p.analytics.pdfModePrefix}:</span>{' '}
          {mode === 'risks' ? p.analytics.modeRisks : p.analytics.modeProjects}
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-800">
          {pdfFilterLines.map((line, i) => (
            <li key={`${i}-${line.slice(0, 48)}`}>{line}</li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
