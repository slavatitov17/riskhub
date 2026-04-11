'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Paperclip, Send, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/contexts/locale-context'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import { getPageCopy } from '@/lib/page-copy'
import { cn } from '@/lib/utils'
import { MarkdownContent } from './markdown-content'

interface AttachedFile {
  name: string
  size: number
  type: string
}

interface DockMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: AttachedFile[]
}

export function AiAssistantDock() {
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const panelId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<AttachedFile[]>([])
  const [msgAttachments, setMsgAttachments] = useState<Record<string, AttachedFile[]>>({})

  const { myProjects } = useProjects()
  const { risks } = useRisks()

  const context = useMemo(
    () => ({
      projects: myProjects.map((pr) => ({
        code: pr.code,
        name: pr.name,
        status: pr.status,
        category: pr.category
      })),
      risks: risks.map((r) => ({
        code: r.code,
        name: r.name,
        category: r.category,
        probability: r.probability,
        impact: r.impact,
        status: r.status
      }))
    }),
    [myProjects, risks]
  )

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, append } = useChat({
    api: '/api/ai/chat',
    body: { context },
    onError: () => {
      toast.error('Не удалось получить ответ от ИИ. Проверьте подключение или попробуйте позже.')
    }
  })

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [open, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading) handleSendWithFiles(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

  const handleSendWithFiles = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (pendingFiles.length > 0) {
        const msgId = crypto.randomUUID()
        setMsgAttachments((prev) => ({ ...prev, [msgId]: pendingFiles }))
        void append({ id: msgId, role: 'user', content: input } as Parameters<typeof append>[0])
        setPendingFiles([])
        return
      }
      handleSubmit(e)
    },
    [pendingFiles, input, append, handleSubmit]
  )

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setPendingFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...files.filter((f) => !existing.has(f.name)).map((f) => ({ name: f.name, size: f.size, type: f.type }))]
    })
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      <AnimatePresence initial={false}>
        {open && (
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
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
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

            {/* Messages */}
            <div
              ref={listRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4"
            >
              {messages.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {p.aiAssistant.hint}
                </p>
              ) : (
                messages.map((msg) => {
                  const attachments = msgAttachments[msg.id] ?? []
                  return (
                    <div key={msg.id}>
                      <div
                        className={cn(
                          'max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                          msg.role === 'user'
                            ? 'ml-auto bg-primary text-primary-foreground'
                            : 'mr-auto border border-border bg-background text-foreground'
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <MarkdownContent content={msg.content} />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {attachments.length > 0 && (
                          <div className={cn('mt-2 space-y-1', !msg.content && 'mt-0')}>
                            {attachments.map((f) => (
                              <div
                                key={f.name}
                                className={cn(
                                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                                  msg.role === 'user'
                                    ? 'bg-primary-foreground/15'
                                    : 'border border-border bg-muted/20'
                                )}
                              >
                                <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                                <span className="min-w-0 truncate">{f.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              {isLoading && (
                <div className="mr-auto flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  <span>Думаю…</span>
                </div>
              )}
            </div>

            {/* Pending files preview */}
            {pendingFiles.length > 0 && (
              <div className="shrink-0 border-t border-border bg-muted/30 px-3 py-2">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Прикреплённые файлы
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pendingFiles.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() =>
                        setPendingFiles((prev) => prev.filter((x) => x.name !== f.name))
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="max-w-[140px] truncate">{f.name}</span>
                      <X className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <form
              onSubmit={handleSendWithFiles}
              className="shrink-0 border-t border-border bg-card p-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={handleFileSelect}
              />
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={p.aiAssistant.placeholder}
                  rows={2}
                  className="min-h-[44px] resize-none"
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 shrink-0 self-end rounded-full"
                  aria-label="Прикрепить файл"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                {isLoading ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 shrink-0 self-end rounded-full"
                    aria-label="Остановить"
                    onClick={stop}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-11 w-11 shrink-0 self-end rounded-full"
                    aria-label={p.aiAssistant.send}
                    disabled={!input.trim() && pendingFiles.length === 0}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        )}
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
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-12 w-12 text-white" />}
      </Button>
    </div>
  )
}
