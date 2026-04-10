'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, X } from 'lucide-react'
import { toast } from '@/lib/app-toast'

import { ProjectDocumentationField } from '@/components/forms/project-documentation-field'
import { SearchableCategoryField } from '@/components/forms/searchable-category-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useProjects } from '@/contexts/projects-context'
import { saveCustomCategory } from '@/lib/custom-categories-storage'
import type {
  ProjectDocumentationFile,
  ProjectRecord,
  ProjectStatus
} from '@/lib/project-types'
import { getPageCopy } from '@/lib/page-copy'
import { useLocale } from '@/contexts/locale-context'

interface ProjectEditFormViewProps {
  project: ProjectRecord
}

export function ProjectEditFormView({ project }: ProjectEditFormViewProps) {
  const router = useRouter()
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const { updateProject } = useProjects()
  const [name, setName] = useState(project.name)
  const [category, setCategory] = useState(project.category ?? '')
  const [description, setDescription] = useState(project.description)
  const [documentationFiles, setDocumentationFiles] = useState<
    ProjectDocumentationFile[]
  >(project.documentationFiles ?? [])
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await updateProject(project.id, {
        name: name.trim(),
        category: category.trim(),
        description,
        status,
        documentationFiles
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      saveCustomCategory('project', category)
      toast.success('Изменения сохранены')
      router.push(`/projects/${project.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl"
    >
      <Card>
        <CardHeader>
          <CardTitle>Редактирование проекта</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">Название проекта</Label>
              <Input
                id="edit-project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <SearchableCategoryField
              value={category}
              onChange={setCategory}
              kind="project"
              id="edit-project-category"
            />
            <div className="space-y-2">
              <Label htmlFor="edit-project-desc">Описание проекта</Label>
              <Textarea
                id="edit-project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Кратко опишите цели и контекст проекта…"
              />
            </div>
            <ProjectDocumentationField
              id="edit-project-documentation"
              files={documentationFiles}
              onChange={setDocumentationFiles}
              labels={{
                label: p.projectForm.documentationLabel,
                dropPrimary: p.projectForm.documentationDrop,
                dropOr: p.projectForm.documentationOr,
                browse: p.projectForm.documentationBrowse,
                uploaded: p.projectForm.documentationUploaded,
                remove: p.projectForm.documentationRemove,
                tooLarge: p.projectForm.documentationTooLarge,
                maxFiles: p.projectForm.documentationMaxFiles
              }}
            />
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProjectStatus)}
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
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href={`/projects/${project.id}`}>
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Link>
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
