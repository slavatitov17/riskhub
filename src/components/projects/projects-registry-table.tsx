'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Eye, Filter, Pencil, Search, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
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
import { useProjects } from '@/contexts/projects-context'
import { PROJECT_STATUSES, type ProjectRecord } from '@/lib/project-types'
import {
  projectStatusBadgeClass,
  riskTableChipBase
} from '@/lib/risk-badge-styles'
import { formatDisplayDate } from '@/lib/risks-storage'
import { cn } from '@/lib/utils'

function filterPlural(count: number) {
  if (count === 1) return 'фильтр'
  if (count >= 2 && count <= 4) return 'фильтра'
  return 'фильтров'
}

function projectDisplayCode(p: ProjectRecord) {
  return p.code && /^P-\d{3}$/.test(p.code) ? p.code : p.id
}

export function ProjectsRegistryTable() {
  const router = useRouter()
  const {
    myProjects,
    ready,
    memberCount,
    updateProject,
    deleteProject,
    refresh
  } = useProjects()
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<'close' | 'delete' | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let alive = true
    ;(async () => {
      const next: Record<string, number> = {}
      for (const p of myProjects) {
        next[p.id] = await memberCount(p.id)
      }
      if (alive) setCounts(next)
    })()
    return () => {
      alive = false
    }
  }, [myProjects, memberCount])

  const filtered = useMemo(() => {
    return myProjects.filter((p) => {
      if (statusFilter.length && !statusFilter.includes(p.status)) return false
      if (createdFrom && p.createdAt < createdFrom) return false
      if (createdTo && p.createdAt > createdTo) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const desc = (p.description ?? '').toLowerCase()
        if (
          !p.name.toLowerCase().includes(q) &&
          !desc.includes(q) &&
          !projectDisplayCode(p).toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [myProjects, statusFilter, createdFrom, createdTo, search])

  const appliedFilters =
    statusFilter.length + (createdFrom ? 1 : 0) + (createdTo ? 1 : 0)

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) filtered.forEach((p) => (next[p.id] = true))
    setSelected(next)
  }

  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  const handleBulkConfirm = async () => {
    if (!bulkAction || !selectedIds.length) return

    if (bulkAction === 'close') {
      let ok = 0
      let fail = 0
      for (const id of selectedIds) {
        const r = await updateProject(id, { status: 'Завершен' })
        if (r.ok) ok += 1
        else fail += 1
      }
      if (ok) toast.success(`Завершено проектов: ${ok}`)
      if (fail)
        toast.message(
          `Не удалось завершить ${fail} (демо-проект или нет прав владельца)`
        )
    }

    if (bulkAction === 'delete') {
      let ok = 0
      let fail = 0
      for (const id of selectedIds) {
        const r = await deleteProject(id)
        if (r.ok) ok += 1
        else fail += 1
      }
      if (ok) toast.success(`Удалено проектов: ${ok}`)
      if (fail)
        toast.message(
          `Не удалось удалить ${fail} (демо-проект или нет прав владельца)`
        )
    }

    setSelected({})
    setBulkAction(null)
    await refresh()
  }

  const handleSearch = () => {
    toast.success(
      search.trim()
        ? `Поиск: «${search.trim()}» — найдено ${filtered.length}`
        : 'Введите текст для поиска'
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b pb-4">
          <CardTitle className="text-base font-semibold">Проекты</CardTitle>
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
                    setCreatedFrom('')
                    setCreatedTo('')
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
          <div className="flex flex-col gap-2 border-b px-4 pb-3 pt-2 sm:flex-row sm:items-center md:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                disabled={!selectedIds.length}
                onClick={() => setBulkAction('close')}
              >
                <Check className="h-4 w-4" />
                Закрыть выбранные
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                disabled={!selectedIds.length}
                onClick={() => setBulkAction('delete')}
              >
                <Trash2 className="h-4 w-4" />
                Удалить выбранные
              </Button>
            </div>
          </div>

          <div className="risk-table-scroll w-full overflow-x-auto overflow-y-hidden">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          filtered.length > 0 &&
                          filtered.every((p) => selected[p.id])
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
                  <TableHead className="whitespace-nowrap">Создан</TableHead>
                  <TableHead className="whitespace-nowrap">Статус</TableHead>
                  <TableHead className="whitespace-nowrap">Участники</TableHead>
                  <TableHead className="whitespace-nowrap text-left">
                    Действия
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!ready ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground"
                    >
                      Загрузка…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground"
                    >
                      {myProjects.length === 0
                        ? 'Нет проектов. Создайте первый проект, чтобы вести риски в его рамках.'
                        : 'Нет проектов по текущим фильтрам.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      tabIndex={0}
                      onClick={() => router.push(`/projects/${row.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(`/projects/${row.id}`)
                        }
                      }}
                    >
                      <TableCell
                        className="whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={!!selected[row.id]}
                          onCheckedChange={(v) =>
                            setSelected((s) => ({ ...s, [row.id]: !!v }))
                          }
                          aria-label={`Выбрать ${projectDisplayCode(row)}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {projectDisplayCode(row)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {row.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDisplayDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={cn(
                            riskTableChipBase,
                            projectStatusBadgeClass(row.status)
                          )}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {counts[row.id] ?? '—'}
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-start gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            title="Показать"
                            aria-label="Показать"
                            onClick={() => router.push(`/projects/${row.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            title="Изменить"
                            aria-label="Изменить"
                            onClick={() =>
                              router.push(`/projects/${row.id}/edit`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            title="Удалить"
                            aria-label="Удалить"
                            onClick={() => setDeleteId(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {ready && (
            <div className="px-4 py-4 text-sm md:px-6">
              <span className="text-muted-foreground">Всего записей: </span>
              <span className="text-foreground">{filtered.length}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="risk-filter-scroll max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Фильтры</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Статус</p>
              <div className="flex flex-col gap-2">
                {PROJECT_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={statusFilter.includes(s)}
                      onCheckedChange={(v) => {
                        setStatusFilter((prev) =>
                          v ? [...prev, s] : prev.filter((x) => x !== s)
                        )
                      }}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Создан</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label="Создан с"
                />
                <Input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label="Создан по"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setFilterOpen(false)
                toast.success('Фильтры применены')
              }}
            >
              Применить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'close'
                ? 'Закрыть выбранные проекты?'
                : 'Удалить выбранные проекты?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Выбрано записей: {selectedIds.length}. Подтвердите выполнение
              действия. Демо-проекты и проекты без прав владельца будут пропущены
              при массовом действии.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className={
                bulkAction === 'delete'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
              onClick={() => void handleBulkConfirm()}
            >
              {bulkAction === 'delete' ? 'Удалить' : 'Подтвердить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Проект, участники и приглашения будут удалены из локального
              хранилища. Риски, привязанные к проекту, останутся в реестре.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteId) return
                const r = await deleteProject(deleteId)
                if (!r.ok) {
                  toast.error(r.error)
                  setDeleteId(null)
                  return
                }
                toast.success('Проект удалён')
                setDeleteId(null)
                await refresh()
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
