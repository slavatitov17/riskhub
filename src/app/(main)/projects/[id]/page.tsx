'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { ProjectDetailView } from '@/components/projects/project-detail-view'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/contexts/projects-context'

export default function ProjectDetailPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''
  const { getProjectById, ready } = useProjects()
  const project = id ? getProjectById(id) : undefined

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg py-8 text-center text-muted-foreground">
        Загрузка…
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Проект не найден</h1>
        <p className="text-sm text-muted-foreground">
          Возможно, проект удалён или ссылка устарела.
        </p>
        <Button asChild>
          <Link href="/projects">К проектам</Link>
        </Button>
      </div>
    )
  }

  return <ProjectDetailView project={project} />
}
