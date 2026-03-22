import Link from 'next/link'

import type { Crumb } from '@/lib/breadcrumbs-i18n'

interface AppBreadcrumbsProps {
  items: Crumb[]
}

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  if (!items.length) return null

  return (
    <nav aria-label="Хлебные крошки" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm md:gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-muted-foreground/60" aria-hidden>
                  /
                </span>
              )}
              {isLast ? (
                <span className="truncate font-semibold text-foreground">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="truncate font-normal text-foreground/60 transition-opacity hover:opacity-100"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="truncate font-normal text-foreground/60">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
