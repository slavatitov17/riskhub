'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — higher than AiChatModal (z-91) */}
          <motion.div
            key="dislike-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50"
            onClick={handleCancel}
          />

          {/* Panel */}
          <motion.div
            key="dislike-panel"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <h2 className="mb-4 text-center text-base font-semibold">
              Что вас не устроило в ответе?
            </h2>

            <div className="flex flex-wrap gap-2">
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
              className="mt-4 resize-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Отмена
              </Button>
              <Button type="button" onClick={handleSubmit}>
                Отправить
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
