import { createMistral } from '@ai-sdk/mistral'
import { streamText } from 'ai'

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY ?? '',
})

interface RiskSummary {
  code?: string
  name?: string
  status?: string
  category?: string
  description?: string
  probability?: string
  impact?: string
}

interface ProjectSummary {
  code?: string
  name?: string
  status?: string
  category?: string
  description?: string
  /** Risks belonging to this project */
  risks?: RiskSummary[]
  attachedDocuments?: AttachedDocSummary[]
}

interface AttachedDocSummary {
  name: string
  content: string
}

interface AiContext {
  /** Hierarchical projects list (each project contains its risks) — used by the dock */
  projects?: ProjectSummary[]
  /** Single-project analysis context */
  project?: ProjectSummary
  /** Single-risk analysis context */
  risk?: RiskSummary & { project?: ProjectSummary; attachedDocuments?: AttachedDocSummary[] }
}

interface FileContent {
  name: string
  content: string
}

function statsByStatus(risks: RiskSummary[]): string {
  const counts = new Map<string, number>()
  for (const r of risks) {
    const s = r.status ?? '—'
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  return Array.from(counts)
    .map(([s, c]) => `${s}: ${c}`)
    .join(', ')
}

function buildSystemPrompt(context?: AiContext, fileContents?: FileContent[]): string {
  let prompt =
    'Ты персональный ИИ-ассистент в системе управления рисками RiskHub. ' +
    'Отвечай строго на основании данных пользователя — не придумывай и не используй данные других пользователей. ' +
    'Если данных нет — честно сообщи об этом. ' +
    'Отвечай по-русски, кратко и по делу.'

  if (context) {
    const { projects, project, risk } = context

    // ── Dock mode: hierarchical projects + their risks ──────────────────
    if (projects !== undefined) {
      const totalRisks = projects.reduce((acc, p) => acc + (p.risks?.length ?? 0), 0)
      const allRisks = projects.flatMap((p) => p.risks ?? [])

      prompt += `\n\nПроекты пользователя: ${projects.length} шт.`
      if (projects.length === 0) {
        prompt += ' (проектов пока нет)'
      } else {
        prompt += `\nВсего рисков: ${totalRisks} шт.`
        if (allRisks.length > 0) {
          prompt += ` (${statsByStatus(allRisks)})`
        }
        prompt += '\n\nПодробно по проектам:\n'
        for (const pr of projects) {
          const rCount = pr.risks?.length ?? 0
          prompt += `\n• ${pr.code ?? ''} «${pr.name ?? ''}» — статус: ${pr.status ?? '—'}, рисков: ${rCount}`
          if (rCount > 0) {
            prompt += ` (${statsByStatus(pr.risks!)})`
            prompt += '\n'
            for (const r of pr.risks!) {
              prompt += `  - ${r.code ?? ''} «${r.name ?? ''}» — ${r.status ?? '—'}, вероятность: ${r.probability ?? '—'}, влияние: ${r.impact ?? '—'}\n`
            }
          } else {
            prompt += '\n'
          }
        }
      }
    }

    // ── Single-project analysis mode ─────────────────────────────────────
    if (project) {
      prompt +=
        `\n\nАнализируемый проект:\n` +
        `- Код: ${project.code ?? '—'}\n` +
        `- Название: ${project.name ?? '—'}\n` +
        `- Описание: ${project.description || 'не указано'}\n` +
        `- Статус: ${project.status ?? '—'}\n` +
        `- Категория: ${project.category ?? '—'}`

      if (project.risks?.length) {
        prompt += `\n- Риски проекта (${project.risks.length} шт., ${statsByStatus(project.risks)}):\n`
        for (const r of project.risks) {
          prompt += `  • ${r.code ?? ''} «${r.name ?? ''}» — вероятность: ${r.probability ?? '—'}, влияние: ${r.impact ?? '—'}, статус: ${r.status ?? '—'}\n`
        }
      } else {
        prompt += '\n- Риски проекта: нет'
      }

      if (project.attachedDocuments?.length) {
        prompt += `\n\nДокументация, прикреплённая к проекту:\n`
        for (const doc of project.attachedDocuments) {
          prompt += `\n--- Документ: ${doc.name} ---\n${doc.content}\n--- Конец документа ---\n`
        }
      } else {
        prompt += '\n- Прикреплённые документы: отсутствуют'
      }
    }

    // ── Single-risk analysis mode ─────────────────────────────────────────
    if (risk) {
      prompt +=
        `\n\nАнализируемый риск:\n` +
        `- Код: ${risk.code ?? '—'}\n` +
        `- Название: ${risk.name ?? '—'}\n` +
        `- Описание: ${risk.description || 'не указано'}\n` +
        `- Категория: ${risk.category ?? '—'}\n` +
        `- Вероятность: ${risk.probability ?? '—'}\n` +
        `- Влияние: ${risk.impact ?? '—'}\n` +
        `- Статус: ${risk.status ?? '—'}`

      if (risk.project) {
        prompt += `\n- Связанный проект: «${risk.project.name ?? '—'}» (${risk.project.code ?? '—'})`
      }

      if (risk.attachedDocuments?.length) {
        prompt += `\n\nДокументация, прикреплённая к риску:\n`
        for (const doc of risk.attachedDocuments) {
          prompt += `\n--- Документ: ${doc.name} ---\n${doc.content}\n--- Конец документа ---\n`
        }
      } else {
        prompt += '\n- Прикреплённые документы: отсутствуют'
      }
    }
  }

  if (fileContents?.length) {
    prompt += '\n\nПользователь прикрепил следующие файлы — при ответе ориентируйся именно на их содержимое:\n'
    for (const fc of fileContents) {
      prompt += `\n--- Файл: ${fc.name} ---\n${fc.content}\n--- Конец файла ---\n`
    }
  }

  return prompt
}

export async function POST(req: Request) {
  if (!process.env.MISTRAL_API_KEY) {
    console.error('[ai/chat] MISTRAL_API_KEY is not set')
    return new Response(
      JSON.stringify({ error: 'MISTRAL_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { messages, context, fileContents } = body as {
      messages: Parameters<typeof streamText>[0]['messages']
      context?: AiContext
      fileContents?: FileContent[]
    }

    const result = streamText({
      model: mistral('mistral-small-latest'),
      system: buildSystemPrompt(context, fileContents),
      messages,
      onError: ({ error }) => {
        console.error('[ai/chat] streamText error:', error)
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('[ai/chat] unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process AI request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
