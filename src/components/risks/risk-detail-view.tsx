'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  X
} from 'lucide-react'
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
import { useLocale } from '@/contexts/locale-context'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import {
  impactBadgeClass,
  probabilityBadgeClass,
  statusBadgeClass
} from '@/lib/risk-badge-styles'
import { translateActivityLogMessage } from '@/lib/activity-log-i18n'
import { getCommentAttachments } from '@/lib/comment-attachments'
import { getPageCopy } from '@/lib/page-copy'
import type {
  RiskComment,
  RiskCommentAttachment,
  RiskRecord,
  RiskResponseMeasure
} from '@/lib/risk-types'
import {
  formatDisplayDate,
  formatLocaleDateTime
} from '@/lib/risks-storage'
import {
  getCurrentUserCommentAuthor,
  isCurrentUserRiskAuthor
} from '@/lib/user-display'
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
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const { removeRisk, updateRisk } = useRisks()
  const { getProjectDisplayName } = useProjects()
  const [draft, setDraft] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<
    RiskCommentAttachment[]
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [newMeasureLabel, setNewMeasureLabel] = useState('')
  const [isAddingMeasure, setIsAddingMeasure] = useState(false)
  const [editingMeasureId, setEditingMeasureId] = useState<string | null>(null)
  const [editMeasureText, setEditMeasureText] = useState('')

  const canEditOrDeleteRisk = isCurrentUserRiskAuthor(risk.author)

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
    toast.success(p.riskDetail.measureAdded)
  }

  const handleSaveEditMeasure = () => {
    if (!editingMeasureId) return
    const label = editMeasureText.trim()
    if (!label) {
      toast.message(p.riskDetail.measureEmpty)
      return
    }
    patchMeasures(
      measures.map((m) =>
        m.id === editingMeasureId ? { ...m, label } : m
      )
    )
    setEditingMeasureId(null)
    setEditMeasureText('')
    toast.success(p.riskDetail.measureUpdated)
  }

  const handleDownloadAttachment = (att: RiskCommentAttachment) => {
    if (!att.dataUrl) {
      toast.message(
        locale === 'en'
          ? 'This file cannot be downloaded (saved before update).'
          : 'Файл недоступен для скачивания (сохранён до обновления).'
      )
      return
    }
    const a = document.createElement('a')
    a.href = att.dataUrl
    a.download = att.name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleSendComment = () => {
    const text = draft.trim()
    if (!text && pendingAttachments.length === 0) {
      toast.message(p.riskDetail.needTextOrFile)
      return
    }
    const { name: authorName, avatarUrl } = getCurrentUserCommentAuthor()
    const entry: RiskComment = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      authorName,
      authorAvatarUrl: avatarUrl ?? undefined,
      text,
      attachments: pendingAttachments.length ? pendingAttachments : undefined
    }
    updateRisk(risk.id, { comments: [entry, ...comments] })
    setDraft('')
    setPendingAttachments([])
    toast.success(p.riskDetail.commentSent)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!picked.length) return
    void Promise.all(
      picked.map(
        (file) =>
          new Promise<RiskCommentAttachment>((resolve, reject) => {
            const r = new FileReader()
            r.onload = () =>
              resolve({ name: file.name, dataUrl: String(r.result) })
            r.onerror = () => reject(r.error)
            r.readAsDataURL(file)
          })
      )
    )
      .then((atts) =>
        setPendingAttachments((prev) => [...prev, ...atts])
      )
      .catch(() =>
        toast.message(
          locale === 'en' ? 'Could not read file' : 'Не удалось прочитать файл'
        )
      )
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
            {p.riskDetail.back}
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          {canEditOrDeleteRisk ? (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/risks/${risk.id}/edit`}>
                <Pencil className="h-4 w-4" />
                {p.riskDetail.edit}
              </Link>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" aria-label={p.riskDetail.more}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard?.writeText(risk.code)
                  toast.success(p.riskDetail.idCopied)
                }}
              >
                {p.riskDetail.copyId}
              </DropdownMenuItem>
              {canEditOrDeleteRisk ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {p.riskDetail.delete}
                </DropdownMenuItem>
              ) : null}
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
                {metaOutlineTag(
                  <>
                    {p.riskDetail.category}: {risk.category}
                  </>
                )}
                {metaOutlineTag(
                  <>
                    {p.riskDetail.project}:{' '}
                    {getProjectDisplayName(risk.projectId, risk.project)}
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  {p.riskDetail.descriptionTitle}
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
                  {p.riskDetail.probability}: {risk.probability}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border px-2.5 py-1',
                    listUiTextClass,
                    impactBadgeClass(risk.impact)
                  )}
                >
                  {p.riskDetail.impact}: {risk.impact}
                </span>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {metaOutlineTag(
                  <>
                    {p.riskDetail.author}: {risk.author}
                  </>
                )}
                {metaOutlineTag(
                  <>
                    {p.riskDetail.created}{' '}
                    {formatDisplayDate(risk.created, locale)}
                  </>
                )}
                {metaOutlineTag(
                  <>
                    {p.riskDetail.updated}{' '}
                    {formatDisplayDate(risk.updated, locale)}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                {p.riskDetail.comments}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {p.riskDetail.noComments}
                </p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((c) => {
                    const atts = getCommentAttachments(c)
                    const showText = c.text.trim().length > 0
                    const hasImg =
                      Boolean(c.authorAvatarUrl) &&
                      /^data:|^https?:\/\//i.test(c.authorAvatarUrl!)
                    return (
                      <li
                        key={c.id}
                        className="rounded-lg border border-border bg-muted/20 p-3"
                      >
                        <div className="flex gap-3">
                          <Avatar className="size-9 shrink-0">
                            {hasImg ? (
                              <AvatarImage src={c.authorAvatarUrl!} alt="" />
                            ) : null}
                            <AvatarFallback className="text-xs font-medium">
                              {authorInitials(c.authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div>
                              <p
                                className={cn(
                                  'font-medium text-foreground',
                                  listUiTextClass
                                )}
                              >
                                {c.authorName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatLocaleDateTime(c.at, locale)}
                              </p>
                            </div>
                            {showText ? (
                              <p className="text-sm leading-relaxed">{c.text}</p>
                            ) : null}
                            {atts.map((att, idx) => (
                              <div
                                key={`${c.id}-att-${idx}-${att.name}`}
                                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
                              >
                                <Paperclip
                                  className="h-4 w-4 shrink-0 text-muted-foreground"
                                  aria-hidden
                                />
                                <button
                                  type="button"
                                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground underline-offset-4 hover:underline"
                                  onClick={() => handleDownloadAttachment(att)}
                                >
                                  {att.name}
                                </button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 shrink-0"
                                  title={p.riskDetail.download}
                                  aria-label={p.riskDetail.download}
                                  onClick={() => handleDownloadAttachment(att)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={handleFileChange}
              />
              <Textarea
                placeholder={p.riskDetail.commentPlaceholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label={p.riskDetail.commentPlaceholder}
              />
              {pendingAttachments.length > 0 ? (
                <ul className="space-y-2">
                  {pendingAttachments.map((att, idx) => (
                    <li
                      key={`pending-${idx}-${att.name}`}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{att.name}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0"
                        aria-label={p.riskDetail.removeAttachment}
                        onClick={() =>
                          setPendingAttachments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                  {p.riskDetail.attachFile}
                </Button>
                <Button type="button" className="gap-2" onClick={handleSendComment}>
                  <Send className="h-4 w-4" />
                  {p.riskDetail.send}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{p.riskDetail.measuresTitle}</CardTitle>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0"
                onClick={() => {
                  setIsAddingMeasure(true)
                  setNewMeasureLabel('')
                }}
              >
                {p.riskDetail.addMeasure}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {measures.length === 0 && !isAddingMeasure ? (
                <p className="text-sm text-muted-foreground">
                  {p.riskDetail.noMeasures}
                </p>
              ) : null}
              {measures.map((m) => (
                <div key={m.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-primary"
                    checked={m.done}
                    onChange={() => handleToggleMeasure(m.id)}
                        aria-label={`${m.label}`}
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
                        aria-label={p.riskDetail.editMeasure}
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
                    placeholder={p.riskDetail.measurePlaceholder}
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
              <CardTitle className="text-base">{p.riskDetail.activity}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityLog.map((e) => (
                <div key={e.id} className="space-y-1 text-sm">
                  <p className="text-foreground">
                    • {translateActivityLogMessage(e.message, locale)}
                  </p>
                  <p className="text-left text-xs tabular-nums text-muted-foreground">
                    {formatLocaleDateTime(e.at, locale)}
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
            <AlertDialogTitle>
              {p.riskDetail.deleteTitle.replace('{code}', risk.code)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {p.riskDetail.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{p.registry.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeRisk(risk.id)
                toast.success(p.riskDetail.riskDeleted)
                router.push('/risks')
              }}
            >
              {p.riskDetail.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
