'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Paperclip, Send, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/contexts/locale-context'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import { getPageCopy } from '@/lib/page-copy'
import { cn } from '@/lib/utils'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  attachments?: string[]
  at: string
}

export function AiAssistantDock() {
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const { myProjects } = useProjects()
  const { risks } = useRisks()
  const panelId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [open, messages])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text && attachments.length === 0) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      attachments: attachments.map((file) => file.name),
      at: new Date().toISOString()
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setAttachments([])
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: p.aiAssistant.modelPending,
          at: new Date().toISOString()
        }
      ])
    }, 400)
  }, [attachments, input, p.aiAssistant.attach, p.aiAssistant.modelPending])

  const handleAttachFiles = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files
      if (!selectedFiles?.length) return
      setAttachments((prev) => {
        const currentNames = new Set(prev.map((file) => file.name))
        const nextFiles = [...prev]
        for (const file of Array.from(selectedFiles)) {
          if (currentNames.has(file.name)) continue
          nextFiles.push(file)
          currentNames.add(file.name)
        }
        return nextFiles
      })
      event.target.value = ''
    },
    []
  )

  const handleRemoveAttachment = useCallback((fileName: string) => {
    setAttachments((prev) => prev.filter((file) => file.name !== fileName))
  }, [])

  const hint = p.aiAssistant.hint
    .replace('{projects}', String(myProjects.length))
    .replace('{risks}', String(risks.length))

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            id={panelId}
            role="dialog"
            aria-label={p.aiAssistant.title}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="pointer-events-auto flex max-h-[min(520px,72vh)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
              <Sparkles className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.aiAssistant.title}</p>
                <p className="truncate text-xs opacity-90">{p.aiAssistant.subtitle}</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25"
                aria-label={p.aiAssistant.close}
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div
              ref={listRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4"
            >
              {messages.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : 'mr-auto border border-border bg-background text-foreground'
                    )}
                  >
                    {msg.text ? <p>{msg.text}</p> : null}
                    {msg.attachments?.length ? (
                      <div className={cn('space-y-1.5', msg.text ? 'mt-2' : '')}>
                        {msg.attachments.map((name) => (
                          <div
                            key={`${msg.id}-${name}`}
                            className={cn(
                              'flex items-center gap-2 rounded-md px-2 py-1.5',
                              msg.role === 'user'
                                ? 'bg-primary-foreground/15'
                                : 'border border-border bg-muted/20'
                            )}
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="min-w-0 truncate text-xs">{name}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border bg-card p-3">
              <input
                ref={attachmentInputRef}
                type="file"
                className="sr-only"
                multiple
                onChange={handleAttachFiles}
              />
              {attachments.length > 0 ? (
                <div className="mb-2 space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    {p.aiAssistant.attachedFiles}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {attachments.map((file) => (
                      <button
                        key={file.name}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-1 text-xs"
                        onClick={() => handleRemoveAttachment(file.name)}
                        aria-label={`${file.name}: ${p.aiAssistant.close}`}
                      >
                        {file.name}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={p.aiAssistant.placeholder}
                  rows={2}
                  className="min-h-[44px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 shrink-0 self-end rounded-full"
                  aria-label={p.aiAssistant.attach}
                  onClick={() => attachmentInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  className="h-11 w-11 shrink-0 self-end rounded-full"
                  aria-label={p.aiAssistant.send}
                  onClick={() => handleSend()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        type="button"
        size="icon"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={p.aiAssistant.fabAria}
        className="pointer-events-auto h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Sparkles className="h-7 w-7" />
        )}
      </Button>
    </div>
  )
}
