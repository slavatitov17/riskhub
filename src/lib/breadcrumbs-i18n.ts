import type { AppLocale } from '@/contexts/locale-context'

export interface Crumb {
  label: string
  href?: string
}

const L = {
  ru: {
    panel: 'Главная',
    projects: 'Проекты',
    newProject: 'Новый проект',
    risks: 'Риски',
    newRisk: 'Новый риск',
    editRisk: 'Редактирование риска',
    riskCard: 'Карточка риска',
    analytics: 'Аналитика',
    settings: 'Настройки',
    profile: 'Профиль',
    about: 'О системе',
    terms: 'Условия использования',
    privacy: 'Политика конфиденциальности',
    help: 'Помощь',
    section: 'Раздел'
  },
  en: {
    panel: 'Home',
    projects: 'Projects',
    newProject: 'New project',
    risks: 'Risks',
    newRisk: 'New risk',
    editRisk: 'Edit risk',
    riskCard: 'Risk details',
    analytics: 'Analytics',
    settings: 'Settings',
    profile: 'Profile',
    about: 'About',
    terms: 'Terms of use',
    privacy: 'Privacy policy',
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

  if (path === '/projects') return [{ label: m.projects }]

  if (path === '/projects/new')
    return [{ label: m.projects, href: '/projects' }, { label: m.newProject }]

  if (path === '/risks') return [{ label: m.risks }]

  if (path === '/risks/new')
    return [{ label: m.risks, href: '/risks' }, { label: m.newRisk }]

  if (path === '/analytics') return [{ label: m.analytics }]

  if (path === '/settings') return [{ label: m.settings }]

  if (path === '/settings/profile') return [{ label: m.profile }]

  if (path === '/help') return [{ label: m.help }]

  if (path === '/legal/about') return [{ label: m.about }]

  if (path === '/legal/terms') return [{ label: m.terms }]

  if (path === '/legal/privacy') return [{ label: m.privacy }]

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
