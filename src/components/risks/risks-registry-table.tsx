'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Eye, Filter, Pencil, Search, Trash2 } from 'lucide-react'
import { toast } from '@/lib/app-toast'

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { useRisks } from '@/contexts/risks-context'
import { useVisibleRisks } from '@/hooks/use-visible-risks'
import {
  impactBadgeClass,
  probabilityBadgeClass,
  riskTableChipBase,
  statusBadgeClass
} from '@/lib/risk-badge-styles'
import { formatDisplayDate } from '@/lib/risks-storage'
import { cn } from '@/lib/utils'

function filterPlural(count: number) {
  if (count === 1) return 'фильтр'
  if (count >= 2 && count <= 4) return 'фильтра'
  return 'фильтров'
}

export function RisksRegistryTable() {
  const router = useRouter()
  const { removeRisk, updateRisk } = useRisks()
  const risks = useVisibleRisks()
  const { getProjectDisplayName, ready: projectsReady } = useProjects()
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [catFilter, setCatFilter] = useState<string[]>([])
  const [probabilityFilter, setProbabilityFilter] = useState<string[]>([])
  const [impactFilter, setImpactFilter] = useState<string[]>([])
  const [projectFilter, setProjectFilter] = useState<string[]>([])
  const [authorFilter, setAuthorFilter] = useState<string[]>([])
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [updatedFrom, setUpdatedFrom] = useState('')
  const [updatedTo, setUpdatedTo] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<'close' | 'delete' | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(risks.map((r) => r.category))),
    [risks]
  )
  const statuses = useMemo(
    () => Array.from(new Set(risks.map((r) => r.status))),
    [risks]
  )
  const probabilities = useMemo(
    () => Array.from(new Set(risks.map((r) => r.probability))),
    [risks]
  )
  const impacts = useMemo(
    () => Array.from(new Set(risks.map((r) => r.impact))),
    [risks]
  )
  const projects = useMemo(
    () =>
      Array.from(
        new Set(
          risks.map((r) => getProjectDisplayName(r.projectId, r.project))
        )
      ),
    [risks, getProjectDisplayName]
  )
  const authors = useMemo(
    () => Array.from(new Set(risks.map((r) => r.author))),
    [risks]
  )

  const filtered = useMemo(() => {
    return risks.filter((r) => {
      if (statusFilter.length && !statusFilter.includes(r.status)) return false
      if (catFilter.length && !catFilter.includes(r.category)) return false
      if (probabilityFilter.length && !probabilityFilter.includes(r.probability))
        return false
      if (impactFilter.length && !impactFilter.includes(r.impact)) return false
      if (
        projectFilter.length &&
        !projectFilter.includes(getProjectDisplayName(r.projectId, r.project))
      )
        return false
      if (authorFilter.length && !authorFilter.includes(r.author))
        return false
      if (createdFrom && r.created < createdFrom) return false
      if (createdTo && r.created > createdTo) return false
      if (updatedFrom && r.updated < updatedFrom) return false
      if (updatedTo && r.updated > updatedTo) return false
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
  }, [
    risks,
    statusFilter,
    catFilter,
    probabilityFilter,
    impactFilter,
    projectFilter,
    getProjectDisplayName,
    authorFilter,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    search
  ])

  const appliedFilters =
    statusFilter.length +
    catFilter.length +
    probabilityFilter.length +
    impactFilter.length +
    projectFilter.length +
    authorFilter.length +
    (createdFrom ? 1 : 0) +
    (createdTo ? 1 : 0) +
    (updatedFrom ? 1 : 0) +
    (updatedTo ? 1 : 0)

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) filtered.forEach((r) => (next[r.id] = true))
    setSelected(next)
  }

  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  const handleBulkConfirm = () => {
    if (!bulkAction || !selectedIds.length) return

    if (bulkAction === 'close') {
      selectedIds.forEach((id) => updateRisk(id, { status: 'Закрыт' }))
      toast.success('Выбранные риски закрыты')
    }

    if (bulkAction === 'delete') {
      selectedIds.forEach((id) => removeRisk(id))
      toast.success('Выбранные риски удалены')
    }

    setSelected({})
    setBulkAction(null)
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
          <CardTitle className="text-base font-semibold">Риски</CardTitle>
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
                    setProbabilityFilter([])
                    setImpactFilter([])
                    setProjectFilter([])
                    setAuthorFilter([])
                    setCreatedFrom('')
                    setCreatedTo('')
                    setUpdatedFrom('')
                    setUpdatedTo('')
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
                  <TableHead className="whitespace-nowrap text-left">
                    Действия
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!projectsReady ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-muted-foreground">
                      Загрузка…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-muted-foreground">
                      {risks.length === 0
                        ? 'Нет рисков. Создайте первый риск, чтобы начать работу над ним'
                        : 'Нет рисков по текущим фильтрам.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    tabIndex={0}
                    onClick={() => router.push(`/risks/${row.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        router.push(`/risks/${row.id}`)
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
                        aria-label={`Выбрать ${row.code}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.code}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{row.category}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={cn(
                          riskTableChipBase,
                          probabilityBadgeClass(row.probability)
                        )}
                      >
                        {row.probability}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={cn(
                          riskTableChipBase,
                          impactBadgeClass(row.impact)
                        )}
                      >
                        {row.impact}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={cn(
                          riskTableChipBase,
                          statusBadgeClass(row.status)
                        )}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getProjectDisplayName(row.projectId, row.project)}
                    </TableCell>
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
                          onClick={() => router.push(`/risks/${row.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          title="Изменить"
                          aria-label="Изменить"
                          onClick={() => router.push(`/risks/${row.id}/edit`)}
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
          <div className="px-4 py-4 text-sm md:px-6">
            <span className="text-muted-foreground">Всего записей: </span>
            <span className="text-foreground">{filtered.length}</span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="risk-filter-scroll max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Фильтры</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div>
              <p className="mb-2 text-sm font-medium">Вероятность</p>
              <div className="flex flex-col gap-2">
                {probabilities.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={probabilityFilter.includes(p)}
                      onCheckedChange={(v) => {
                        setProbabilityFilter((prev) =>
                          v ? [...prev, p] : prev.filter((x) => x !== p)
                        )
                      }}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Воздействие</p>
              <div className="flex flex-col gap-2">
                {impacts.map((i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={impactFilter.includes(i)}
                      onCheckedChange={(v) => {
                        setImpactFilter((prev) =>
                          v ? [...prev, i] : prev.filter((x) => x !== i)
                        )
                      }}
                    />
                    {i}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Статус</p>
              <div className="flex flex-col gap-2">
                {statuses.map((s) => (
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
              <p className="mb-2 text-sm font-medium">Проект</p>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={projectFilter.length === 0}
                    onCheckedChange={(v) => {
                      if (v) setProjectFilter([])
                    }}
                  />
                  Все проекты
                </label>
                {projects.map((project) => (
                  <label
                    key={project}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={
                        projectFilter.length > 0 && projectFilter.includes(project)
                      }
                      onCheckedChange={(v) => {
                        if (v) {
                          setProjectFilter((prev) =>
                            prev.length === 0
                              ? [project]
                              : Array.from(new Set([...prev, project]))
                          )
                        } else {
                          setProjectFilter((prev) => prev.filter((x) => x !== project))
                        }
                      }}
                    />
                    {project}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Автор</p>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={authorFilter.length === 0}
                    onCheckedChange={(v) => {
                      if (v) setAuthorFilter([])
                    }}
                  />
                  Все авторы
                </label>
                {authors.map((author) => (
                  <label
                    key={author}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={
                        authorFilter.length > 0 && authorFilter.includes(author)
                      }
                      onCheckedChange={(v) => {
                        if (v) {
                          setAuthorFilter((prev) =>
                            prev.length === 0
                              ? [author]
                              : Array.from(new Set([...prev, author]))
                          )
                        } else {
                          setAuthorFilter((prev) => prev.filter((x) => x !== author))
                        }
                      }}
                    />
                    {author}
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
            <div>
              <p className="mb-2 text-sm font-medium">Обновлен</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={updatedFrom}
                  onChange={(e) => setUpdatedFrom(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label="Обновлен с"
                />
                <Input
                  type="date"
                  value={updatedTo}
                  onChange={(e) => setUpdatedTo(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label="Обновлен по"
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
                ? 'Закрыть выбранные риски?'
                : 'Удалить выбранные риски?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Выбрано записей: {selectedIds.length}. Подтвердите выполнение действия.
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
              onClick={handleBulkConfirm}
            >
              {bulkAction === 'delete' ? 'Удалить' : 'Подтвердить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </>
  )
}
