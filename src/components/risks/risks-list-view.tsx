'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2
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
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useRisks } from '@/contexts/risks-context'
import { formatDisplayDate } from '@/lib/risks-storage'

const PAGE_SIZE = 5

function statusClass(status: string) {
  if (status === 'Активный') return 'bg-red-500/15 text-red-800'
  if (status === 'В работе') return 'bg-amber-500/15 text-amber-900'
  if (status === 'Закрыт') return 'bg-emerald-500/15 text-emerald-800'
  return 'bg-sky-500/15 text-sky-900'
}

export function RisksListView() {
  const router = useRouter()
  const { risks, refresh, removeRisk } = useRisks()
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [statuses, setStatuses] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(risks.map((r) => r.status))),
    [risks]
  )

  const filtered = useMemo(() => {
    return risks.filter((r) => {
      if (statuses.length && !statuses.includes(r.status)) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.code.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [risks, search, statuses])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const slice = filtered.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE
  )

  const toggleStatus = (s: string, on: boolean) => {
    setStatuses((prev) =>
      on ? (prev.includes(s) ? prev : [...prev, s]) : prev.filter((x) => x !== s)
    )
  }

  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  const handleBulkResolved = () => {
    toast.success('Выбранные риски отмечены как закрытые (демо)')
    setSelected({})
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Список рисков
          </h1>
          <p className="text-sm text-muted-foreground">
            Всего в реестре:{' '}
            <Badge variant="secondary" className="align-middle">
              {risks.length}
            </Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              refresh()
              toast.success('Данные обновлены')
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/risks/new">
              <Plus className="h-4 w-4" />
              Новый риск
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-2">
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
              {statuses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => {
                  setStatuses([])
                  setPage(1)
                  toast.message('Фильтры сброшены')
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <Input
                className="min-w-0 flex-1"
                placeholder="Поиск по названию или описанию..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  toast.success(`Найдено: ${filtered.length}`)
                }
              />
              <Button
                type="button"
                className="shrink-0 sm:w-10"
                aria-label="Поиск"
                onClick={() => toast.success(`Найдено: ${filtered.length}`)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={
                    slice.length > 0 && slice.every((r) => selected[r.id])
                  }
                  onCheckedChange={(v) => {
                    const on = !!v
                    const next = { ...selected }
                    slice.forEach((r) => {
                      if (on) next[r.id] = true
                      else delete next[r.id]
                    })
                    setSelected(next)
                  }}
                />
                Выбрать на странице
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                disabled={!selectedIds.length}
                onClick={handleBulkResolved}
              >
                <Check className="h-4 w-4" />
                Отметить как решённые
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={!selectedIds.length}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Удалить выбранные
              </Button>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-md border">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 whitespace-nowrap" />
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="min-w-[220px] whitespace-nowrap">
                    Название
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Категория</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Вероятн. / Воздействие
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Статус</TableHead>
                  <TableHead className="whitespace-nowrap">Проект</TableHead>
                  <TableHead className="whitespace-nowrap">Автор</TableHead>
                  <TableHead className="whitespace-nowrap">Создан</TableHead>
                  <TableHead className="whitespace-nowrap">Обновлён</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/risks/${r.id}`)}
                  >
                    <TableCell
                      className="whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={!!selected[r.id]}
                        onCheckedChange={(v) =>
                          setSelected((s) => ({ ...s, [r.id]: !!v }))
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {r.code}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {r.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{r.category}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {r.probability} / {r.impact}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.project}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.author}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDisplayDate(r.created)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDisplayDate(r.updated)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Показано {(pageSafe - 1) * PAGE_SIZE + 1}-
              {Math.min(pageSafe * PAGE_SIZE, filtered.length)} из {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Предыдущая страница"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={p === pageSafe ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 min-w-8 px-2"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Следующая страница"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Фильтр по статусу</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {uniqueStatuses.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={statuses.includes(s)}
                  onCheckedChange={(v) => toggleStatus(s, !!v)}
                />
                {s}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setFilterOpen(false)}>
              Готово
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено записей: {selectedIds.length}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                selectedIds.forEach((id) => removeRisk(id))
                setSelected({})
                setBulkDeleteOpen(false)
                toast.success('Удалено')
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
