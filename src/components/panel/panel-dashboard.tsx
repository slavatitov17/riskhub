'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Flame, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectsRegistryTable } from '@/components/projects/projects-registry-table'
import { RisksRegistryTable } from '@/components/risks/risks-registry-table'
import { useNotifications } from '@/contexts/notifications-context'
import { useVisibleRisks } from '@/hooks/use-visible-risks'
import { formatDisplayDate } from '@/lib/risks-storage'

export function PanelDashboard() {
  const router = useRouter()
  const risks = useVisibleRisks()
  const { openNotifications, notifications } = useNotifications()

  const activeCount = risks.filter((r) => r.status === 'Активный').length
  const closedCount = risks.filter((r) => r.status === 'Закрыт').length
  const criticalCount = risks.filter(
    (r) => r.impact === 'Высокое' && r.probability === 'Высокая'
  ).length

  const recentRisks = risks.slice(0, 3)
  const unreadNotifications = notifications.filter((n) => !n.isRead)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto flex max-w-7xl flex-col gap-6"
    >
      <section className="grid gap-4 lg:grid-cols-[1fr_minmax(0,280px)] lg:items-stretch">
        <div className="grid h-full gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="shadow-sm h-full">
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-5 w-5" aria-hidden />
              </div>
              <div className="mt-auto flex items-end justify-between gap-3">
                <div className="min-w-0 text-left">
                  <p className="text-4xl font-bold leading-none">{activeCount}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Активных рисков</p>
                </div>
                <Button variant="outline" size="icon" className="mt-3 h-8 w-8" asChild>
                  <Link href="/risks" aria-label="Открыть список рисков">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm h-full">
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </div>
              <div className="mt-auto flex items-end justify-between gap-3">
                <div className="min-w-0 text-left">
                  <p className="text-4xl font-bold leading-none">{closedCount}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Закрытых рисков</p>
                </div>
                <Button variant="outline" size="icon" className="mt-3 h-8 w-8" asChild>
                  <Link href="/risks" aria-label="Открыть список рисков">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm h-full sm:col-span-2 xl:col-span-1">
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                <Flame className="h-5 w-5" aria-hidden />
              </div>
              <div className="mt-auto flex items-end justify-between gap-3">
                <div className="min-w-0 text-left">
                  <p className="text-4xl font-bold leading-none">{criticalCount}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Критических рисков</p>
                </div>
                <Button variant="outline" size="icon" className="mt-3 h-8 w-8" asChild>
                  <Link href="/risks" aria-label="Открыть список рисков">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm flex h-full min-h-[220px] flex-col lg:sticky lg:top-4">
          <CardHeader className="shrink-0 pb-2 pt-4">
            <CardTitle className="text-base">Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pb-4 pt-0">
            <div className="min-h-4 flex-1" aria-hidden />
            <div className="flex flex-col gap-2">
              <Button className="w-full justify-center" asChild>
                <Link href="/risks/new">Добавить риск</Link>
              </Button>
              <Button variant="outline" className="w-full justify-center" asChild>
                <Link href="/projects/new">Добавить проект</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">
              Последние добавленные риски
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/risks">
                Все риски
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentRisks.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {recentRisks.map((risk) => (
                  <li key={risk.id}>
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
                      onClick={() => router.push(`/risks/${risk.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium leading-tight">{risk.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {risk.category} · {formatDisplayDate(risk.created)}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {risk.status}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-4 py-8 text-center opacity-60">
                <p className="text-sm font-semibold text-foreground">
                  Пока нет рисков
                </p>
                <p className="max-w-xs text-sm text-foreground">
                  Добавьте риск в реестре — он появится в этом списке.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Уведомления</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              type="button"
              onClick={openNotifications}
            >
              Все уведомления
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {unreadNotifications.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {unreadNotifications.map((n) => (
                  <li key={n.id} className="flex gap-3 rounded-lg border p-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.tone === 'destructive' ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{n.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{n.title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 px-4 py-8 text-center opacity-60">
                <p className="text-sm font-semibold text-foreground">
                  Нет новых уведомлений
                </p>
                <p className="max-w-xs text-sm text-foreground">
                  Здесь появятся непрочитанные сообщения.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <ProjectsRegistryTable />
      <RisksRegistryTable />
    </motion.div>
  )
}
