import type { ReactNode } from 'react'

interface Props {
  content: string
  className?: string
}

function parseInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{part.slice(1, -1)}</code>
    return part
  })
}

export function MarkdownContent({ content, className }: Props) {
  const lines = content.split('\n')
  const nodes: ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!

    if (/^#{1,3}\s/.test(line)) {
      nodes.push(
        <p key={i} className="font-semibold leading-relaxed">
          {parseInline(line.replace(/^#{1,3}\s/, ''))}
        </p>
      )
      i++
      continue
    }

    if (line.startsWith('- ') || line.startsWith('• ')) {
      const items: ReactNode[] = []
      while (i < lines.length && (lines[i]!.startsWith('- ') || lines[i]!.startsWith('• '))) {
        items.push(<li key={i}>{parseInline(lines[i]!.replace(/^[-•]\s/, ''))}</li>)
        i++
      }
      nodes.push(<ul key={`ul-${i}`} className="my-1 list-disc space-y-0.5 pl-4">{items}</ul>)
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: ReactNode[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i]!)) {
        items.push(<li key={i}>{parseInline(lines[i]!.replace(/^\d+\.\s/, ''))}</li>)
        i++
      }
      nodes.push(<ol key={`ol-${i}`} className="my-1 list-decimal space-y-0.5 pl-4">{items}</ol>)
      continue
    }

    if (line.trim() === '') {
      i++
      continue
    }

    nodes.push(
      <p key={i} className="leading-relaxed">
        {parseInline(line)}
      </p>
    )
    i++
  }

  return <div className={className ?? 'space-y-1 text-sm'}>{nodes}</div>
}
