'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronDown, Save, X } from 'lucide-react'
import { toast } from '@/lib/app-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableCategoryField } from '@/components/forms/searchable-category-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import { saveCustomCategory } from '@/lib/custom-categories-storage'
import {
  IMPACTS,
  LEVELS,
  RISK_STATUSES,
  type RiskRecord
} from '@/lib/risk-types'
import { getCurrentUserDisplayName } from '@/lib/user-display'
import { cn } from '@/lib/utils'

const levelToIndex = (v: string) =>
  Math.max(0, LEVELS.indexOf(v as (typeof LEVELS)[number]))
const impactToIndex = (v: string) =>
  Math.max(0, IMPACTS.indexOf(v as (typeof IMPACTS)[number]))

function sliderToneClass(index: number) {
  if (index <= 0) return '[--slider-color:theme(colors.emerald.500)] text-emerald-600'
  if (index === 1) return '[--slider-color:theme(colors.amber.500)] text-amber-600'
  return '[--slider-color:theme(colors.red.500)] text-red-600'
}

function probabilityToneLabel(index: number) {
  if (index <= 0) return 'Низкая'
  if (index === 1) return 'Средняя'
  return 'Высокая'
}

function impactToneLabel(index: number) {
  if (index <= 0) return 'Низкое'
  if (index === 1) return 'Среднее'
  return 'Высокое'
}

interface RiskFormViewProps {
  mode: 'new' | 'edit'
  initial?: RiskRecord
  /** При создании риска с карточки проекта: фиксирует проект */
  presetProjectId?: string
}

function SearchableProjectSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  disabled
}: {
  value: string
  onChange: (v: string) => void
  options: readonly { value: string; label: string }[]
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
}) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filteredOptions = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(q)),
    [options, q]
  )

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  if (disabled) {
    return (
      <div className="space-y-2">
        <Label>Проект</Label>
        <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {options.find((o) => o.value === value)?.label || '—'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Проект</Label>
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between px-3 font-normal"
          >
            <span className={value ? 'truncate' : 'truncate text-muted-foreground'}>
              {options.find((o) => o.value === value)?.label || placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-border p-2">
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9"
              onKeyDown={(e) => e.stopPropagation()}
              aria-label={`Поиск: Проект`}
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            <DropdownMenuRadioGroup
              value={value || undefined}
              onValueChange={(v) => {
                onChange(v)
                setOpen(false)
              }}
            >
              {filteredOptions.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                Не найдено
              </p>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function RiskFormView({
  mode,
  initial,
  presetProjectId
}: RiskFormViewProps) {
  const router = useRouter()
  const { addRisk, updateRisk } = useRisks()
  const { myProjects, ready: projectsReady } = useProjects()

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [projectId, setProjectId] = useState(initial?.projectId ?? '')
  const [probIdx, setProbIdx] = useState(
    initial ? levelToIndex(initial.probability) : 1
  )
  const [impactIdx, setImpactIdx] = useState(
    initial ? impactToIndex(initial.impact) : 1
  )
  const [status, setStatus] = useState(
    initial?.status ?? RISK_STATUSES[0]
  )

  const probability = LEVELS[probIdx] ?? 'Средняя'
  const impact = IMPACTS[impactIdx] ?? 'Среднее'

  const projectOptions = useMemo(
    () => myProjects.map((p) => ({ value: p.id, label: p.name })),
    [myProjects]
  )

  useEffect(() => {
    if (mode !== 'edit' || !initial) return
    if (initial.projectId) {
      setProjectId(initial.projectId)
      return
    }
    const match = myProjects.find((p) => p.name === initial.project)
    setProjectId(match?.id ?? '')
  }, [mode, initial, myProjects])

  useEffect(() => {
    if (mode !== 'new' || !presetProjectId || !projectsReady) return
    if (!myProjects.some((p) => p.id === presetProjectId)) return
    setProjectId(presetProjectId)
  }, [mode, presetProjectId, projectsReady, myProjects])

  const projectSelectLocked =
    mode === 'new' &&
    Boolean(presetProjectId) &&
    projectsReady &&
    myProjects.some((p) => p.id === presetProjectId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Укажите название риска')
      return
    }
    if (!category.trim()) {
      toast.error('Выберите категорию')
      return
    }
    if (!projectId) {
      toast.error('Выберите проект')
      return
    }
    const proj = myProjects.find((p) => p.id === projectId)
    if (!proj) {
      toast.error('Проект недоступен или удалён')
      return
    }
    if (mode === 'new') {
      saveCustomCategory('risk', category)
      addRisk({
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        probability,
        impact,
        status,
        projectId,
        project: proj.name,
        author: getCurrentUserDisplayName()
      })
      toast.success('Риск сохранён')
      router.push('/risks')
      return
    }
    if (initial) {
      saveCustomCategory('risk', category)
      updateRisk(initial.id, {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        probability,
        impact,
        status,
        projectId,
        project: proj.name
      })
      toast.success('Изменения сохранены')
      router.push(`/risks/${initial.id}`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'new' ? 'Новый риск' : 'Редактирование риска'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="risk-name">Название риска</Label>
              <Input
                id="risk-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название риска"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-desc">Описание риска</Label>
              <Textarea
                id="risk-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробное описание риска..."
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SearchableCategoryField
                value={category}
                onChange={setCategory}
                kind="risk"
                id="risk-category"
              />
              <SearchableProjectSelect
                value={projectId}
                onChange={setProjectId}
                options={projectOptions}
                placeholder="Выберите проект"
                searchPlaceholder="Поиск по проекту…"
                disabled={projectSelectLocked}
              />
              {projectsReady && myProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  У вас нет проектов.{' '}
                  <Link href="/projects/new" className="text-primary underline">
                    Создайте проект
                  </Link>
                  , чтобы добавлять риски.
                </p>
              ) : null}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <Label>Вероятность</Label>
                <Slider
                  className={sliderToneClass(probIdx)}
                  value={[probIdx]}
                  min={0}
                  max={LEVELS.length - 1}
                  step={1}
                  onValueChange={(v) => setProbIdx(v[0] ?? 0)}
                />
                <p className={cn('text-xs font-medium', sliderToneClass(probIdx))}>
                  {probabilityToneLabel(probIdx)}
                </p>
              </div>
              <div className="space-y-3">
                <Label>Воздействие</Label>
                <Slider
                  className={sliderToneClass(impactIdx)}
                  value={[impactIdx]}
                  min={0}
                  max={IMPACTS.length - 1}
                  step={1}
                  onValueChange={(v) => setImpactIdx(v[0] ?? 0)}
                />
                <p className={cn('text-xs font-medium', sliderToneClass(impactIdx))}>
                  {impactToneLabel(impactIdx)}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Автор</Label>
                <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {mode === 'new'
                    ? getCurrentUserDisplayName()
                    : (initial?.author ?? '—')}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href={mode === 'edit' && initial ? `/risks/${initial.id}` : '/risks'}>
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Link>
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
