'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RISK_CATEGORY_PRESETS } from '@/lib/risk-types'

interface SearchableCategoryFieldProps {
  value: string
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  id?: string
}

export function SearchableCategoryField({
  value,
  onChange,
  label = 'Категория',
  placeholder = 'Выберите категорию',
  searchPlaceholder = 'Поиск по категориям…',
  id
}: SearchableCategoryFieldProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [draft, setDraft] = useState('')

  const q = query.trim().toLowerCase()
  const presetOptions = useMemo((): string[] => {
    const base: string[] = [...RISK_CATEGORY_PRESETS]
    const v = value.trim()
    if (v && !base.includes(v)) base.unshift(v)
    return base
  }, [value])

  const filteredPresets = useMemo(() => {
    let list = presetOptions.filter((c) => c.toLowerCase().includes(q))
    const v = value.trim()
    if (v && !list.includes(v)) list = [v, ...list]
    return list
  }, [presetOptions, q, value])

  useEffect(() => {
    if (!open) return
    const idRaf = window.requestAnimationFrame(() => {
      if (createMode) createInputRef.current?.focus()
      else searchRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(idRaf)
  }, [open, createMode])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setCreateMode(false)
      setDraft('')
    }
  }, [open])

  const commitCustom = () => {
    const t = draft.trim()
    if (!t) return
    onChange(t)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      {label ? (
        <Label htmlFor={id}>{label}</Label>
      ) : null}
      <DropdownMenu
        modal={false}
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setQuery('')
            setCreateMode(false)
            setDraft('')
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            className="h-10 w-full justify-between px-3 font-normal"
          >
            <span
              className={value ? 'truncate' : 'truncate text-muted-foreground'}
            >
              {value.trim() || placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {createMode ? (
            <div className="border-b border-border p-2">
              <Input
                ref={createInputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Название категории"
                className="h-9"
                aria-label="Новая категория"
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitCustom()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setCreateMode(false)
                    setDraft('')
                  }
                }}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Enter — применить, Esc — назад
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-border p-2">
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9"
                  onKeyDown={(e) => e.stopPropagation()}
                  aria-label={`Поиск: ${label}`}
                />
              </div>
              <div className="max-h-52 overflow-y-auto p-1">
                <DropdownMenuRadioGroup
                  value={
                    value && filteredPresets.includes(value)
                      ? value
                      : undefined
                  }
                  onValueChange={(v) => {
                    onChange(v)
                    setOpen(false)
                  }}
                >
                  {filteredPresets.map((c) => (
                    <DropdownMenuRadioItem key={c} value={c}>
                      {c}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {filteredPresets.length === 0 ? (
                  <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                    Не найдено
                  </p>
                ) : null}
              </div>
              <div className="border-t border-border p-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full justify-start font-normal"
                  onClick={(e) => {
                    e.preventDefault()
                    setCreateMode(true)
                    setDraft(q ? query.trim() : '')
                  }}
                >
                  Создать категорию
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
