'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { ProjectEditFormView } from '@/components/projects/project-edit-form-view'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/contexts/projects-context'
import { getSession } from '@/lib/auth-storage'

export default function EditProjectPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''
  const { getProjectById, ready } = useProjects()
  const project = id ? getProjectById(id) : undefined
  const session = getSession()

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
        <Button asChild>
          <Link href="/projects">К проектам</Link>
        </Button>
      </div>
    )
  }

  if (
    project.isPublicLegacy ||
    !session ||
    project.ownerUserId !== session.userId
  ) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold">Нет доступа</h1>
        <Button asChild>
          <Link href={`/projects/${project.id}`}>К карточке проекта</Link>
        </Button>
      </div>
    )
  }

  return <ProjectEditFormView project={project} />
}
