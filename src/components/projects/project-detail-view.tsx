'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
import { getSession, getUsers, type StoredUser } from '@/lib/auth-storage'
import { getProfileForUser } from '@/lib/user-profile-storage'
import type { ProjectMemberRecord, ProjectRecord } from '@/lib/project-types'
import {
  projectStatusBadgeClass,
  riskTableChipBase,
  statusBadgeClass
} from '@/lib/risk-badge-styles'
import { translateActivityLogMessage } from '@/lib/activity-log-i18n'
import { getPageCopy, type PageCopy } from '@/lib/page-copy'
import type { RiskRecord } from '@/lib/risk-types'
import { formatDisplayDate, formatLocaleDateTime } from '@/lib/risks-storage'
import { cn } from '@/lib/utils'

const listUiTextClass = 'text-sm font-normal'

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

function displayNameForMemberEmail(email: string) {
  const u = getUsers().find(
    (x) => x.email.toLowerCase() === email.trim().toLowerCase()
  )
  return u?.name ?? '—'
}

function ownerDisplayName(ownerUserId: string) {
  return getUsers().find((u) => u.id === ownerUserId)?.name ?? '—'
}

interface ProjectDetailViewProps {
  project: ProjectRecord
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const { risks } = useRisks()
  const {
    inviteToProject,
    listProjectMembers,
    refresh,
    accessibleProjectIds,
    deleteProject
  } = useProjects()

  const [members, setMembers] = useState<ProjectMemberRecord[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteRows, setInviteRows] = useState<string[]>([''])
  const [inviteSending, setInviteSending] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [profileMember, setProfileMember] = useState<ProjectMemberRecord | null>(
    null
  )

  const session = getSession()
  const canEdit =
    !project.isPublicLegacy &&
    session?.userId === project.ownerUserId

