import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY!,
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: deepseek('deepseek-chat'),
    system:
      'Ты помощник в системе управления рисками RiskHub. Помогаешь пользователям разбираться с проектами, рисками и работой платформы. Отвечай кратко, по делу, на русском языке.',
    messages,
  })

  return result.toDataStreamResponse()
}
