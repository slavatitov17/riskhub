'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { ProjectRecord } from '@/lib/project-types'
import type { RiskRecord } from '@/lib/risk-types'
import { MarkdownContent } from './markdown-content'

interface ProjectPanelProps {
  type: 'project'
  data: ProjectRecord
  ctaLabel: string
}

interface RiskPanelProps {
  type: 'risk'
  data: RiskRecord
  ctaLabel: string
}

type AiAnalysisPanelProps = ProjectPanelProps | RiskPanelProps

export function AiAnalysisPanel({ type, data, ctaLabel }: AiAnalysisPanelProps) {
  const [started, setStarted] = useState(false)
  const didAutoStart = useRef(false)

  const context =
    type === 'project'
      ? {
          project: {
            code: data.code,
            name: data.name,
            description: (data as ProjectRecord).description,
            status: (data as ProjectRecord).status,
            category: data.category,
          },
        }
      : {
          risk: {
            code: data.code,
            name: data.name,
            description: (data as RiskRecord).description,
            category: data.category,
            probability: (data as RiskRecord).probability,
            impact: (data as RiskRecord).impact,
            status: (data as RiskRecord).status,
          },
        }

  const { messages, append, isLoading } = useChat({
    api: '/api/ai/chat',
    body: { context },
    onError: () => {
      toast.error('Не удалось получить ответ от ИИ. Попробуйте позже.')
    },
  })

  const latestAssistantMsg = messages.filter((m) => m.role === 'assistant').at(-1)

  const triggerAnalysis = () => {
    const prompt =
      type === 'project'
        ? `Проведи анализ проекта «${data.name}» (${data.code}). Описание: ${(data as ProjectRecord).description || 'не указано'}. Статус: ${(data as ProjectRecord).status}. Выяви потенциальные риски и дай рекомендации по управлению ими.`
        : `Проведи анализ риска «${data.name}» (${data.code}). Описание: ${(data as RiskRecord).description || 'не указано'}. Категория: ${data.category}. Вероятность: ${(data as RiskRecord).probability}. Влияние: ${(data as RiskRecord).impact}. Статус: ${(data as RiskRecord).status}. Оцени критичность и дай конкретные рекомендации по снижению.`

    void append({ role: 'user', content: prompt })
  }

  const handleAnalyze = () => {
    setStarted(true)
    triggerAnalysis()
  }

  useEffect(() => {
    if (started && !isLoading && latestAssistantMsg && !didAutoStart.current) {
      didAutoStart.current = true
    }
  }, [started, isLoading, latestAssistantMsg])

  return (
    <div className="space-y-3 pt-2">
      {!started && (
        <Button type="button" className="gap-2" onClick={handleAnalyze}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {ctaLabel}
        </Button>
      )}

      {started && isLoading && !latestAssistantMsg && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          <span>ИИ анализирует…</span>
        </div>
      )}

      {latestAssistantMsg && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <MarkdownContent content={latestAssistantMsg.content} />
        </div>
      )}

      {started && !isLoading && latestAssistantMsg && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={triggerAnalysis}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Повторить
        </Button>
      )}
    </div>
  )
}
