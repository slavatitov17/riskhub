'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

import { ProfilePhotoCropDialog } from '@/components/settings/profile-photo-crop-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/contexts/locale-context'
import { getSession } from '@/lib/auth-storage'
import { getPageCopy } from '@/lib/page-copy'
import {
  getProfileForUser,
  saveProfileForUser
} from '@/lib/user-profile-storage'

export function SettingsView() {
  const router = useRouter()
  const { locale } = useLocale()
  const p = getPageCopy(locale)
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
          <CardTitle className="text-base">{p.settingsProfile.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarDataUrl ?? ''} alt="" />
              <AvatarFallback className="text-lg">{displayInitials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="font-medium">
                {[firstName, lastName].filter(Boolean).join(' ') ||
                  p.settingsProfile.userFallback}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setCropOpen(true)}
              >
                {p.settingsProfile.changePhoto}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-first">{p.settingsProfile.firstName}</Label>
              <Input
                id="profile-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={p.settingsProfile.firstPlaceholder}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last">{p.settingsProfile.lastName}</Label>
              <Input
                id="profile-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={p.settingsProfile.lastPlaceholder}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" value={email} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-workplace">{p.settingsProfile.workplace}</Label>
            <Input
              id="profile-workplace"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-department">{p.settingsProfile.department}</Label>
            <Input
              id="profile-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-position">{p.settingsProfile.position}</Label>
            <Input
              id="profile-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-about">{p.settingsProfile.about}</Label>
            <Textarea
              id="profile-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
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
