'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
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
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useRisks } from '@/contexts/risks-context'
import {
  IMPACTS,
  LEVELS,
  RISK_CATEGORIES,
  RISK_STATUSES,
  type RiskRecord
} from '@/lib/risk-types'

const levelToIndex = (v: string) =>
  Math.max(0, LEVELS.indexOf(v as (typeof LEVELS)[number]))
const impactToIndex = (v: string) =>
  Math.max(0, IMPACTS.indexOf(v as (typeof IMPACTS)[number]))

interface RiskFormViewProps {
  mode: 'new' | 'edit'
  initial?: RiskRecord
}

export function RiskFormView({ mode, initial }: RiskFormViewProps) {
  const router = useRouter()
  const { addRisk, updateRisk } = useRisks()

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [project, setProject] = useState(initial?.project ?? '')
  const [probIdx, setProbIdx] = useState(
    initial ? levelToIndex(initial.probability) : 1
  )
  const [impactIdx, setImpactIdx] = useState(
    initial ? impactToIndex(initial.impact) : 1
  )
  const [status, setStatus] = useState(
    initial?.status ?? RISK_STATUSES[0]
  )
  const [author, setAuthor] = useState(initial?.author ?? '')

  const probability = LEVELS[probIdx] ?? 'Средняя'
  const impact = IMPACTS[impactIdx] ?? 'Среднее'

  const projects = useMemo(
    () => ['Проект X', 'Проект Y', 'Проект Z', 'Проект А', 'Проект Б'],
    []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Укажите название риска')
      return
    }
    if (!category) {
      toast.error('Выберите категорию')
      return
    }
    if (!project) {
      toast.error('Выберите проект')
      return
    }
    if (mode === 'new') {
      addRisk({
        name: name.trim(),
        description: description.trim(),
        category,
        probability,
        impact,
        status,
        project,
        author: author.trim() || 'Не указан'
      })
      toast.success('Риск сохранён')
      router.push('/risks')
      return
    }
    if (initial) {
      updateRisk(initial.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        probability,
        impact,
        status,
        project,
        author: author.trim() || initial.author
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
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select
                  value={category || undefined}
                  onValueChange={setCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
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
                  value={project || undefined}
                  onValueChange={setProject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex justify-between gap-2">
                  <Label>Вероятность</Label>
                  <span className="text-sm text-muted-foreground">
                    {probability}
                  </span>
                </div>
                <Slider
                  value={[probIdx]}
                  min={0}
                  max={LEVELS.length - 1}
                  step={1}
                  onValueChange={(v) => setProbIdx(v[0] ?? 0)}
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between gap-2">
                  <Label>Воздействие</Label>
                  <span className="text-sm text-muted-foreground">{impact}</span>
                </div>
                <Slider
                  value={[impactIdx]}
                  min={0}
                  max={IMPACTS.length - 1}
                  step={1}
                  onValueChange={(v) => setImpactIdx(v[0] ?? 0)}
                />
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
                <Label htmlFor="author">Автор</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="ФИО"
                />
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
