'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { ProfilePhotoCropDialog } from '@/components/settings/profile-photo-crop-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getSession } from '@/lib/auth-storage'
import {
  getProfileForUser,
  saveProfileForUser
} from '@/lib/user-profile-storage'

export function SettingsView() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [workplace, setWorkplace] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [about, setAbout] = useState('')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const skipSaveRef = useRef(true)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.replace('/')
      return
    }
    setUserId(s.userId)
    setEmail(s.email)
    const p = getProfileForUser(s.userId)
    setFirstName(p.firstName)
    setLastName(p.lastName)
    setWorkplace(p.workplace)
    setDepartment(p.department)
    setPosition(p.position)
    setAbout(p.about)
    setAvatarDataUrl(p.avatarDataUrl)
    skipSaveRef.current = true
    setHydrated(true)
  }, [router])

  useEffect(() => {
    if (!hydrated || !userId) return
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    const t = window.setTimeout(() => {
      saveProfileForUser(userId, {
        firstName,
        lastName,
        workplace,
        department,
        position,
        about
      })
    }, 450)
    return () => window.clearTimeout(t)
  }, [
    hydrated,
    userId,
    firstName,
    lastName,
    workplace,
    department,
    position,
    about
  ])

  const displayInitials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'RH'

  const handleAvatarSaved = (dataUrl: string) => {
    setAvatarDataUrl(dataUrl)
    if (userId) saveProfileForUser(userId, { avatarDataUrl: dataUrl })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ваш профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarDataUrl ?? ''} alt="" />
              <AvatarFallback className="text-lg">{displayInitials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">
                  {[firstName, lastName].filter(Boolean).join(' ') || 'Пользователь'}
                </p>
                <Badge variant="secondary">Менеджер</Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setCropOpen(true)}
              >
                Изменить фото
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-first">Имя</Label>
              <Input
                id="profile-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Иван"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last">Фамилия</Label>
              <Input
                id="profile-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванов"
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" value={email} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-workplace">Место работы</Label>
            <Input
              id="profile-workplace"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              placeholder="Компания или организация"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-department">Отдел</Label>
            <Input
              id="profile-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-position">Должность</Label>
            <Input
              id="profile-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-about">О себе</Label>
            <Textarea
              id="profile-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Кратко о себе…"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <ProfilePhotoCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        onSave={handleAvatarSaved}
      />
    </motion.div>
  )
}
