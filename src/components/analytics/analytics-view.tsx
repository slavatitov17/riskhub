'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
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

const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн']

export function AnalyticsView() {
  const { risks } = useRisks()
  const [period, setPeriod] = useState('month')

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    risks.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + 1))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [risks])

  const timeline = useMemo(
    () =>
      months.map((m, i) => ({
        month: m,
        Активные: 8 + (i % 4) + Math.floor(risks.length / 10),
        Закрытые: 4 + (i % 3)
      })),
    [risks.length]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-6"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Аналитика и отчёты
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Визуализация и анализ рисков по проектам, категориям и статусам
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => toast.success('Экспорт в Excel (демо)')}
          >
            Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success('Экспорт в PDF (демо)')}
          >
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фильтры отчёта</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Статус</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="closed">Закрытые</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Проект</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Все проекты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все проекты</SelectItem>
                <SelectItem value="x">Проект X</SelectItem>
                <SelectItem value="y">Проект Y</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="tech">Технологический</SelectItem>
                <SelectItem value="org">Организационный</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ключевые слова</Label>
            <Input
              placeholder="Поиск..."
              onKeyDown={(e) =>
                e.key === 'Enter' && toast.message('Фильтр по ключевым словам')
              }
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.success('Фильтры сброшены')}
            >
              Сбросить
            </Button>
            <Button
              type="button"
              onClick={() => toast.success('Отчёт обновлён')}
            >
              Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-base">
              Количество рисков по категориям
            </CardTitle>
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
      </div>
    </motion.div>
  )
}
