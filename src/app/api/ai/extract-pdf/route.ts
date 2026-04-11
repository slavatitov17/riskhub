// Use Node.js runtime to access pdf-parse (binary Buffer operations)
export const runtime = 'nodejs'

const MAX_CHARS = 40_000

type PdfParseFn = (
  dataBuffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>

export async function POST(req: Request) {
  try {
    const body = await req.json() as { base64?: string }
    if (!body.base64) {
      return Response.json({ error: 'Missing base64' }, { status: 400 })
    }

    // Dynamic import from the lib path prevents pdf-parse from loading
    // its bundled test fixtures at module init time (Next.js bundler compat)
    const mod = (await import('pdf-parse/lib/pdf-parse.js')) as unknown as { default: PdfParseFn }
    const pdfParse: PdfParseFn = mod.default

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
