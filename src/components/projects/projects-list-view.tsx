'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'

import { formatDisplayDate } from '@/lib/risks-storage'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useProjects } from '@/contexts/projects-context'

function formatRuDateTime(d: Date) {
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function ProjectsListView() {
  const { myProjects, refresh, memberCount, ready } = useProjects()
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [counts, setCounts] = useState<Record<string, number>>({})

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm text-muted-foreground">
            Последнее обновление:{' '}
          </span>
          <span className="text-sm font-medium text-foreground">
            {formatRuDateTime(lastUpdated)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              void refresh()
              setLastUpdated(new Date())
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </Button>
        </div>
        <Button className="gap-2 sm:ml-auto" asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            Новый проект
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">Проекты</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead className="whitespace-nowrap">Создан</TableHead>
                  <TableHead className="whitespace-nowrap">Участники</TableHead>
                  <TableHead className="whitespace-nowrap">Тип</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!ready ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Загрузка…
                    </TableCell>
                  </TableRow>
                ) : myProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Нет проектов. Создайте первый проект, чтобы вести риски в его
                      рамках.
                    </TableCell>
                  </TableRow>
                ) : (
                  myProjects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDisplayDate(p.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {counts[p.id] ?? '—'}
                      </TableCell>
                      <TableCell>
                        {p.isPublicLegacy ? (
                          <Badge variant="secondary">Демо</Badge>
                        ) : (
                          <Badge variant="outline">Команда</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {ready && (
            <div className="px-4 py-4 text-sm md:px-6">
              <span className="text-muted-foreground">Всего: </span>
              <span className="text-foreground">{myProjects.length}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