  const projectRisks = risks.filter((r) => r.projectId === project.id)
  const activityLog = [...project.activityLog].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at)
  )

  const loadMembers = useCallback(async () => {
    setMembers(await listProjectMembers(project.id))
  }, [listProjectMembers, project.id])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

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
        toast.message(p.projectDetail.noValidEmails)
      else
        toast.success(
          p.projectDetail.invitesSent.replace('{n}', String(res.sent))
        )
      setInviteOpen(false)
      setInviteRows([''])
      void loadMembers()
      void refresh()
    } finally {
      setInviteSending(false)
    }
  }

  if (!accessibleProjectIds.has(project.id)) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">{p.projectDetail.noAccess}</h1>
        <Button asChild>
          <Link href="/projects">{p.projectDetail.toProjects}</Link>
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
            {p.projectDetail.back}
          </Link>
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          {canEdit ? (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Pencil className="h-4 w-4" />
                {p.projectDetail.edit}
              </Link>
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" aria-label={p.projectDetail.more}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const id =
                    project.code && /^P-\d{3}$/.test(project.code)
                      ? project.code
                      : project.id
                  navigator.clipboard?.writeText(id)
                  toast.success(p.projectDetail.idCopied)
                }}
              >
                {p.projectDetail.copyId}
              </DropdownMenuItem>
              {canEdit ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {p.projectDetail.delete}
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
                  {project.code && /^P-\d{3}$/.test(project.code)
                    ? project.code
                    : project.id}
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
                  <Badge variant="secondary">{p.projectDetail.demo}</Badge>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  {p.projectDetail.description}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.description?.trim() || '—'}
                </p>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {metaOutlineTag(
                  <>
                    {p.projectDetail.owner}: {ownerDisplayName(project.ownerUserId)}
                  </>
                )}
                {metaOutlineTag(
                  <>
                    {p.projectDetail.created}{' '}
                    {formatDisplayDate(project.createdAt, locale)}
                  </>
                )}
                {metaOutlineTag(
                  <>
                    {p.projectDetail.updated}{' '}
                    {formatDisplayDate(project.updatedAt, locale)}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{p.projectDetail.risksTitle}</CardTitle>
              <Button variant="link" className="h-auto gap-1 p-0" asChild>
                <Link href={`/risks/new?projectId=${encodeURIComponent(project.id)}`}>
                  <Plus className="h-4 w-4" />
                  {p.projectDetail.add}
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">{p.registry.colId}</TableHead>
                      <TableHead>{p.projectDetail.riskName}</TableHead>
                      <TableHead className="whitespace-nowrap">
                        {p.projectDetail.riskCategory}
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        {p.projectDetail.riskStatus}
                      </TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">{p.registry.actionsSr}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectRisks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-muted-foreground"
                        >
                          {p.projectDetail.noRisks}
                        </TableCell>
                      </TableRow>
                    ) : (
                      projectRisks.map((r) => (
                        <ProjectRiskRow key={r.id} risk={r} router={router} page={p} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{p.projectDetail.members}</CardTitle>
              {!project.isPublicLegacy ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto gap-1 p-0"
                  onClick={() => setInviteOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {p.projectDetail.invite}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{p.projectDetail.name}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">{p.registry.actionsSr}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-muted-foreground"
                        >
                          {p.projectDetail.noMembers}
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((m) => (
                        <TableRow
                          key={m.id}
                          className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          tabIndex={0}
                          onClick={() => setProfileMember(m)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setProfileMember(m)
                            }
                          }}
                        >
                          <TableCell className="text-sm">
                            {displayNameForMemberEmail(m.email)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.email}
                          </TableCell>
                          <TableCell
                            className="whitespace-nowrap text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              title={p.registry.show}
                              aria-label={p.registry.show}
                              onClick={() => setProfileMember(m)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
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
            <CardHeader>
              <CardTitle className="text-base">{p.projectDetail.activity}</CardTitle>
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

      <MemberProfileDialog
        member={profileMember}
        page={p}
        onOpenChange={(open) => {
          if (!open) setProfileMember(null)
        }}
      />

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{p.projectDetail.inviteTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-0">{p.projectDetail.inviteEmail}</Label>
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
            </div>
            {inviteRows.slice(1).map((row, idx) => (
              <Input
                key={idx + 1}
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
                aria-label={`${p.projectDetail.inviteEmail} ${idx + 2}`}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleAddInviteRow}
            >
              <Plus className="h-4 w-4" />
              {p.projectDetail.addAnotherEmail}
            </Button>
            <p className="text-sm text-muted-foreground">
              {p.projectDetail.inviteHint}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInviteOpen(false)}
            >
              {p.projectDetail.cancel}
            </Button>
            <Button
              type="button"
              disabled={inviteSending}
              className="gap-2"
              onClick={() => void handleSendInvites()}
            >
              <Send className="h-4 w-4" />
              {p.projectDetail.sendInvite}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{p.projectDetail.deleteProjectTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {p.projectDetail.deleteProjectDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{p.projectDetail.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const res = await deleteProject(project.id)
                if (!res.ok) {
                  toast.error(res.error)
                  return
                }
                toast.success(p.projectDetail.projectDeleted)
                router.push('/projects')
              }}
            >
              {p.projectDetail.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

function ProjectRiskRow({
  risk,
  router,
  page
}: {
  risk: RiskRecord
  router: ReturnType<typeof useRouter>
  page: PageCopy
}) {
  const go = () => router.push(`/risks/${risk.id}`)
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          go()
        }
      }}
    >
      <TableCell className="whitespace-nowrap font-medium">{risk.code}</TableCell>
      <TableCell className="font-medium">{risk.name}</TableCell>
      <TableCell>
        <Badge variant="secondary">{risk.category}</Badge>
      </TableCell>
      <TableCell>
        <span
          className={cn(riskTableChipBase, statusBadgeClass(risk.status))}
        >
          {risk.status}
        </span>
      </TableCell>
      <TableCell
        className="whitespace-nowrap text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          size="icon"
          variant="ghost"
          title={page.registry.show}
          aria-label={page.registry.show}
          onClick={go}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

function MemberProfileDialog({
  member,
  page,
  onOpenChange
}: {
  member: ProjectMemberRecord | null
  page: PageCopy
  onOpenChange: (open: boolean) => void
}) {
  const open = member !== null
  const userId = member?.userId
  const user: StoredUser | undefined = userId
    ? getUsers().find((u) => u.id === userId)
    : undefined
  const profile = userId ? getProfileForUser(userId) : null

  const firstName = profile?.firstName?.trim() || ''
  const lastName = profile?.lastName?.trim() || ''
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.name ||
    member?.email ||
    '—'
  const emailShown = user?.email ?? member?.email ?? '—'
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{page.projectDetail.memberDialog}</DialogTitle>
        </DialogHeader>
        {member && profile ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatarDataUrl ?? ''} alt="" />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{emailShown}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {page.settingsProfile.firstName}
                </p>
                <p className="mt-0.5">{firstName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {page.settingsProfile.lastName}
                </p>
                <p className="mt-0.5">{lastName || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {page.projectDetail.workplace}
                </p>
                <p className="mt-0.5">{profile.workplace?.trim() || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {page.projectDetail.department}
                </p>
                <p className="mt-0.5">{profile.department?.trim() || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {page.projectDetail.position}
                </p>
                <p className="mt-0.5">{profile.position?.trim() || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {page.projectDetail.about}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap">
                  {profile.about?.trim() || '—'}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
