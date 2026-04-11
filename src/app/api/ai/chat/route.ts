import { createGroq } from '@ai-sdk/groq'
import { streamText } from 'ai'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY ?? '',
})

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    console.error('[ai/chat] GROQ_API_KEY is not set')
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY is not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { messages } = await req.json()

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
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
