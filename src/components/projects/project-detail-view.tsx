'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, Plus, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
import { getSession, getUsers } from '@/lib/auth-storage'
import type { ProjectMemberRecord, ProjectRecord, ProjectStatus } from '@/lib/project-types'
import {
  projectStatusBadgeClass,
  riskTableChipBase,
  statusBadgeClass
} from '@/lib/risk-badge-styles'
import type { RiskRecord } from '@/lib/risk-types'
import { formatDisplayDate } from '@/lib/risks-storage'
import { cn } from '@/lib/utils'

const listUiTextClass = 'text-sm font-normal'

function displayNameForMemberEmail(email: string) {
  const u = getUsers().find(
    (x) => x.email.toLowerCase() === email.trim().toLowerCase()
  )
  return u?.name ?? '—'
}

interface ProjectDetailViewProps {
  project: ProjectRecord
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const router = useRouter()
  const { risks } = useRisks()
  const {
    updateProject,
    inviteToProject,
    listProjectMembers,
    refresh,
    accessibleProjectIds
  } = useProjects()

  const [members, setMembers] = useState<ProjectMemberRecord[]>([])
  const [descDraft, setDescDraft] = useState(project.description)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteRows, setInviteRows] = useState<string[]>([''])
  const [inviteSending, setInviteSending] = useState(false)

  const session = getSession()
  const canEdit =
    !project.isPublicLegacy &&
    session?.userId === project.ownerUserId

  const projectRisks = risks.filter((r) => r.projectId === project.id)

  const loadMembers = useCallback(async () => {
    setMembers(await listProjectMembers(project.id))
  }, [listProjectMembers, project.id])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  useEffect(() => {
    setDescDraft(project.description)
  }, [project.description])

  const handleSaveDescription = async () => {
    if (!canEdit) return
    const res = await updateProject(project.id, { description: descDraft })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Описание сохранено')
    void refresh()
  }

  const handleStatusChange = async (status: ProjectStatus) => {
    if (!canEdit) return
    const res = await updateProject(project.id, { status })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Статус обновлён')
    void refresh()
  }

  const handleAddInviteRow = () => setInviteRows((r) => [...r, ''])

  const handleSendInvites = async () => {
    setInviteSending(true)
    try {
      const res = await inviteToProject(project.id, inviteRows)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      if (res.sent === 0)
        toast.message('Нет корректных адресов для приглашения')
      else toast.success(`Отправлено приглашений: ${res.sent}`)
      setInviteOpen(false)
      setInviteRows([''])
      void loadMembers()
    } finally {
      setInviteSending(false)
    }
  }

  if (!accessibleProjectIds.has(project.id)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Нет доступа</h1>
        <Button asChild>
          <Link href="/projects">К проектам</Link>
        </Button>
      </div>
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
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn('font-mono text-foreground', listUiTextClass)}>
                  {project.id}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5',
                    listUiTextClass,
                    projectStatusBadgeClass(project.status)
                  )}
                >
                  {project.status}
                </span>
              </div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              {project.isPublicLegacy ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Демо</Badge>
                </div>
              ) : null}
              {canEdit ? (
                <div className="max-w-xs space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Изменить статус
                  </Label>
                  <Select
                    value={project.status}
                    onValueChange={(v) =>
                      void handleStatusChange(v as ProjectStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Активен">Активен</SelectItem>
                      <SelectItem value="Завершен">Завершен</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Описание проекта
                </p>
                {canEdit ? (
                  <div className="space-y-2">
                    <Textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      rows={4}
                      placeholder="Кратко опишите цели и контекст проекта…"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleSaveDescription()}
                    >
                      Сохранить описание
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {project.description?.trim() || '—'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Риски по проекту</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">ID</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead className="whitespace-nowrap">Категория</TableHead>
                      <TableHead className="whitespace-nowrap">Статус</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectRisks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-muted-foreground"
                        >
                          В этом проекте пока нет рисков.
                        </TableCell>
                      </TableRow>
                    ) : (
                      projectRisks.map((r) => (
                        <ProjectRiskRow key={r.id} risk={r} router={router} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Участники</CardTitle>
              {!project.isPublicLegacy ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1"
                  onClick={() => setInviteOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Пригласить
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-muted-foreground">
                        Нет участников
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">
                          {displayNameForMemberEmail(m.email)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.email}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Пригласить в проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-0">Email для приглашения</Label>
              <Input
                id="invite-0"
                type="email"
                value={inviteRows[0] ?? ''}
                onChange={(e) =>
                  setInviteRows((rows) => {
                    const next = [...rows]
                    next[0] = e.target.value
                    return next
                  })
                }
                placeholder="colleague@example.com"
                autoComplete="email"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleAddInviteRow}
              >
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </div>
            {inviteRows.slice(1).map((row, idx) => (
              <div key={idx + 1} className="space-y-2">
                <Label htmlFor={`invite-${idx + 1}`}>Email для приглашения</Label>
                <Input
                  id={`invite-${idx + 1}`}
                  type="email"
                  value={row}
                  onChange={(e) =>
                    setInviteRows((rows) => {
                      const next = [...rows]
                      next[idx + 1] = e.target.value
                      return next
                    })
                  }
                  placeholder="colleague@example.com"
                  autoComplete="email"
                />
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Пользователь увидит приглашение после входа в систему RiskHub.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              disabled={inviteSending}
              className="gap-2"
              onClick={() => void handleSendInvites()}
            >
              <Send className="h-4 w-4" />
              Отправить приглашение
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function ProjectRiskRow({
  risk,
  router
}: {
  risk: RiskRecord
  router: ReturnType<typeof useRouter>
}) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-medium">{risk.code}</TableCell>
      <TableCell className="font-medium">{risk.name}</TableCell>
      <TableCell>
        <Badge variant="secondary">{risk.category}</Badge>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            riskTableChipBase,
            statusBadgeClass(risk.status)
          )}
        >
          {risk.status}
        </span>
      </TableCell>
      <TableCell>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Открыть риск"
          onClick={() => router.push(`/risks/${risk.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
