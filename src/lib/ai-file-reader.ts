import mammoth from 'mammoth'

const READABLE_EXTENSIONS = [
  '.txt', '.md', '.csv', '.json', '.xml', '.log', '.yaml', '.yml',
  '.html', '.htm', '.js', '.ts', '.py', '.sql', '.sh', '.ini', '.cfg', '.conf'
]

const MAX_CONTENT_CHARS = 40_000

function isDocx(mimeType: string, fileName: string): boolean {
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.toLowerCase().endsWith('.docx')
  )
}

function isReadableText(mimeType: string, fileName: string): boolean {
  if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/xml') {
    return true
  }
  return READABLE_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext))
}

async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string | null> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value?.trim() || null
  } catch {
    return null
  }
}

function truncate(text: string): string {
  if (text.length <= MAX_CONTENT_CHARS) return text
  return text.slice(0, MAX_CONTENT_CHARS) + '\n[...файл обрезан]'
}

/**
 * Reads a File object and returns its text content.
 * Supports plain text files and DOCX documents.
 * Returns null for binary or unreadable files.
 */
export async function readFileText(file: File): Promise<string | null> {
  if (isDocx(file.type, file.name)) {
    const buf = await file.arrayBuffer()
    const text = await extractDocxText(buf)
    return text ? truncate(text) : null
  }

  if (!isReadableText(file.type, file.name)) return null

  return new Promise<string | null>((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string | null
      resolve(result ? truncate(result) : null)
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file, 'utf-8')
  })
}

/**
 * Extracts text content from a stored dataUrl (project/risk documentation files).
 * Supports plain text (base64 or URL-encoded) and DOCX files.
 */
export async function extractTextFromDataUrl(
  dataUrl: string,
  mimeType: string,
  fileName: string
): Promise<string | null> {
  if (!dataUrl?.startsWith('data:')) return null

  const commaIdx = dataUrl.indexOf(',')
  if (commaIdx === -1) return null

  const header = dataUrl.slice(0, commaIdx)
  const data = dataUrl.slice(commaIdx + 1)
  const isBase64 = header.includes(';base64')

  if (isDocx(mimeType, fileName)) {
    try {
      const binaryStr = atob(data)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)!
      }
      const text = await extractDocxText(bytes.buffer)
      return text ? truncate(text) : null
    } catch {
      return null
    }
  }

  if (!isReadableText(mimeType, fileName)) return null

  try {
    const text = isBase64 ? atob(data) : decodeURIComponent(data)
    return truncate(text)
  } catch {
    return null
  }
}
