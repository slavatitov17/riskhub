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
import { toast } from 'sonner'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import { useVisibleRisks } from '@/hooks/use-visible-risks'
import type { RiskRecord } from '@/lib/risk-types'
import { riskDateKey } from '@/lib/risks-storage'
import {
  IMPACTS,
  LEVELS,
  RISK_CATEGORIES,
  RISK_STATUSES
} from '@/lib/risk-types'

const MONTH_LABELS = [
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
]

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
  label
}: TooltipProps<number, string>) {
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
          const nameStr = isValueSeries ? 'значений' : String(rawName ?? '')
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

function defaultReportFilters(): ReportFilters {
  return {
    periodFrom: '',
    periodTo: '',
    probability: [],
    impact: [],
    status: [],
    riskId: [],
    category: [],
    project: [],
    keywords: ''
  }
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

function ReportFilterMultiSelect({
  label,
  allLabel,
  options,
  selected,
  onChange
}: {
  label: string
  allLabel: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const isAll = selected.length === 0
  const summary = isAll ? allLabel : `Выбрано: ${selected.length}`

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
  searchPlaceholder
}: {
  label: string
  allLabel: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  searchPlaceholder: string
}) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const isAll = selected.length === 0
  const summary = isAll ? allLabel : `Выбрано: ${selected.length}`
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
              aria-label={`Поиск: ${label}`}
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
                Не найдено
              </p>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function last6MonthBuckets() {
  const out: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ key, label: MONTH_LABELS[d.getMonth()] ?? '' })
  }
  return out
}

function formatRuDateTime(d: Date) {
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function AnalyticsView() {
  const { refresh } = useRisks()
  const risks = useVisibleRisks()
  const { getProjectDisplayName } = useProjects()
  const [period, setPeriod] = useState('month')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [draft, setDraft] = useState<ReportFilters>(() => defaultReportFilters())
  const [applied, setApplied] = useState<ReportFilters>(() => defaultReportFilters())

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

  const timeline = useMemo(() => {
    const buckets = last6MonthBuckets()
    return buckets.map(({ key, label }) => {
      const inMonth = filteredRisks.filter((r) => r.created.slice(0, 7) === key)
      return {
        month: label,
        Активные: inMonth.filter((r) => r.status !== 'Закрыт').length,
        Закрытые: inMonth.filter((r) => r.status === 'Закрыт').length
      }
    })
  }, [filteredRisks])

  const handleResetFilters = () => {
    const next = defaultReportFilters()
    setDraft(next)
    setApplied(next)
  }

  const handleApplyFilters = () => {
    setApplied({ ...draft })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm text-muted-foreground">Последнее обновление: </span>
          <span className="text-sm font-medium text-foreground">
            {formatRuDateTime(lastUpdated)}
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
            Обновить
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => toast.success('Выгрузка в Excel (демо)')}
          >
            <Download className="h-4 w-4" />
            Выгрузить в Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => toast.success('Выгрузка в PDF (демо)')}
          >
            <Download className="h-4 w-4" />
            Выгрузить в PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фильтры отчёта</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
              Период (дата создания)
            </Label>
            <div className="grid gap-2 sm:grid-cols-2 sm:max-w-md">
              <Input
                type="date"
                className="calendar-input accent-primary"
                value={draft.periodFrom}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, periodFrom: e.target.value }))
                }
                aria-label="Период с"
              />
              <Input
                type="date"
                className="calendar-input accent-primary"
                value={draft.periodTo}
                onChange={(e) => setDraft((d) => ({ ...d, periodTo: e.target.value }))}
                aria-label="Период по"
              />
            </div>
          </div>

          <ReportFilterMultiSelect
            label="Вероятность риска"
            allLabel="Все"
            options={LEVELS}
            selected={draft.probability}
            onChange={(probability) => setDraft((d) => ({ ...d, probability }))}
          />

          <ReportFilterMultiSelect
            label="Воздействие риска"
            allLabel="Все"
            options={IMPACTS}
            selected={draft.impact}
            onChange={(impact) => setDraft((d) => ({ ...d, impact }))}
          />

          <ReportFilterMultiSelect
            label="Статус риска"
            allLabel="Все"
            options={RISK_STATUSES}
            selected={draft.status}
            onChange={(status) => setDraft((d) => ({ ...d, status }))}
          />

          <ReportFilterSearchableMultiSelect
            label="ID"
            allLabel="Все"
            options={riskCodes}
            selected={draft.riskId}
            onChange={(riskId) => setDraft((d) => ({ ...d, riskId }))}
            searchPlaceholder="Поиск по ID…"
          />

          <ReportFilterMultiSelect
            label="Категория риска"
            allLabel="Все категории"
            options={RISK_CATEGORIES}
            selected={draft.category}
            onChange={(category) => setDraft((d) => ({ ...d, category }))}
          />

          <ReportFilterSearchableMultiSelect
            label="Проект"
            allLabel="Все проекты"
            options={projects}
            selected={draft.project}
            onChange={(project) => setDraft((d) => ({ ...d, project }))}
            searchPlaceholder="Поиск по проекту…"
          />

          <div className="space-y-2 md:col-span-2 lg:col-span-2">
            <Label>Ключевые слова</Label>
            <Input
              placeholder="Поиск по названию или описанию..."
              value={draft.keywords}
              onChange={(e) =>
                setDraft((d) => ({ ...d, keywords: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              Сбросить
            </Button>
            <Button type="button" onClick={handleApplyFilters}>
              Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-base">Количество рисков по категориям</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
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
                  content={<AnalyticsTooltip />}
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
                  formatter={() => 'Количество рисков'}
                  iconType="square"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[340px]">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Динамика рисков по времени</CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  height={32}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="Активные"
                  stroke="hsl(217 91% 52%)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1, fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                />
                <Line
                  type="monotone"
                  dataKey="Закрытые"
                  stroke="hsl(142 76% 34%)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1, fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-base">Доля рисков по категориям</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  layout="horizontal"
                  align="center"
                  wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[340px]">
          <CardHeader>
            <CardTitle className="text-base">Распределение по статусам</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
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
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  layout="horizontal"
                  align="center"
                  wrapperStyle={{ fontSize: 12, paddingTop: 4 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[320px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Вероятность рисков (столбчатая)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
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
                  content={<AnalyticsTooltip />}
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
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
