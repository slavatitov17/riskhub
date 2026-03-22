import type { AppLocale } from '@/contexts/locale-context'

export interface Crumb {
  label: string
  href?: string
}

const L = {
  ru: {
    panel: 'Панель',
    risks: 'Список рисков',
    newRisk: 'Новый риск',
    editRisk: 'Редактирование риска',
    riskCard: 'Карточка риска',
    analytics: 'Аналитика',
    settings: 'Настройки',
    system: 'Системные настройки',
    help: 'Помощь',
    section: 'Раздел'
  },
  en: {
    panel: 'Dashboard',
    risks: 'Risk list',
    newRisk: 'New risk',
    editRisk: 'Edit risk',
    riskCard: 'Risk details',
    analytics: 'Analytics',
    settings: 'Settings',
    system: 'System settings',
    help: 'Help',
    section: 'Section'
  }
} as const

export function getBreadcrumbs(
  pathname: string,
  locale: AppLocale = 'ru'
): Crumb[] {
  const m = L[locale]
  const path = pathname.replace(/\/$/, '') || '/'

  if (path === '/panel') return [{ label: m.panel }]

  if (path === '/risks') return [{ label: m.risks }]

  if (path === '/risks/new')
    return [{ label: m.risks, href: '/risks' }, { label: m.newRisk }]

  if (path === '/analytics') return [{ label: m.analytics }]

  if (path === '/settings') return [{ label: m.settings }]

  if (path === '/settings/system')
    return [{ label: m.settings, href: '/settings' }, { label: m.system }]

  if (path === '/help') return [{ label: m.help }]

  const editMatch = path.match(/^\/risks\/([^/]+)\/edit$/)
  if (editMatch) {
    return [
      { label: m.risks, href: '/risks' },
      { label: m.editRisk }
    ]
  }

  const detailMatch = path.match(/^\/risks\/([^/]+)$/)
  if (detailMatch && detailMatch[1] !== 'new') {
    return [
      { label: m.risks, href: '/risks' },
      { label: m.riskCard }
    ]
  }

  return [{ label: m.section }]
}
