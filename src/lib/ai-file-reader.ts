const READABLE_EXTENSIONS = [
  '.txt', '.md', '.csv', '.json', '.xml', '.log', '.yaml', '.yml',
  '.html', '.htm', '.js', '.ts', '.py', '.sql', '.sh', '.ini', '.cfg', '.conf'
]

const MAX_CONTENT_CHARS = 40_000

/**
 * Reads a text file and returns its content.
 * Returns null for binary or unreadable files.
 */
export async function readFileText(file: File): Promise<string | null> {
  const isTextMime =
    file.type.startsWith('text/') ||
    file.type === 'application/json' ||
    file.type === 'application/xml'

  const isTextExtension = READABLE_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  )

  if (!isTextMime && !isTextExtension) return null

  return new Promise<string | null>((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string | null
      if (!result) { resolve(null); return }
      // Truncate to avoid overwhelming the model context window
      resolve(result.length > MAX_CONTENT_CHARS ? result.slice(0, MAX_CONTENT_CHARS) + '\n[...файл обрезан]' : result)
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file, 'utf-8')
  })
}
