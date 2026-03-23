'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRisks } from '@/contexts/risks-context'
import { useNotifications } from '@/contexts/notifications-context'
import { formatDisplayDate } from '@/lib/risks-storage'

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
  if (status === 'Закрыт')
    return 'border-transparent bg-emerald-500/15 text-emerald-800'
  return 'border-transparent bg-sky-500/15 text-sky-900'
}

function filterPlural(count: number) {
  if (count === 1) return 'фильтр'
  if (count >= 2 && count <= 4) return 'фильтра'
  return 'фильтров'
}

export function PanelDashboard() {
  const router = useRouter()
  const { risks, removeRisk } = useRisks()
  const { openNotifications } = useNotifications()
  const [filterOpen, setFilterOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState<string[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(risks.map((r) => r.category))),
    [risks]
  )
  const statuses = useMemo(
    () => Array.from(new Set(risks.map((r) => r.status))),
    [risks]
  )

  const filtered = useMemo(() => {
    return risks.filter((r) => {
      if (statusFilter.length && !statusFilter.includes(r.status)) return false
      if (catFilter.length && !catFilter.includes(r.category)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [risks, statusFilter, catFilter, search])

  const activeCount = risks.filter((r) => r.status === 'Активный').length
  const closedCount = risks.filter((r) => r.status === 'Закрыт').length
  const criticalCount = risks.filter(
    (r) => r.impact === 'Высокое' && r.probability === 'Высокая'
  ).length

  const appliedFilters = statusFilter.length + catFilter.length

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) filtered.forEach((r) => (next[r.id] = true))
    setSelected(next)
  }

  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  const handleSearch = () => {
    toast.success(
      search.trim()
        ? `Поиск: «${search.trim()}» — найдено ${filtered.length}`
        : 'Введите текст для поиска'
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto flex max-w-7xl flex-col gap-6"
    >
      <section className="grid gap-4 lg:grid-cols-[1fr_minmax(0,280px)] lg:items-stretch">
        <div className="grid h-full gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="shadow-sm h-full">
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{activeCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Активных рисков
                </p>
              </div>
              <div className="mt-auto flex justify-end">
                <Button
                  variant="link"
                  className="h-auto shrink-0 p-0 text-primary"
                  asChild
                >
                  <Link href="/risks">Смотреть →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm h-full">
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{closedCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Закрытых рисков
                </p>
              </div>
              <div className="mt-auto flex justify-end">
                <Button
                  variant="link"
                  className="h-auto shrink-0 p-0 text-primary"
                  asChild
                >
                  <Link href="/risks">Смотреть →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm h-full sm:col-span-2 xl:col-span-1">
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                <Flame className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{criticalCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Критические риски
                </p>
              </div>
              <div className="mt-auto flex justify-end">
                <Button
                  variant="link"
                  className="h-auto shrink-0 p-0 text-primary"
                  asChild
                >
                  <Link href="/risks">Смотреть →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm lg:sticky lg:top-4 h-full">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-base">Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pb-4 pt-0">
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
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">
              Последние добавленные риски
            </CardTitle>
            <Button variant="link" className="h-auto shrink-0 p-0 text-primary" asChild>
              <Link href="/risks">Все риски →</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-2">
              {risks.slice(0, 3).map((risk) => (
                <li key={risk.id}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
                    onClick={() => router.push(`/risks/${risk.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{risk.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {risk.category} · {formatDisplayDate(risk.created)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {risk.status}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Уведомления</CardTitle>
            <Button
              variant="link"
              className="h-auto shrink-0 p-0 text-primary"
              type="button"
              onClick={openNotifications}
            >
              Все уведомления →
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-2">
              {[
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
              ].map((n) => (
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

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setFilterOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Фильтры
              </Button>
              {appliedFilters > 0 && (
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  {appliedFilters} {filterPlural(appliedFilters)}
                </span>
              )}
              {appliedFilters > 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto whitespace-nowrap p-0 text-primary"
                  onClick={() => {
                    setStatusFilter([])
                    setCatFilter([])
                    toast.message('Фильтры сброшены')
                  }}
                >
                  Сбросить
                </Button>
              )}
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl lg:flex-1">
              <Input
                placeholder="Поиск по названию или описанию..."
                className="min-w-0 flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                aria-label="Поиск по названию или описанию"
              />
              <Button
                type="button"
                className="shrink-0 sm:size-10"
                aria-label="Искать"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4 sm:mx-auto" />
                <span className="ml-2 sm:hidden">Найти</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-2 border-b px-4 pb-3 pt-2 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <h2 className="text-base font-semibold">Список рисков</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkOpen(true)}
            >
              Массовые действия
            </Button>
          </div>

          <div className="risk-table-scroll w-full overflow-x-auto overflow-y-hidden">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          filtered.length > 0 &&
                          filtered.every((r) => selected[r.id])
                        }
                        onCheckedChange={(v) => toggleAll(!!v)}
                        aria-label="Выбрать все"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="min-w-[200px] whitespace-nowrap">
                    Название
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Категория</TableHead>
                  <TableHead className="whitespace-nowrap">Вероятность</TableHead>
                  <TableHead className="whitespace-nowrap">Воздействие</TableHead>
                  <TableHead className="whitespace-nowrap">Статус</TableHead>
                  <TableHead className="whitespace-nowrap">Проект</TableHead>
                  <TableHead className="whitespace-nowrap">Автор</TableHead>
                  <TableHead className="whitespace-nowrap">Создан</TableHead>
                  <TableHead className="whitespace-nowrap">Обновлён</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Действия
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      <Checkbox
                        checked={!!selected[row.id]}
                        onCheckedChange={(v) =>
                          setSelected((s) => ({ ...s, [row.id]: !!v }))
                        }
                        aria-label={`Выбрать ${row.code}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {row.code}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{row.category}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={probabilityBadgeClass(row.probability)}
                      >
                        {row.probability}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={impactBadgeClass(row.impact)}
                      >
                        {row.impact}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={statusBadgeClass(row.status)}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{row.project}</TableCell>
                    <TableCell className="whitespace-nowrap">
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
                      {formatDisplayDate(row.created)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDisplayDate(row.updated)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Просмотр"
                          type="button"
                          onClick={() => router.push(`/risks/${row.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Изменить"
                          type="button"
                          onClick={() => router.push(`/risks/${row.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Удалить"
                          type="button"
                          onClick={() => setDeleteId(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Фильтры</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Статус</p>
              <div className="flex flex-col gap-2">
                {statuses.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={statusFilter.includes(s)}
                      onCheckedChange={(v) => {
                        setStatusFilter((prev) =>
                          v
                            ? [...prev, s]
                            : prev.filter((x) => x !== s)
                        )
                      }}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Категория</p>
              <div className="flex flex-col gap-2">
                {categories.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={catFilter.includes(c)}
                      onCheckedChange={(v) => {
                        setCatFilter((prev) =>
                          v ? [...prev, c] : prev.filter((x) => x !== c)
                        )
                      }}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setFilterOpen(false)}>
              Закрыть
            </Button>
            <Button
              type="button"
              onClick={() => {
                setFilterOpen(false)
                toast.success('Фильтры применены')
              }}
            >
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Массовые действия</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Выбрано записей: {selectedIds.length}. Демо: можно отметить как
            закрытые или удалить.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setBulkOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setBulkOpen(false)
                toast.success('Выбранные риски отмечены как закрытые (демо)')
              }}
            >
              Закрыть выбранные
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setBulkOpen(false)
                toast.message('Удаление нескольких записей отключено в демо')
              }}
            >
              Удалить выбранные
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить риск?</AlertDialogTitle>
            <AlertDialogDescription>
              Действие необратимо в рамках локального хранилища браузера.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  removeRisk(deleteId)
                  toast.success('Риск удалён')
                }
                setDeleteId(null)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
