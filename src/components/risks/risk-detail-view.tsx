'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  X
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useRisks } from '@/contexts/risks-context'
import {
  impactBadgeClass,
  probabilityBadgeClass,
  statusBadgeClass
} from '@/lib/risk-badge-styles'
import type { RiskComment, RiskRecord, RiskResponseMeasure } from '@/lib/risk-types'
import { formatDisplayDate, formatRuDateTime } from '@/lib/risks-storage'
import { cn } from '@/lib/utils'

interface RiskDetailViewProps {
  risk: RiskRecord
}

const listUiTextClass = 'text-sm font-normal'

function authorInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2)
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  if (parts.length === 1 && parts[0]!.length >= 2)
    return parts[0]!.slice(0, 2).toUpperCase()
  return '—'
}

function metaOutlineTag(children: React.ReactNode) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-foreground',
        listUiTextClass
      )}
    >
      {children}
    </span>
  )
}

export function RiskDetailView({ risk }: RiskDetailViewProps) {
  const router = useRouter()
  const { removeRisk, updateRisk } = useRisks()
  const [draft, setDraft] = useState('')
  const [pendingAttachment, setPendingAttachment] = useState<{
    name: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [newMeasureLabel, setNewMeasureLabel] = useState('')
  const [isAddingMeasure, setIsAddingMeasure] = useState(false)
  const [editingMeasureId, setEditingMeasureId] = useState<string | null>(null)
  const [editMeasureText, setEditMeasureText] = useState('')

  const comments = risk.comments ?? []
  const measures = risk.responseMeasures ?? []
  const activityLog = [...(risk.activityLog ?? [])].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at)
  )

  const patchMeasures = (next: RiskResponseMeasure[]) => {
    updateRisk(risk.id, { responseMeasures: next })
  }

  const handleToggleMeasure = (id: string) => {
    patchMeasures(
      measures.map((m) => (m.id === id ? { ...m, done: !m.done } : m))
    )
  }

  const handleCommitNewMeasure = () => {
    const label = newMeasureLabel.trim()
    if (!label) return
    patchMeasures([
      ...measures,
      { id: crypto.randomUUID(), label, done: false }
    ])
    setNewMeasureLabel('')
    setIsAddingMeasure(false)
    toast.success('Мера добавлена')
  }

  const handleSaveEditMeasure = () => {
    if (!editingMeasureId) return
    const label = editMeasureText.trim()
    if (!label) {
      toast.message('Текст не может быть пустым')
      return
    }
    patchMeasures(
      measures.map((m) =>
        m.id === editingMeasureId ? { ...m, label } : m
      )
    )
    setEditingMeasureId(null)
    setEditMeasureText('')
    toast.success('Мера обновлена')
  }

  const handleSendComment = () => {
    const text = draft.trim()
    if (!text && !pendingAttachment) {
      toast.message('Введите текст или прикрепите файл')
      return
    }
    const authorName = risk.author.trim() || 'Не указан'
    const entry: RiskComment = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      authorName,
      text: text || 'Вложение',
      attachment: pendingAttachment ?? undefined
    }
    updateRisk(risk.id, { comments: [entry, ...comments] })
    setDraft('')
    setPendingAttachment(null)
    toast.success('Комментарий отправлен')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPendingAttachment({ name: file.name })
    e.target.value = ''
  }

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
          <Button variant="outline" className="gap-2" asChild>
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
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn('text-foreground', listUiTextClass)}>
                  {risk.code}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5',
                    listUiTextClass,
                    statusBadgeClass(risk.status)
                  )}
                >
                  {risk.status}
                </span>
              </div>
              <CardTitle className="text-2xl">{risk.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {metaOutlineTag(<>Категория: {risk.category}</>)}
                {metaOutlineTag(<>Проект: {risk.project}</>)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Описание риска
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {risk.description || '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border px-2.5 py-1',
                    listUiTextClass,
                    probabilityBadgeClass(risk.probability)
                  )}
                >
                  Вероятность: {risk.probability}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border px-2.5 py-1',
                    listUiTextClass,
                    impactBadgeClass(risk.impact)
                  )}
                >
                  Воздействие: {risk.impact}
                </span>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {metaOutlineTag(<>Автор: {risk.author}</>)}
                {metaOutlineTag(<>Создан {formatDisplayDate(risk.created)}</>)}
                {metaOutlineTag(<>Обновлён {formatDisplayDate(risk.updated)}</>)}
              </div>
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
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Комментариев пока нет.
                </p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <div className="flex gap-3">
                        <Avatar className="size-9 shrink-0">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(c.authorName)}`}
                            alt=""
                          />
                          <AvatarFallback className="text-xs">
                            {authorInitials(c.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className={cn('font-medium text-foreground', listUiTextClass)}>
                            {c.authorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRuDateTime(c.at)}
                          </p>
                          <p className="text-sm leading-relaxed">{c.text}</p>
                          {c.attachment ? (
                            <p className="text-xs text-muted-foreground">
                              Вложение:{' '}
                              <span className="font-medium text-foreground">
                                {c.attachment.name}
                              </span>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={handleFileChange}
              />
              <Textarea
                placeholder="Оставить комментарий..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Текст комментария"
              />
              {pendingAttachment ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    {pendingAttachment.name}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    aria-label="Убрать вложение"
                    onClick={() => setPendingAttachment(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                  Прикрепить файл
                </Button>
                <Button type="button" className="gap-2" onClick={handleSendComment}>
                  <Send className="h-4 w-4" />
                  Отправить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Меры реагирования</CardTitle>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => {
                  setIsAddingMeasure(true)
                  setNewMeasureLabel('')
                }}
              >
                + Добавить
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {measures.length === 0 && !isAddingMeasure ? (
                <p className="text-sm text-muted-foreground">
                  Мер реагирования пока нет.
                </p>
              ) : null}
              {measures.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-primary"
                    checked={m.done}
                    onChange={() => handleToggleMeasure(m.id)}
                    aria-label={`Выполнено: ${m.label}`}
                  />
                  {editingMeasureId === m.id ? (
                    <Input
                      value={editMeasureText}
                      onChange={(e) => setEditMeasureText(e.target.value)}
                      className="min-w-0 flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditMeasure()
                        if (e.key === 'Escape') {
                          setEditingMeasureId(null)
                          setEditMeasureText('')
                        }
                      }}
                    />
                  ) : (
                    <>
                      <span
                        className={cn(
                          'min-w-0 flex-1',
                          m.done && 'line-through opacity-60'
                        )}
                      >
                        {m.label}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0 text-muted-foreground"
                        aria-label="Изменить меру"
                        onClick={() => {
                          setEditingMeasureId(m.id)
                          setEditMeasureText(m.label)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
              {isAddingMeasure ? (
                <div className="border-t border-border pt-3">
                  <Input
                    placeholder="Текст меры реагирования"
                    value={newMeasureLabel}
                    onChange={(e) => setNewMeasureLabel(e.target.value)}
                    className="w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitNewMeasure()
                      if (e.key === 'Escape') {
                        setIsAddingMeasure(false)
                        setNewMeasureLabel('')
                      }
                    }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Лента изменений</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityLog.map((e) => (
                <div key={e.id} className="space-y-1 text-sm">
                  <p className="text-foreground">• {e.message}</p>
                  <p className="text-left text-xs tabular-nums text-muted-foreground">
                    {formatRuDateTime(e.at)}
                  </p>
                </div>
              ))}
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
