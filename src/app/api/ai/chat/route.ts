import { createMistral } from '@ai-sdk/mistral'
import { streamText } from 'ai'

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY ?? '',
})

interface ProjectSummary {
  code?: string
  name?: string
  status?: string
  category?: string
  description?: string
  probability?: string
  impact?: string
}

interface AiContext {
  projects?: ProjectSummary[]
  risks?: ProjectSummary[]
  project?: ProjectSummary
  risk?: ProjectSummary
}

function buildSystemPrompt(context?: AiContext): string {
  let prompt =
    'Ты помощник в системе управления рисками RiskHub. ' +
    'Помогаешь пользователям разбираться с проектами, рисками и работой платформы. ' +
    'Отвечай кратко, по делу, на русском языке.'

  if (!context) return prompt

  const { projects, risks, project, risk } = context

  if (projects?.length) {
    prompt += `\n\nПроекты пользователя (${projects.length} шт.):\n`
    for (const pr of projects) {
      prompt += `- ${pr.code ?? ''} «${pr.name ?? ''}» — статус: ${pr.status ?? '—'}, категория: ${pr.category ?? '—'}\n`
    }
  }

  if (risks?.length) {
    prompt += `\n\nРиски пользователя (${risks.length} шт.):\n`
    for (const r of risks) {
      prompt += `- ${r.code ?? ''} «${r.name ?? ''}» — категория: ${r.category ?? '—'}, вероятность: ${r.probability ?? '—'}, влияние: ${r.impact ?? '—'}, статус: ${r.status ?? '—'}\n`
    }
  }

  if (project) {
    prompt +=
      `\n\nАнализируемый проект:\n` +
      `- Код: ${project.code ?? '—'}\n` +
      `- Название: ${project.name ?? '—'}\n` +
      `- Описание: ${project.description || 'не указано'}\n` +
      `- Статус: ${project.status ?? '—'}\n` +
      `- Категория: ${project.category ?? '—'}`
  }

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
    const { messages, context } = body as { messages: unknown; context?: AiContext }

    const result = streamText({
      model: mistral('mistral-small-latest'),
      system: buildSystemPrompt(context),
      messages: messages as Parameters<typeof streamText>[0]['messages'],
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
