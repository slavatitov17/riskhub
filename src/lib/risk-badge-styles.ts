/** Aligns with probability / impact / status chips in the risks table (plain spans, no Badge merge quirks). */

export const riskTableChipBase =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap'

export function probabilityBadgeClass(value: string) {
  if (value === 'Высокая')
    return 'border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-100'
  if (value === 'Средняя')
    return 'border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
  return 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100'
}

export function impactBadgeClass(value: string) {
  if (value === 'Высокое')
    return 'border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-100'
  if (value === 'Среднее')
    return 'border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
  return 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100'
}

export function statusBadgeClass(status: string) {
  if (status === 'Активный')
    return 'border-red-200 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100'
  if (status === 'В работе')
    return 'border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
  if (status === 'Закрыт')
    return 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100'
  return 'border-sky-200 bg-sky-100 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100'
}
