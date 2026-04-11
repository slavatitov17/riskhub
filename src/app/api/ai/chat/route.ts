import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.QWEN_API_KEY ?? '',
})

export async function POST(req: Request) {
  if (!process.env.QWEN_API_KEY) {
    console.error('[ai/chat] QWEN_API_KEY is not set')
    return new Response(
      JSON.stringify({ error: 'QWEN_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { messages } = await req.json()

    const result = streamText({
      model: openrouter('qwen/qwen3-coder:free'),
      system:
        'Ты помощник в системе управления рисками RiskHub. Помогаешь пользователям разбираться с проектами, рисками и работой платформы. Отвечай кратко, по делу, на русском языке.',
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
