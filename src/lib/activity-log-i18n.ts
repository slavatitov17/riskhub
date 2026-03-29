import type { AppLocale } from '@/contexts/locale-context'

/**
 * Translates persisted Russian activity messages for display when UI locale is English.
 */
export function translateActivityLogMessage(
  message: string,
  locale: AppLocale
): string {
  if (locale !== 'en') return message

  if (message === 'Риск создан') return 'Risk created'
  if (message === 'Проект создан') return 'Project created'
  if (message === 'Описание риска обновлено') return 'Risk description updated'
  if (message === 'Описание проекта обновлено')
    return 'Project description updated'

  const inv = message.match(/^Отправлено приглашений: (\d+)$/)
  if (inv) return `Invitations sent: ${inv[1]}`

  const m = message.match(/^Название изменено на «(.*)»$/)
  if (m) return `Name changed to «${m[1]}»`

  const cat = message.match(/^Категория изменена на «(.*)»$/)
  if (cat) return `Category changed to «${cat[1]}»`

  const st = message.match(/^Статус изменён на «(.*)»$/)
  if (st) return `Status changed to «${st[1]}»`

  const pr = message.match(/^Вероятность изменена на «(.*)»$/)
  if (pr) return `Probability changed to «${pr[1]}»`

  const im = message.match(/^Воздействие изменено на «(.*)»$/)
  if (im) return `Impact changed to «${im[1]}»`

  const pj = message.match(/^Проект изменён на «(.*)»$/)
  if (pj) return `Project changed to «${pj[1]}»`

  const au = message.match(/^Автор изменён на «(.*)»$/)
  if (au) return `Author changed to «${au[1]}»`

  return message
}
