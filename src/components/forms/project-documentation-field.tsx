'use client'

import { useCallback, useRef, useState } from 'react'
import { CheckCircle2, CloudUpload, Download, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/app-toast'
import type { ProjectDocumentationFile } from '@/lib/project-types'
import { cn } from '@/lib/utils'

const MAX_FILES = 8
const MAX_BYTES = 2 * 1024 * 1024

export interface ProjectDocumentationFieldLabels {
  label: string
  dropPrimary: string
  dropOr: string
  browse: string
  uploaded: string
  remove: string
  tooLarge: string
  maxFiles: string
}

interface ProjectDocumentationFieldProps {
  id?: string
  files: ProjectDocumentationFile[]
  onChange: (next: ProjectDocumentationFile[]) => void
  labels: ProjectDocumentationFieldLabels
}

function readFileAsDataUrl(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (file.size > MAX_BYTES) {
      resolve(undefined)
      return
    }
    const r = new FileReader()
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : undefined)
    r.onerror = () => resolve(undefined)
    r.readAsDataURL(file)
  })
}

export function ProjectDocumentationField({
  id = 'project-documentation',
  files,
  onChange,
  labels
}: ProjectDocumentationFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)

  const ingestFileList = useCallback(
    async (incoming: FileList | File[]) => {
      const arr = Array.from(incoming).filter((f) => f.size > 0)
      if (arr.length === 0) return
      if (files.length >= MAX_FILES) {
        toast.message(labels.maxFiles)
        return
      }
      setBusy(true)
      try {
        const next = [...files]
        for (const file of arr) {
          if (next.length >= MAX_FILES) {
            toast.message(labels.maxFiles)
            break
          }
          if (file.size > MAX_BYTES) {
            toast.message(labels.tooLarge.replace('{name}', file.name))
            continue
          }
          const dataUrl = await readFileAsDataUrl(file)
          const uploadedAt = new Date().toISOString()
          next.push({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            uploadedAt,
            dataUrl
          })
        }
        onChange(next)
      } finally {
        setBusy(false)
      }
    },
    [files, labels.maxFiles, labels.tooLarge, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      void ingestFileList(e.dataTransfer.files)
    },
    [ingestFileList]
  )

  const handleRemove = (fileId: string) => {
    onChange(files.filter((f) => f.id !== fileId))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{labels.label}</Label>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'relative rounded-lg border-2 border-dashed border-primary/45 bg-muted/30 p-6 transition-colors',
          dragOver && 'border-primary bg-primary/10',
          busy && 'pointer-events-none opacity-70'
        )}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        aria-label={labels.label}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="sr-only"
          multiple
          disabled={busy}
          onChange={(e) => {
            const fl = e.target.files
            if (fl?.length) void ingestFileList(fl)
            e.target.value = ''
          }}
        />
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <CloudUpload
            className="h-10 w-10 text-primary"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">{labels.dropPrimary}</p>
          <p className="text-xs text-muted-foreground">{labels.dropOr}</p>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {labels.browse}
          </Button>
        </div>
      </div>
      {files.length > 0 ? (
        <div className="space-y-2 rounded-md border border-border bg-card p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {labels.uploaded}
          </p>
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <span className="min-w-0 truncate text-foreground" title={f.name}>
                    {f.name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label={`${labels.remove}: ${f.name}`}
                  onClick={() => handleRemove(f.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
