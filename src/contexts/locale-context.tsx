'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

export type AppLocale = 'ru' | 'en'

const LOCALE_KEY = 'riskhub_locale'

const messages = {
  ru: {
    navPanel: 'Главная',
    navProjects: 'Проекты',
    navRisks: 'Риски',
    navAnalytics: 'Аналитика',
    navSettings: 'Настройки',
    navHelp: 'Помощь',
    crumbPanel: 'Главная',
    crumbProjects: 'Проекты',
    crumbNewProject: 'Новый проект',
    crumbRisks: 'Риски',
    crumbNewRisk: 'Новый риск',
    crumbEditRisk: 'Редактирование риска',
    crumbRiskCard: 'Карточка риска',
    crumbAnalytics: 'Аналитика',
    crumbSettings: 'Настройки',
    crumbSystem: 'Системные настройки',
    crumbHelp: 'Помощь',
    crumbSection: 'Раздел',
    sheetMenu: 'Меню',
    mainNavAria: 'Основная навигация',
    openMenu: 'Открыть меню'
  },
  en: {
    navPanel: 'Home',
    navProjects: 'Projects',
    navRisks: 'Risks',
    navAnalytics: 'Analytics',
    navSettings: 'Settings',
    navHelp: 'Help',
    crumbPanel: 'Home',
    crumbProjects: 'Projects',
    crumbNewProject: 'New project',
    crumbRisks: 'Risks',
    crumbNewRisk: 'New risk',
    crumbEditRisk: 'Edit risk',
    crumbRiskCard: 'Risk details',
    crumbAnalytics: 'Analytics',
    crumbSettings: 'Settings',
    crumbSystem: 'System settings',
    crumbHelp: 'Help',
    crumbSection: 'Section',
    sheetMenu: 'Menu',
    mainNavAria: 'Main navigation',
    openMenu: 'Open menu'
  }
} as const

interface LocaleContextValue {
  locale: AppLocale
  setLocale: (l: AppLocale) => void
  t: (key: keyof (typeof messages)['ru']) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('ru')

  useEffect(() => {
    const raw = localStorage.getItem(LOCALE_KEY) as AppLocale | null
    if (raw === 'en' || raw === 'ru') setLocaleState(raw)
  }, [])

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l)
    localStorage.setItem(LOCALE_KEY, l)
  }, [])

  const t = useCallback(
    (key: keyof (typeof messages)['ru']) => messages[locale][key],
    [locale]
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
