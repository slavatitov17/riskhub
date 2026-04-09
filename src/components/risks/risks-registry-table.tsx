'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { useRisks } from '@/contexts/risks-context'
import { useVisibleRisks } from '@/hooks/use-visible-risks'
import {
  impactBadgeClass,
  probabilityBadgeClass,
  riskTableChipBase,
  statusBadgeClass
} from '@/lib/risk-badge-styles'
import { getPageCopy } from '@/lib/page-copy'
import { formatDisplayDate } from '@/lib/risks-storage'
import { isCurrentUserRiskAuthor } from '@/lib/user-display'
import { cn } from '@/lib/utils'
import { getCustomCategories } from '@/lib/custom-categories-storage'

export function RisksRegistryTable() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const allOption = p.analytics.all
  const { removeRisk, updateRisk } = useRisks()
  const risks = useVisibleRisks()
  const { getProjectDisplayName, ready: projectsReady } = useProjects()
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [idFilter, setIdFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [probabilityFilter, setProbabilityFilter] = useState('all')
  const [impactFilter, setImpactFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [authorFilter, setAuthorFilter] = useState('all')
  const [idSearch, setIdSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [projectSearch, setProjectSearch] = useState('')
  const [authorSearch, setAuthorSearch] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [updatedFrom, setUpdatedFrom] = useState('')
  const [updatedTo, setUpdatedTo] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkAction, setBulkAction] = useState<'close' | 'delete' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [customRiskCategories, setCustomRiskCategories] = useState<string[]>([])
  const riskIds = useMemo(() => risks.map((risk) => risk.code), [risks])
  const filteredIdOptions = useMemo(() => {
    const query = idSearch.trim().toLowerCase()
    if (!query) return riskIds
    return riskIds.filter((item) => item.toLowerCase().includes(query))
  }, [riskIds, idSearch])

  useEffect(() => {
    setCustomRiskCategories(getCustomCategories('risk'))
  }, [])

  const categories = useMemo(() => {
    const fromRisks = Array.from(new Set(risks.map((r) => r.category)))
    const merged = [...fromRisks]
    const seen = new Set(fromRisks.map((item) => item.toLowerCase()))
    for (const item of customRiskCategories) {
      if (seen.has(item.toLowerCase())) continue
      merged.push(item)
      seen.add(item.toLowerCase())
    }
    return merged
  }, [risks, customRiskCategories])
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
  const filteredCategoryOptions = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((item) => item.toLowerCase().includes(query))
  }, [categories, categorySearch])
  const filteredProjectOptions = useMemo(() => {
    const query = projectSearch.trim().toLowerCase()
    if (!query) return projects
    return projects.filter((item) => item.toLowerCase().includes(query))
  }, [projects, projectSearch])
  const filteredAuthorOptions = useMemo(() => {
    const query = authorSearch.trim().toLowerCase()
    if (!query) return authors
    return authors.filter((item) => item.toLowerCase().includes(query))
  }, [authors, authorSearch])

  useEffect(() => {
    const status = searchParams.get('status')
    const probability = searchParams.get('probability')
    const impact = searchParams.get('impact')
    if (status && statuses.includes(status)) setStatusFilter(status)
    if (probability && probabilities.includes(probability))
      setProbabilityFilter(probability)
    if (impact && impacts.includes(impact)) setImpactFilter(impact)
  }, [searchParams, statuses, probabilities, impacts])

  const filtered = useMemo(() => {
    return risks.filter((r) => {
      if (idFilter !== 'all' && r.code !== idFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (catFilter !== 'all' && r.category !== catFilter) return false
      if (probabilityFilter !== 'all' && r.probability !== probabilityFilter)
        return false
      if (impactFilter !== 'all' && r.impact !== impactFilter) return false
      if (
        projectFilter !== 'all' &&
        getProjectDisplayName(r.projectId, r.project) !== projectFilter
      )
        return false
      if (authorFilter !== 'all' && r.author !== authorFilter)
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
    idFilter,
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
    (idFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (catFilter !== 'all' ? 1 : 0) +
    (probabilityFilter !== 'all' ? 1 : 0) +
    (impactFilter !== 'all' ? 1 : 0) +
    (projectFilter !== 'all' ? 1 : 0) +
    (authorFilter !== 'all' ? 1 : 0) +
    (createdFrom ? 1 : 0) +
    (createdTo ? 1 : 0) +
    (updatedFrom ? 1 : 0) +
    (updatedTo ? 1 : 0)

  useEffect(() => {
    setPage(1)
  }, [
    search,
    idFilter,
    statusFilter,
    catFilter,
    probabilityFilter,
    impactFilter,
    projectFilter,
    authorFilter,
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
    pageSize
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const paged = filtered.slice(pageStart, pageStart + pageSize)

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) paged.forEach((r) => (next[r.id] = true))
    setSelected(next)
  }

  const selectedIds = Object.keys(selected).filter((id) => selected[id])

  const handleBulkConfirm = () => {
    if (!bulkAction || !selectedIds.length) return

    if (bulkAction === 'close') {
      selectedIds.forEach((id) => updateRisk(id, { status: 'Закрыт' }))
      toast.success(p.registryRisks.closedToast)
    }

    if (bulkAction === 'delete') {
      const deletable = selectedIds.filter((id) => {
        const r = risks.find((x) => x.id === id)
        return r != null && isCurrentUserRiskAuthor(r.author)
      })
      if (deletable.length === 0) {
        toast.error(
          locale === 'en'
            ? 'You can only delete risks you created.'
            : 'Удалять можно только свои риски (вы не автор выбранных карточек).'
        )
        setSelected({})
        setBulkAction(null)
        return
      }
      deletable.forEach((id) => removeRisk(id))
      const skipped = selectedIds.length - deletable.length
      if (skipped > 0) {
        toast.success(
          locale === 'en'
            ? `Deleted ${deletable.length} risk(s). ${skipped} skipped (not author).`
            : `Удалено рисков: ${deletable.length}. Пропущено (не автор): ${skipped}.`
        )
      } else toast.success(p.registryRisks.deletedToast)
    }

    setSelected({})
    setBulkAction(null)
  }

  const handleSearch = () => {
    const q = search.trim()
    toast.success(
      q
        ? p.registryRisks.searchFound
            .replace('{q}', q)
            .replace('{n}', String(filtered.length))
        : p.registryRisks.searchEmpty
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b pb-4">
          <CardTitle className="text-base font-semibold">
            {p.registryRisks.cardTitle}
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
                    setStatusFilter('all')
                    setIdFilter('all')
                    setCatFilter('all')
                    setProbabilityFilter('all')
                    setImpactFilter('all')
                    setProjectFilter('all')
                    setAuthorFilter('all')
                    setCreatedFrom('')
                    setCreatedTo('')
                    setUpdatedFrom('')
                    setUpdatedTo('')
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
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          paged.length > 0 &&
                          paged.every((r) => selected[r.id])
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
                  <TableHead className="whitespace-nowrap">{p.registry.colCategory}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colProbability}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colImpact}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colStatus}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colProject}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colAuthor}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colCreated}</TableHead>
                  <TableHead className="whitespace-nowrap">{p.registry.colUpdated}</TableHead>
                  <TableHead className="whitespace-nowrap text-left">
                    {p.registry.colActions}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!projectsReady ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-muted-foreground">
                      {p.registry.loading}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-muted-foreground">
                      {risks.length === 0
                        ? p.registryRisks.emptyNoRisks
                        : p.registryRisks.emptyFiltered}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((row) => (
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
                        aria-label={`${p.registry.selectAll} ${row.code}`}
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
                      {formatDisplayDate(row.created, locale)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDisplayDate(row.updated, locale)}
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
                          onClick={() => router.push(`/risks/${row.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isCurrentUserRiskAuthor(row.author) ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              type="button"
                              title={p.registry.edit}
                              aria-label={p.registry.edit}
                              onClick={() =>
                                router.push(`/risks/${row.id}/edit`)
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
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                {p.registry.nextPage}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={filterOpen}
        onOpenChange={(open) => {
          setFilterOpen(open)
          if (open) return
          setIdSearch('')
          setCategorySearch('')
          setProjectSearch('')
          setAuthorSearch('')
        }}
      >
        <DialogContent className="risk-filter-scroll max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{p.registry.dialogFilters}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                  <SelectItem value="all">{allOption}</SelectItem>
                  {filteredIdOptions.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.category}</p>
              <Select value={catFilter} onValueChange={setCatFilter}>
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
                  <SelectItem value="all">{allOption}</SelectItem>
                  {filteredCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.probability}</p>
              <Select value={probabilityFilter} onValueChange={setProbabilityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{allOption}</SelectItem>
                  {probabilities.map((probability) => (
                    <SelectItem key={probability} value={probability}>
                      {probability}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.impact}</p>
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{allOption}</SelectItem>
                  {impacts.map((impact) => (
                    <SelectItem key={impact} value={impact}>
                      {impact}
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
                  <SelectItem value="all">{allOption}</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.project}</p>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder={p.registry.searchPlaceholder}
                      className="h-8"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">{p.registry.allProjects}</SelectItem>
                  {filteredProjectOptions.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.author}</p>
              <Select value={authorFilter} onValueChange={setAuthorFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      value={authorSearch}
                      onChange={(e) => setAuthorSearch(e.target.value)}
                      placeholder={p.registry.searchPlaceholder}
                      className="h-8"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">{p.registry.allAuthors}</SelectItem>
                  {filteredAuthorOptions.map((author) => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
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
            <div>
              <p className="mb-2 text-sm font-medium">{p.registry.updatedLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={updatedFrom}
                  onChange={(e) => setUpdatedFrom(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label={p.registry.updatedFrom}
                />
                <Input
                  type="date"
                  value={updatedTo}
                  onChange={(e) => setUpdatedTo(e.target.value)}
                  className="calendar-input accent-primary"
                  aria-label={p.registry.updatedTo}
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
                ? p.registryRisks.bulkCloseTitle
                : p.registryRisks.bulkDeleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {p.registryRisks.bulkDescription.replace(
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
              onClick={handleBulkConfirm}
            >
              {bulkAction === 'delete' ? p.registry.delete : p.registry.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p.registryRisks.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {p.registryRisks.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{p.registry.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteId) return
                const r = risks.find((x) => x.id === deleteId)
                if (!r || !isCurrentUserRiskAuthor(r.author)) {
                  toast.error(
                    locale === 'en'
                      ? 'You can only delete risks you created.'
                      : 'Удалять можно только свои риски.'
                  )
                  setDeleteId(null)
                  return
                }
                removeRisk(deleteId)
                toast.success(p.registryRisks.deleted)
                setDeleteId(null)
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
