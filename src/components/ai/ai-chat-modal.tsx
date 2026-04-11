'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import type { Message } from 'ai'
import { useChat } from '@ai-sdk/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Copy,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/contexts/projects-context'
import { useRisks } from '@/contexts/risks-context'
import { readFileText } from '@/lib/ai-file-reader'
import { toast } from '@/lib/app-toast'
import type { ProjectRecord } from '@/lib/project-types'
import type { RiskRecord } from '@/lib/risk-types'
import { cn } from '@/lib/utils'
import { DislikeFeedbackDialog } from './dislike-feedback-dialog'
import { MarkdownContent } from './markdown-content'

/* ─────────────────────────── types ─────────────────────────── */

interface AttachedFile {
  name: string
  size: number
  type: string
  content?: string
}

interface StoredAttachment {
  name: string
  size: number
  type: string
}

interface FileContent {
  name: string
  content: string
}

interface MessageExtra {
  liked: boolean
  attachments: StoredAttachment[]
  fileContents: FileContent[]
}

interface Session {
  id: string
  label: string
  createdAt: Date
  messages: Message[]
}

/* ─────────────────────────── storage ───────────────────────── */

interface StoredMessage {
  id: string
  role: string
  content: string
  createdAt?: string
}

interface StoredSession {
  id: string
  label: string
  createdAt: string
  messages: StoredMessage[]
}

interface StoredData {
  sessions: StoredSession[]
  activeId: string
}

function storageKey(type: 'project' | 'risk', id: string): string {
  return `rh-ai-chat-${type}-${id}`
}

function loadSessions(type: 'project' | 'risk', id: string): { sessions: Session[]; activeId: string } {
  if (typeof window === 'undefined') {
    const s = makeSession(1, type)
    return { sessions: [s], activeId: s.id }
  }
  try {
    const raw = localStorage.getItem(storageKey(type, id))
    if (!raw) throw new Error('empty')
    const data = JSON.parse(raw) as StoredData
    if (!data.sessions?.length) throw new Error('invalid')
    const sessions: Session[] = data.sessions.map((s) => ({
      id: s.id,
      label: s.label,
      createdAt: new Date(s.createdAt),
      messages: s.messages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.createdAt ? new Date(m.createdAt) : undefined
      }))
    }))
    return { sessions, activeId: data.activeId }
  } catch {
    const s = makeSession(1, type)
    return { sessions: [s], activeId: s.id }
  }
}

