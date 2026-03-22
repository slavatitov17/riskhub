import Link from 'next/link'
import {
  BarChart3,
  CheckCircle2,
  Eye,
  Filter,
  Flame,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  Zap
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const recentRisks = [
  {
    id: '1',
    title: 'Сбой при обновлении ПО',
    category: 'Технологический',
    date: '12.04.2024',
    level: 'Критический' as const
  },
  {
    id: '2',
    title: 'Потеря данных в CRM',
    category: 'Организационный',
    date: '09.04.2024',
    level: 'Высокий' as const
  },
  {
    id: '3',
    title: 'Замедление сети',
    category: 'Технологический',
    date: '03.04.2024',
    level: 'Средний' as const
  }
]

const notifications = [
  {
    id: 'n1',
    dot: 'bg-red-500',
    text: 'Просрочена мера по риску #104 — обновите документацию',
    meta: 'Просрочено'
  },
  {
    id: 'n2',
    dot: 'bg-amber-500',
    text: 'Срок проверки по риску #101 через 2 дня',
    meta: 'Скоро'
  },
  {
    id: 'n3',
    dot: 'bg-primary',
    text: 'Новый комментарий к риску #99',
    meta: 'Комментарий'
  }
]

const tableRows = [
  {
    id: 'R-001',
    name: 'Сбой сервера',
    category: 'Технологический',
    probability: 'Высокая',
    impact: 'Высокое',
    status: 'Активный',
    project: 'Проект X',
    author: 'Иван',
    created: '10.03.2024',
    updated: '18.03.2024'
  },
  {
    id: 'R-002',
    name: 'Пропуск сроков поставки',
    category: 'Организационный',
    probability: 'Средняя',
    impact: 'Среднее',
    status: 'В работе',
    project: 'Проект Y',
    author: 'Ольга',
    created: '05.03.2024',
    updated: '15.03.2024'
  },
  {
    id: 'R-003',
    name: 'Недостаток финансирования',
    category: 'Финансовый',
    probability: 'Низкая',
    impact: 'Высокое',
    status: 'Активный',
    project: 'Проект Z',
    author: 'Мария',
    created: '01.03.2024',
    updated: '12.03.2024'
  }
]

function levelBadgeVariant(
  level: (typeof recentRisks)[number]['level']
): 'danger' | 'warning' | 'info' {
  if (level === 'Критический') return 'danger'
  if (level === 'Высокий') return 'warning'
  return 'info'
}

function probabilityBadgeClass(value: string) {
  if (value === 'Высокая') return 'border-transparent bg-rose-500/15 text-rose-800'
  if (value === 'Средняя')
    return 'border-transparent bg-amber-500/15 text-amber-900'
  return 'border-transparent bg-emerald-500/15 text-emerald-800'
}

function impactBadgeClass(value: string) {
  if (value === 'Высокое') return 'border-transparent bg-rose-500/15 text-rose-800'
  if (value === 'Среднее')
    return 'border-transparent bg-amber-500/15 text-amber-900'
  return 'border-transparent bg-emerald-500/15 text-emerald-800'
}

function statusBadgeClass(status: string) {
  if (status === 'Активный') return 'border-transparent bg-red-500/15 text-red-800'
  if (status === 'В работе')
    return 'border-transparent bg-amber-500/15 text-amber-900'
  return 'border-transparent bg-slate-500/15 text-slate-800'
}

export default function PanelPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">12</p>
                <p className="text-sm text-muted-foreground">Активных рисков</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">45</p>
                <p className="text-sm text-muted-foreground">Закрытых рисков</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                <Flame className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">4</p>
                <p className="text-sm text-muted-foreground">Критические риски</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="w-full justify-center gap-2" asChild>
              <Link href="/risks/new">
                <Plus className="h-4 w-4" />
                Добавить риск
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-center gap-2" asChild>
              <Link href="/risks">
                <List className="h-4 w-4" />
                Все риски
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-center gap-2" asChild>
              <Link href="/analytics">
                <BarChart3 className="h-4 w-4" />
                Аналитика
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">
              Последние добавленные риски
            </CardTitle>
            <Button variant="link" className="h-auto p-0 text-primary" asChild>
              <Link href="/risks">Все риски &gt;</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-3">
              {recentRisks.map((risk) => (
                <li
                  key={risk.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">{risk.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {risk.category} · {risk.date}
                    </p>
                  </div>
                  <Badge variant={levelBadgeVariant(risk.level)}>{risk.level}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-base font-semibold">Уведомления</CardTitle>
            <Button variant="link" className="h-auto p-0 text-primary">
              Смотреть все
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-3">
              {notifications.map((n) => (
                <li key={n.id} className="flex gap-3 rounded-lg border p-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.dot}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.meta}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Фильтры
            </Button>
            <span className="text-sm text-muted-foreground">
              2 фильтра применено
            </span>
            <Button variant="link" className="h-auto p-0 text-primary">
              Сбросить
            </Button>
          </div>
          <div className="flex w-full max-w-md gap-2 sm:w-auto">
            <Input
              placeholder="Поиск по названию или описанию..."
              className="flex-1"
              aria-label="Поиск по названию или описанию"
            />
            <Button type="button" size="icon" aria-label="Искать">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <h2 className="text-base font-semibold">Список рисков</h2>
            <Button variant="outline" size="sm">
              Массовые действия
            </Button>
          </div>
          <ScrollArea className="h-[min(420px,50vh)] w-full md:h-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <span className="sr-only">Выбор</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      aria-label="Выбрать все"
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Вероятность</TableHead>
                  <TableHead>Воздействие</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Автор</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Обновлён</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        aria-label={`Выбрать ${row.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={probabilityBadgeClass(row.probability)}
                      >
                        {row.probability}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={impactBadgeClass(row.impact)}
                      >
                        {row.impact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(row.status)}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.project}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">
                            {row.author.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{row.author}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.created}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {row.updated}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" aria-label="Просмотр">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Изменить">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" aria-label="Удалить">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
