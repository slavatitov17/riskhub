'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useChat } from 'ai/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLocale } from '@/contexts/locale-context'
import { getPageCopy } from '@/lib/page-copy'
import { cn } from '@/lib/utils'

export function AiAssistantDock() {
  const { locale } = useLocale()
  const p = getPageCopy(locale)
  const panelId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/ai/chat',
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
      if (!isLoading) handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
    }
  }

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
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="mr-auto flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  <span>Думаю…</span>
                </div>
              )}
            </div>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-border bg-card p-3"
            >
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
                    disabled={!input.trim()}
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
