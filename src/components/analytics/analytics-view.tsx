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
import { CalendarDays, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const ALL = '__all__'

export type ReportFilters = {
  periodFrom: string
  periodTo: string
  probability: string
  impact: string
  status: string
  riskId: string
  category: string
  project: string
  keywords: string
}

function defaultReportFilters(): ReportFilters {
  return {
    periodFrom: '',
    periodTo: '',
    probability: ALL,
    impact: ALL,
    status: ALL,
    riskId: ALL,
    category: ALL,
    project: ALL,
    keywords: ''
  }
}

function matchesReportFilters(r: RiskRecord, f: ReportFilters) {
  if (f.periodFrom && r.created < f.periodFrom) return false
  if (f.periodTo && r.created > f.periodTo) return false
  if (f.probability !== ALL && r.probability !== f.probability) return false
  if (f.impact !== ALL && r.impact !== f.impact) return false
  if (f.status !== ALL && r.status !== f.status) return false
  if (f.riskId !== ALL && r.code !== f.riskId) return false
  if (f.category !== ALL && r.category !== f.category) return false
  if (f.project !== ALL && r.project !== f.project) return false
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

          <div className="space-y-2">
            <Label>Вероятность риска</Label>
            <Select
              value={draft.probability}
              onValueChange={(v) => setDraft((d) => ({ ...d, probability: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {LEVELS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Воздействие риска</Label>
            <Select
              value={draft.impact}
              onValueChange={(v) => setDraft((d) => ({ ...d, impact: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {IMPACTS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Статус риска</Label>
            <Select
              value={draft.status}
              onValueChange={(v) => setDraft((d) => ({ ...d, status: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {RISK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ID</Label>
            <Select
              value={draft.riskId}
              onValueChange={(v) => setDraft((d) => ({ ...d, riskId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все идентификаторы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все</SelectItem>
                {riskCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Категория риска</Label>
            <Select
              value={draft.category}
              onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все категории</SelectItem>
                {RISK_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Проект</Label>
            <Select
              value={draft.project}
              onValueChange={(v) => setDraft((d) => ({ ...d, project: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все проекты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Все проекты</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
