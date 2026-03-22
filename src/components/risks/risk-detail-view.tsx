'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Send,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useRisks } from '@/contexts/risks-context'
import type { RiskRecord } from '@/lib/risk-types'
import { formatDisplayDate } from '@/lib/risks-storage'

interface RiskDetailViewProps {
  risk: RiskRecord
}

export function RiskDetailView({ risk }: RiskDetailViewProps) {
  const router = useRouter()
  const { removeRisk } = useRisks()
  const [comments, setComments] = useState<
    { id: string; text: string; at: string }[]
  >([
    {
      id: '1',
      text: 'Предлагаю перенести окно работ на выходные.',
      at: 'Сегодня, 10:12'
    }
  ])
  const [draft, setDraft] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [measures, setMeasures] = useState([
    { id: 'm1', label: 'Обновить план резервирования', done: true },
    { id: 'm2', label: 'Согласовать окно простоя с бизнесом', done: false }
  ])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-5xl flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/risks">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button className="gap-2" asChild>
            <Link href={`/risks/${risk.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Редактировать
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" aria-label="Ещё">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard?.writeText(risk.code)
                  toast.success('ID скопирован')
                }}
              >
                Копировать ID
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{risk.name}</CardTitle>
                <Badge variant="danger">{risk.impact}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {risk.category} · Проект: {risk.project}
              </p>
              <p className="text-sm">
                Статус:{' '}
                <span className="font-semibold text-destructive">
                  {risk.status}
                </span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{risk.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="warning">Вероятность: {risk.probability}</Badge>
                <Badge variant="danger">Воздействие: {risk.impact}</Badge>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Автор: {risk.author} · Создан{' '}
                {formatDisplayDate(risk.created)} · Обновлён{' '}
                {formatDisplayDate(risk.updated)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Комментарии
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border bg-muted/20 p-3 text-sm"
                  >
                    <p className="text-xs text-muted-foreground">{c.at}</p>
                    <p className="mt-1">{c.text}</p>
                  </li>
                ))}
              </ul>
              <Textarea
                placeholder="Оставить комментарий..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  if (!draft.trim()) {
                    toast.message('Введите текст комментария')
                    return
                  }
                  setComments((prev) => [
                    {
                      id: crypto.randomUUID(),
                      text: draft.trim(),
                      at: 'Только что'
                    },
                    ...prev
                  ])
                  setDraft('')
                  toast.success('Комментарий добавлен')
                }}
              >
                <Send className="h-4 w-4" />
                Отправить
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Меры реагирования</CardTitle>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => {
                  setMeasures((m) => [
                    ...m,
                    {
                      id: crypto.randomUUID(),
                      label: 'Новая мера',
                      done: false
                    }
                  ])
                  toast.success('Добавлена мера')
                }}
              >
                + Добавить
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {measures.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-start gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={m.done}
                    onChange={() => {
                      setMeasures((prev) =>
                        prev.map((x) =>
                          x.id === m.id ? { ...x, done: !x.done } : x
                        )
                      )
                    }}
                  />
                  <span className={m.done ? 'line-through opacity-60' : ''}>
                    {m.label}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Лента изменений</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Статус изменён на «{risk.status}»</p>
              <p>• Добавлено вложение (демо)</p>
              <p>• Карточка создана</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить риск {risk.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              Запись будет удалена из локального хранилища.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeRisk(risk.id)
                toast.success('Риск удалён')
                router.push('/risks')
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
