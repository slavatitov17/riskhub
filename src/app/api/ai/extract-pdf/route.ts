// pdf-parse is in serverExternalPackages – webpack skips it, Node.js loads CJS at runtime.
// We use createRequire to load the CJS build explicitly, bypassing the ESM type-resolution
// issue that occurs with moduleResolution:"bundler" + pdf-parse's exports field.
import { createRequire } from 'module'

export const runtime = 'nodejs'

const nodeRequire = createRequire(import.meta.url)

type PdfResult = { text: string; numpages: number }
type PdfParseFn = (buffer: Buffer, options?: Record<string, unknown>) => Promise<PdfResult>

const pdfParse = nodeRequire('pdf-parse') as PdfParseFn

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
