'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/app-toast'
import { cn } from '@/lib/utils'

const TAGS = ['Неточный ответ', 'Долгое ожидание', 'Другое'] as const

interface Props {
  open: boolean
  onClose: () => void
}

export function DislikeFeedbackDialog({ open, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [text, setText] = useState('')

  const toggle = (tag: string) =>
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )

  const handleSubmit = () => {
    toast.neutral('Благодарим за обратную связь')
    setText('')
    setSelected([])
    onClose()
  }

  const handleCancel = () => {
    setText('')
    setSelected([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Что вас не устроило в ответе?</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 pt-1">
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                selected.includes(tag)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Введите сообщение..."
          rows={4}
          className="resize-none"
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
