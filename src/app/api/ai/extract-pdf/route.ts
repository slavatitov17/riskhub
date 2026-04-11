// Use Node.js runtime to access pdf-parse (binary Buffer operations)
export const runtime = 'nodejs'

const MAX_CHARS = 40_000

export async function POST(req: Request) {
  try {
    const body = await req.json() as { base64?: string }
    if (!body.base64) {
      return Response.json({ error: 'Missing base64' }, { status: 400 })
    }

    // Import via lib path to avoid pdf-parse loading its internal test fixtures
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
      buffer: Buffer,
      options?: Record<string, unknown>
    ) => Promise<{ text: string }>

    const buffer = Buffer.from(body.base64, 'base64')
    const data = await pdfParse(buffer)
    let text = data.text?.trim() ?? ''
    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + '\n[...файл обрезан]'

    return Response.json({ text })
  } catch (error) {
    console.error('[extract-pdf] error:', error)
    return Response.json({ error: 'Failed to extract PDF text' }, { status: 500 })
  }
}
