'use client'

import { useEffect, useMemo, useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useLocale } from '@/contexts/locale-context'
import { useProjects } from '@/contexts/projects-context'
import { useVisibleRisks } from '@/hooks/use-visible-risks'
import { PROJECT_STATUSES, type ProjectRecord } from '@/lib/project-types'
import {
  projectStatusBadgeClass,
  riskTableChipBase
} from '@/lib/risk-badge-styles'
import { getPageCopy } from '@/lib/page-copy'
import { formatDisplayDate } from '@/lib/risks-storage'
import { cn } from '@/lib/utils'

function projectDisplayCode(p: ProjectRecord) {
  return p.code && /^P-\d{3}$/.test(p.code) ? p.code : p.id
}

export function ProjectsRegistryTable() {
  const router = useRouter()
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const {
    myProjects,
    ready,
    memberCount,
    updateProject,
    deleteProject,
    refresh
  } = useProjects()
  const risks = useVisibleRisks()
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [idFilter, setIdFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [idSearch, setIdSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<'close' | 'delete' | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const projectIds = useMemo(
    () => myProjects.map((project) => projectDisplayCode(project)),
    [myProjects]
  )
  const projectCategories = useMemo(
    () =>
      Array.from(
        new Set(
          myProjects
            .map((project) => project.category.trim())
            .filter(Boolean)
        )
      ),
    [myProjects]
  )
  const filteredIdOptions = useMemo(() => {
    const query = idSearch.trim().toLowerCase()
    if (!query) return projectIds
    return projectIds.filter((item) => item.toLowerCase().includes(query))
  }, [projectIds, idSearch])
  const filteredCategoryOptions = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return projectCategories
    return projectCategories.filter((item) => item.toLowerCase().includes(query))
  }, [projectCategories, categorySearch])

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
      if (idFilter !== 'all' && projectDisplayCode(p) !== idFilter) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (createdFrom && p.createdAt < createdFrom) return false
      if (createdTo && p.createdAt > createdTo) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const desc = (p.description ?? '').toLowerCase()
        const cat = (p.category ?? '').toLowerCase()
        if (
          !p.name.toLowerCase().includes(q) &&
          !desc.includes(q) &&
          !cat.includes(q) &&
          !projectDisplayCode(p).toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [
    myProjects,
    idFilter,
    statusFilter,
    categoryFilter,
    createdFrom,
    createdTo,
    search
  ])

  const riskParticipantsByProject = useMemo(() => {
    const map: Record<string, number> = {}
    for (const risk of risks) {
      if (!risk.projectId) continue
      const set = new Set<string>()
      const author = risk.author.trim()
      if (author) set.add(author)
      for (const comment of risk.comments ?? []) {
        const name = comment.authorName.trim()
        if (name) set.add(name)
      }
      map[risk.projectId] = Math.max(map[risk.projectId] ?? 0, set.size)
    }
    return map
  }, [risks])

  useEffect(() => {
    setPage(1)
  }, [search, idFilter, statusFilter, categoryFilter, createdFrom, createdTo, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const paged = filtered.slice(pageStart, pageStart + pageSize)

  const appliedFilters =
    (idFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (createdFrom ? 1 : 0) +
    (createdTo ? 1 : 0)

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) paged.forEach((p) => (next[p.id] = true))
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
      if (ok)
        toast.success(p.registryProjects.closedOk.replace('{n}', String(ok)))
      if (fail)
        toast.message(
          p.registryProjects.closedFail.replace('{n}', String(fail))
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
      if (ok)
        toast.success(p.registryProjects.deletedOk.replace('{n}', String(ok)))
      if (fail)
        toast.message(
          p.registryProjects.deletedFail.replace('{n}', String(fail))
        )
    }

    setSelected({})
    setBulkAction(null)
    await refresh()
  }

  const handleSearch = () => {
    const q = search.trim()
    toast.success(
      q
        ? p.registryProjects.searchFound
            .replace('{q}', q)
            .replace('{n}', String(filtered.length))
        : p.registryProjects.searchEmpty
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b pb-4">
          <CardTitle className="text-base font-semibold">
            {p.registryProjects.cardTitle}
          </CardTitle>
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
                {p.registry.filters}
              </Button>
              {appliedFilters > 0 && (
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  {p.filterCount(appliedFilters)}
                </span>
              )}
              {appliedFilters > 0 && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto whitespace-nowrap p-0 text-primary"
                  onClick={() => {
                    setIdFilter('all')
                    setStatusFilter('all')
                    setCategoryFilter('all')
                    setCreatedFrom('')
                    setCreatedTo('')
                    toast.message(p.registry.filtersResetToast)
                  }}
                >
                  {p.registry.reset}
                </Button>
              )}
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl lg:flex-1">
              <Input
                placeholder={p.registry.searchPlaceholder}
                className="min-w-0 flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                aria-label={p.registry.searchAria}
              />
              <Button
                type="button"
                className="shrink-0 sm:size-10"
                aria-label={p.registry.search}
                onClick={handleSearch}
              >
                <Search className="h-4 w-4 sm:mx-auto" />
                <span className="ml-2 sm:hidden">{p.registry.find}</span>
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
                {p.registry.closeSelected}
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
                {p.registry.deleteSelected}
              </Button>
            </div>
          </div>

          <div className="risk-table-scroll w-full overflow-x-auto overflow-y-hidden">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          paged.length > 0 &&
                          paged.every((p) => selected[p.id])
                        }
                        onCheckedChange={(v) => toggleAll(!!v)}
                        aria-label={p.registry.selectAll}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colId}</TableHead>
                  <TableHead className="min-w-[200px] whitespace-nowrap">
                    {p.registry.colName}
                  </TableHead>
                  <TableHead className="min-w-[120px] whitespace-nowrap">
                    {p.registry.colCategory}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colCreated}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colStatus}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colMembers}</TableHead>
                  <TableHead className="whitespace-nowrap text-left">
                    {p.registry.colActions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!ready ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground"
                    >
                      {p.registry.loading}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground"
                    >
                      {myProjects.length === 0
                        ? p.registryProjects.emptyNoProjects
                        : p.registryProjects.emptyFiltered}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((row) => (
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
                          aria-label={`${p.registry.selectAll} ${projectDisplayCode(row)}`}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {projectDisplayCode(row)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {row.name}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {row.category?.trim() || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDisplayDate(row.createdAt, locale)}
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
                        {Math.max(
                          counts[row.id] ?? 0,
                          riskParticipantsByProject[row.id] ?? 0
                        ) || '—'}
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
                            title={p.registry.show}
                            aria-label={p.registry.show}
                            onClick={() => router.push(`/projects/${row.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            title={p.registry.edit}
                            aria-label={p.registry.edit}
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
                            title={p.registry.delete}
                            aria-label={p.registry.delete}
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
            <div className="flex flex-col gap-3 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between md:px-6">
              <div>
                <span className="text-muted-foreground">{p.registry.totalRecords} </span>
                <span className="text-foreground">{filtered.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">
                  {p.registry.pageLabel.replace('{current}', String(safePage)).replace('{total}', String(totalPages))}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  {p.registry.prevPage}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  {p.registry.nextPage}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={filterOpen}
        onOpenChange={(open) => {
          setFilterOpen(open)
          if (open) return
          setIdSearch('')
          setCategorySearch('')
        }}
      >
        <DialogContent className="risk-filter-scroll max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{p.registry.dialogFilters}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.colId}</p>
              <Select value={idFilter} onValueChange={setIdFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      value={idSearch}
                      onChange={(e) => setIdSearch(e.target.value)}
                      placeholder={p.registry.searchPlaceholder}
                      className="h-8"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">{p.analytics.all}</SelectItem>
                  {filteredIdOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.status}</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{p.analytics.all}</SelectItem>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.colCategory}</p>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder={p.registry.searchPlaceholder}
                      className="h-8"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">{p.analytics.all}</SelectItem>
                  {filteredCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.rowsPerPage}</p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.colCreated}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label={p.registry.createdFrom}
                />
                <Input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label={p.registry.createdTo}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setFilterOpen(false)
                toast.success(p.registry.filtersApplied)
              }}
            >
              {p.registry.apply}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === 'close'
                ? p.registryProjects.bulkCloseTitle
                : p.registryProjects.bulkDeleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {p.registryProjects.bulkDescription.replace(
                '{n}',
                String(selectedIds.length)
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{p.registry.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={
                bulkAction === 'delete'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
              onClick={() => void handleBulkConfirm()}
            >
              {bulkAction === 'delete' ? p.registry.delete : p.registry.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p.registryProjects.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {p.registryProjects.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{p.registry.cancel}</AlertDialogCancel>
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
                toast.success(p.registryProjects.deleted)
                setDeleteId(null)
                await refresh()
              }}
            >
              {p.registry.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
