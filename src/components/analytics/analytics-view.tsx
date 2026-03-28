'use client'

import { useMemo, useState } from 'react'
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
  YAxis
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
import { useRisks } from '@/contexts/risks-context'
import type { RiskRecord } from '@/lib/risk-types'
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

function matchesReportFilters(r: RiskRecord, f: ReportFilters) {
  if (f.periodFrom && r.created < f.periodFrom) return false
  if (f.periodTo && r.created > f.periodTo) return false
  if (f.probability.length && !f.probability.includes(r.probability))
    return false
  if (f.impact.length && !f.impact.includes(r.impact)) return false
  if (f.status.length && !f.status.includes(r.status)) return false
  if (f.riskId.length && !f.riskId.includes(r.code)) return false
  if (f.category.length && !f.category.includes(r.category)) return false
  if (f.project.length && !f.project.includes(r.project)) return false
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
  const { risks, refresh } = useRisks()
  const [period, setPeriod] = useState('month')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [draft, setDraft] = useState<ReportFilters>(() => defaultReportFilters())
  const [applied, setApplied] = useState<ReportFilters>(() => defaultReportFilters())

  const riskCodes = useMemo(
    () => Array.from(new Set(risks.map((r) => r.code))).sort(),
    [risks]
  )
  const projects = useMemo(
    () => Array.from(new Set(risks.map((r) => r.project))).sort(),
    [risks]
  )

  const filteredRisks = useMemo(
    () => risks.filter((r) => matchesReportFilters(r, applied)),
    [risks, applied]
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

          <ReportFilterMultiSelect
            label="ID"
            allLabel="Все"
            options={riskCodes}
            selected={draft.riskId}
            onChange={(riskId) => setDraft((d) => ({ ...d, riskId }))}
          />

          <ReportFilterMultiSelect
            label="Категория риска"
            allLabel="Все категории"
            options={RISK_CATEGORIES}
            selected={draft.category}
            onChange={(category) => setDraft((d) => ({ ...d, category }))}
          />

          <ReportFilterMultiSelect
            label="Проект"
            allLabel="Все проекты"
            options={projects}
            selected={draft.project}
            onChange={(project) => setDraft((d) => ({ ...d, project }))}
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
        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-base">Количество рисков по категориям</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[320px]">
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
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Активные"
                  stroke="hsl(217 91% 60%)"
                  strokeWidth={2}
                  dot
                />
                <Line
                  type="monotone"
                  dataKey="Закрытые"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-base">Доля рисков по категориям</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {byCategory.map((_, i) => (
                    <Cell
                      key={`c-${i}`}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-base">Распределение по статусам</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {byStatus.map((_, i) => (
                    <Cell
                      key={`s-${i}`}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[300px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Вероятность рисков (столбчатая)</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProbability} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={88} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(199 89% 48%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
