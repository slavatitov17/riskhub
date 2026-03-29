'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'

import { ProjectsRegistryTable } from '@/components/projects/projects-registry-table'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/contexts/locale-context'
import { useProjects } from '@/contexts/projects-context'
import { getPageCopy } from '@/lib/page-copy'
import { formatLocaleDateTime } from '@/lib/risks-storage'

export function ProjectsListView() {
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const { refresh } = useProjects()
  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-7xl flex-col gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm text-muted-foreground">{p.lastUpdated} </span>
          <span className="text-sm font-medium text-foreground">
            {formatLocaleDateTime(lastUpdated.toISOString(), locale)}
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
            {p.refresh}
          </Button>
        </div>
        <Button className="gap-2 sm:ml-auto" asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            {p.projectsList.newProject}
          </Link>
        </Button>
      </div>

      <ProjectsRegistryTable />
    </motion.div>
  )
}