function saveSessions(type: 'project' | 'risk', id: string, sessions: Session[], activeId: string): void {
  if (typeof window === 'undefined') return
  try {
    const data: StoredData = {
      sessions: sessions.map((s) => ({
        id: s.id,
        label: s.label,
        createdAt: s.createdAt.toISOString(),
        messages: s.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: (m.createdAt as Date | undefined)?.toISOString()
        }))
      })),
      activeId
    }
    localStorage.setItem(storageKey(type, id), JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

/* ─────────────────────────── helpers ───────────────────────── */

function formatTs(date?: Date): string {
  if (!date) return ''
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatSessionDate(date: Date): string {
  return date.toLocaleString('ru-RU', { day: '2-digit', month: 'short' })
}

function makeInitialMsg(type: 'project' | 'risk'): Message {
  return {
    id: 'init-' + crypto.randomUUID(),
    role: 'assistant',
    content:
      type === 'project'
        ? 'Информация о проекте проанализирована, можете задать свой первый вопрос'
        : 'Информация о риске проанализирована, можете задать свой первый вопрос',
    createdAt: new Date()
  }
}

function makeSession(n: number, type: 'project' | 'risk'): Session {
  return {
    id: crypto.randomUUID(),
    label: `Чат №${n}`,
    createdAt: new Date(),
    messages: [makeInitialMsg(type)]
  }
}

/* ─────────────────────────── ChatPanel ─────────────────────── */

interface ChatPanelProps {
  initialMessages: Message[]
  context: Record<string, unknown>
  onMessagesChange: (msgs: Message[]) => void
}

function ChatPanel({ initialMessages, context, onMessagesChange }: ChatPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<Message[]>(initialMessages)
  const onChangeRef = useRef(onMessagesChange)
  onChangeRef.current = onMessagesChange

  const [pendingFiles, setPendingFiles] = useState<AttachedFile[]>([])
  const [extras, setExtras] = useState<Record<string, MessageExtra>>({})
  const [dislikeTarget, setDislikeTarget] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const { messages, append, isLoading, reload, stop, setMessages } = useChat({
    api: '/api/ai/chat',
    body: { context },
    initialMessages,
    onError: () =>
      toast.error('Не удалось получить ответ от ИИ. Попробуйте позже.')
  })

  messagesRef.current = messages

  useEffect(() => {
    onChangeRef.current(messages)
  }, [messages])

  useEffect(() => {
    return () => {
      onChangeRef.current(messagesRef.current)
    }
  }, [])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  /* ── input ── */

  const [inputVal, setInputVal] = useState('')

  const handleSend = useCallback(async () => {
    const text = inputVal.trim()
    if (!text && pendingFiles.length === 0) return

    const msgId = crypto.randomUUID()

    const fileContents: FileContent[] = pendingFiles
      .filter((f) => f.content !== undefined)
      .map((f) => ({ name: f.name, content: f.content! }))

    const attachments: StoredAttachment[] = pendingFiles.map(({ name, size, type }) => ({
      name,
      size,
      type
    }))

    if (pendingFiles.length > 0) {
      setExtras((prev) => ({
        ...prev,
        [msgId]: { liked: false, attachments, fileContents }
      }))
    }

    await append(
      { id: msgId, role: 'user', content: text, createdAt: new Date() } as Message,
      fileContents.length > 0 ? { body: { fileContents } } : undefined
    )

    setInputVal('')
    setPendingFiles([])
  }, [inputVal, pendingFiles, append])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading) void handleSend()
    }
  }

  /* ── files ── */

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return

    const newFiles: AttachedFile[] = await Promise.all(
      files.map(async (f) => {
        const content = await readFileText(f)
        return { name: f.name, size: f.size, type: f.type, content: content ?? undefined }
      })
    )

    setPendingFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      return [...prev, ...newFiles.filter((f) => !existing.has(f.name))]
    })
  }, [])

  /* ── actions ── */

  const handleCopy = (content: string) => {
    void navigator.clipboard.writeText(content)
    toast.success('Сообщение скопировано')
  }

  const handleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        toast.success('Благодарим за обратную связь')
      }
      return next
    })
  }

  const handleRegenerate = (msgIndex: number) => {
    const upTo = messages.slice(0, msgIndex)
    setMessages(upTo)
    void reload()
  }

  const handleResend = (msg: Message) => {
    const extra = extras[msg.id]
    const attachments = extra?.attachments ?? []
    const fileContents = extra?.fileContents ?? []
    const newId = crypto.randomUUID()

    if (attachments.length > 0) {
      setExtras((prev) => ({
        ...prev,
        [newId]: { liked: false, attachments, fileContents }
      }))
    }

    void append(
      { id: newId, role: 'user', content: msg.content, createdAt: new Date() } as Message,
      fileContents.length > 0 ? { body: { fileContents } } : undefined
    )
  }

  /* ── render ── */

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Messages */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          const isAssistant = msg.role === 'assistant'
          const isInitial = msg.id.startsWith('init-')
          const attachments = extras[msg.id]?.attachments ?? []
          const isLiked = likedIds.has(msg.id)
          const showStreamingDots = isAssistant && isLoading && idx === messages.length - 1 && msg.content === ''

          return (
            <div key={msg.id} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
              {/* Timestamp */}
              {msg.createdAt && (
                <span className="mb-1 text-xs text-muted-foreground">
                  {formatTs(msg.createdAt)}
                </span>
              )}

              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-foreground'
                )}
              >
                {showStreamingDots ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : isAssistant ? (
                  <MarkdownContent content={msg.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {/* Attached files below text */}
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((f) => (
                      <div
                        key={f.name}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs',
                          isUser
                            ? 'bg-primary-foreground/15'
                            : 'border border-border bg-muted/30'
                        )}
                      >
                        <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="min-w-0 truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!showStreamingDots && (
                <div className="mt-1 flex items-center gap-1">
                  <button
                    type="button"
                    title="Копировать"
                    onClick={() => handleCopy(msg.content)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {isAssistant && !isInitial && (
                    <>
                      <motion.button
                        type="button"
                        title="Полезно"
                        whileTap={{ scale: 1.4 }}
                        onClick={() => handleLike(msg.id)}
                        className={cn(
                          'rounded p-1 transition-colors',
                          isLiked
                            ? 'text-green-600'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </motion.button>

                      <button
                        type="button"
                        title="Не понравилось"
                        onClick={() => setDislikeTarget(msg.id)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Повторить"
                        disabled={isLoading}
                        onClick={() => handleRegenerate(idx)}
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  {isUser && (
                    <button
                      type="button"
                      title="Повторить"
                      disabled={isLoading}
                      onClick={() => handleResend(msg)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Thinking indicator */}
        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-start">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>ИИ анализирует…</span>
            </div>
          </div>
        )}
      </div>

      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-2">
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

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3 md:px-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => { void handleFileSelect(e) }}
        />
        <div className="flex items-end gap-2">
          <Textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Задайте вопрос о проекте или рисках..."
            rows={2}
            className="min-h-[44px] flex-1 resize-none"
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
              type="button"
              size="icon"
              className="h-11 w-11 shrink-0 self-end rounded-full"
              aria-label="Отправить"
              disabled={!inputVal.trim() && pendingFiles.length === 0}
              onClick={() => { void handleSend() }}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Dislike dialog */}
      <DislikeFeedbackDialog
        open={dislikeTarget !== null}
        onClose={() => setDislikeTarget(null)}
      />
    </div>
  )
}

/* ─────────────────────────── AiChatModal ───────────────────── */

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  type: 'project'
  data: ProjectRecord
}

interface RiskModalProps {
  open: boolean
  onClose: () => void
  type: 'risk'
  data: RiskRecord
}

export type AiChatModalProps = ProjectModalProps | RiskModalProps

export function AiChatModal({ open, onClose, type, data }: AiChatModalProps) {
  const entityId = data.id

  const { myProjects } = useProjects()
  const { risks } = useRisks()

  const initialData = useRef(loadSessions(type, entityId))
  const [sessions, setSessions] = useState<Session[]>(initialData.current.sessions)
  const [activeId, setActiveId] = useState<string>(initialData.current.activeId)

  // Persist to localStorage on every change
  useEffect(() => {
    saveSessions(type, entityId, sessions, activeId)
  }, [type, entityId, sessions, activeId])

  // Build rich context with related data (project's risks, risk's project)
  const context = useMemo((): Record<string, unknown> => {
    if (type === 'project') {
      const pr = data as ProjectRecord
      const projectRisks = risks.filter((r) => r.projectId === pr.id)
      return {
        project: {
          code: pr.code,
          name: pr.name,
          description: pr.description ?? '',
          status: pr.status,
          category: pr.category,
          risks: projectRisks.map((r) => ({
            code: r.code,
            name: r.name,
            category: r.category,
            probability: r.probability,
            impact: r.impact,
            status: r.status,
            description: r.description ?? ''
          }))
        }
      }
    }

    const r = data as RiskRecord
    const relatedProject = myProjects.find((p) => p.id === r.projectId)
    return {
      risk: {
        code: r.code,
        name: r.name,
        description: r.description ?? '',
        category: r.category,
        probability: r.probability,
        impact: r.impact,
        status: r.status,
        project: relatedProject
          ? {
              code: relatedProject.code,
              name: relatedProject.name,
              status: relatedProject.status,
              category: relatedProject.category
            }
          : undefined
      }
    }
  }, [type, data, risks, myProjects])

  const title =
    type === 'project'
      ? `Анализ проекта: ${(data as ProjectRecord).name}`
      : `Анализ риска: ${(data as RiskRecord).name}`

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0]!

  const handleMessagesChange = useCallback(
    (msgs: Message[]) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === activeId ? { ...s, messages: msgs } : s))
      )
    },
    [activeId]
  )

  const handleNewSession = () => {
    const newSession = makeSession(sessions.length + 1, type)
    setSessions((prev) => [...prev, newSession])
    setActiveId(newSession.id)
  }

  const handleSwitchSession = (id: string) => {
    setActiveId(id)
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-4 z-[91] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:inset-8 lg:inset-12"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 md:px-6">
              <div className="w-8" />
              <h2 className="truncate text-center text-base font-semibold">{title}</h2>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                aria-label="Закрыть"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body: sidebar + chat */}
            <div className="flex min-h-0 flex-1">
              {/* Sidebar */}
              <div className="flex w-52 shrink-0 flex-col border-r border-border bg-muted/20 p-3">
                <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                  История чатов
                </p>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSwitchSession(s.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left text-xs transition-colors',
                        s.id === activeId
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      )}
                    >
                      <p className="font-medium">{s.label}</p>
                      <p
                        className={cn(
                          'mt-0.5 text-[11px]',
                          s.id === activeId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}
                      >
                        {formatSessionDate(s.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={handleNewSession}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Новый чат
                </Button>
              </div>

              {/* Chat area */}
              <ChatPanel
                key={activeId}
                initialMessages={activeSession.messages}
                context={context}
                onMessagesChange={handleMessagesChange}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
