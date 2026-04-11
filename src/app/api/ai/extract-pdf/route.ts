// pdf-parse is listed in serverExternalPackages so webpack skips bundling it.
// It is required natively by Node.js at runtime.
import pdfParse from 'pdf-parse'

export const runtime = 'nodejs'

const MAX_CHARS = 40_000

export async function POST(req: Request) {
  try {
    const body = await req.json() as { base64?: string }
    if (!body.base64) {
      return Response.json({ error: 'Missing base64' }, { status: 400 })
    }

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
