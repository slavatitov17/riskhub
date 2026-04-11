'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ProjectRecord } from '@/lib/project-types'
import type { RiskRecord } from '@/lib/risk-types'
import { AiChatModal } from './ai-chat-modal'

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
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button type="button" className="mt-4 gap-2" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" aria-hidden />
        {ctaLabel}
      </Button>

      {type === 'project' ? (
        <AiChatModal
          open={open}
          onClose={() => setOpen(false)}
          type="project"
          data={data as ProjectRecord}
        />
      ) : (
        <AiChatModal
          open={open}
          onClose={() => setOpen(false)}
          type="risk"
          data={data as RiskRecord}
        />
      )}
    </>
  )
}
