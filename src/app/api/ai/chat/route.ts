import { createMistral } from '@ai-sdk/mistral'
import { streamText } from 'ai'

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY ?? '',
})

interface EntitySummary {
  code?: string
  name?: string
  status?: string
  category?: string
  description?: string
  probability?: string
  impact?: string
}

interface AiContext {
  projects?: EntitySummary[]
  risks?: EntitySummary[]
  project?: EntitySummary & { risks?: EntitySummary[] }
  risk?: EntitySummary & { project?: EntitySummary }
}

interface FileContent {
  name: string
  content: string
}

function buildSystemPrompt(context?: AiContext, fileContents?: FileContent[]): string {
  let prompt =
    'Ты персональный ИИ-ассистент в системе управления рисками RiskHub. ' +
    'Отвечай строго на основании данных пользователя — не придумывай и не используй данные других пользователей. ' +
    'Если данных нет — честно сообщи об этом. ' +
    'Отвечай по-русски, кратко и по делу.'

  if (context) {
    const { projects, risks, project, risk } = context

    if (projects !== undefined) {
      prompt += `\n\nПроекты пользователя (${projects.length} шт.${projects.length === 0 ? ', проектов пока нет' : ''}):`
      if (projects.length > 0) {
        prompt += '\n'
        for (const pr of projects) {
          prompt += `- ${pr.code ?? ''} «${pr.name ?? ''}» — статус: ${pr.status ?? '—'}, категория: ${pr.category ?? '—'}\n`
        }
      }
    }

    if (risks !== undefined) {
      prompt += `\n\nРиски пользователя (${risks.length} шт.${risks.length === 0 ? ', рисков пока нет' : ''}):`
      if (risks.length > 0) {
        prompt += '\n'
        for (const r of risks) {
          prompt += `- ${r.code ?? ''} «${r.name ?? ''}» — категория: ${r.category ?? '—'}, вероятность: ${r.probability ?? '—'}, влияние: ${r.impact ?? '—'}, статус: ${r.status ?? '—'}\n`
        }
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
      if (project.risks?.length) {
        prompt += `\n- Риски проекта (${project.risks.length} шт.):\n`
        for (const r of project.risks) {
          prompt += `  • ${r.code ?? ''} «${r.name ?? ''}» — вероятность: ${r.probability ?? '—'}, влияние: ${r.impact ?? '—'}, статус: ${r.status ?? '—'}\n`
        }
      } else {
        prompt += '\n- Риски проекта: нет'
      }
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
      if (risk.project) {
        prompt += `\n- Связанный проект: «${risk.project.name ?? '—'}» (${risk.project.code ?? '—'})`
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
    const {
      messages,
      context,
      fileContents
    } = body as {
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
