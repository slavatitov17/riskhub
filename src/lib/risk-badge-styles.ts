/** Aligns with probability / impact / status badges in the risks table. */

export function probabilityBadgeClass(value: string) {
  if (value === 'Высокая') return 'border-transparent bg-rose-500/15 text-rose-800'
  if (value === 'Средняя')
    return 'border-transparent bg-amber-500/15 text-amber-900'
  return 'border-transparent bg-emerald-500/15 text-emerald-800'
}

export function impactBadgeClass(value: string) {
  if (value === 'Высокое') return 'border-transparent bg-rose-500/15 text-rose-800'
  if (value === 'Среднее')
    return 'border-transparent bg-amber-500/15 text-amber-900'
  return 'border-transparent bg-emerald-500/15 text-emerald-800'
}

export function statusBadgeClass(status: string) {
  if (status === 'Активный') return 'border-transparent bg-red-500/15 text-red-800'
  if (status === 'В работе')
    return 'border-transparent bg-amber-500/15 text-amber-900'
  if (status === 'Закрыт')
    return 'border-transparent bg-emerald-500/15 text-emerald-800'
  return 'border-transparent bg-sky-500/15 text-sky-900'
}
