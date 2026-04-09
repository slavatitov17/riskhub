'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { toast } from '@/lib/app-toast'

import { SearchableCategoryField } from '@/components/forms/searchable-category-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/contexts/projects-context'
import { saveCustomCategory } from '@/lib/custom-categories-storage'

export function ProjectFormView() {
  const router = useRouter()
  const { createProject } = useProjects()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [inviteRows, setInviteRows] = useState<string[]>([''])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await createProject({
        name,
        category,
        description,
        inviteEmails: inviteRows
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      saveCustomCategory('project', category)
      toast.success('Проект создан')
      router.push('/projects')
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
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">Название проекта</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, внедрение CRM"
                required
              />
            </div>
            <SearchableCategoryField
              value={category}
              onChange={setCategory}
              kind="project"
              id="project-category"
            />
            <div className="space-y-2">
              <Label htmlFor="project-desc">Описание проекта</Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Кратко опишите цели и контекст проекта…"
              />
            </div>
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
                  aria-label={`Email приглашения ${idx + 2}`}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setInviteRows((r) => [...r, ''])}
              >
                <Plus className="h-4 w-4" />
                Указать еще
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Пользователь увидит приглашение после входа в систему RiskHub.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Link>
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                <Plus className="h-4 w-4" />
                Создать
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
