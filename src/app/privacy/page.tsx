import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">← На страницу входа</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Политика конфиденциальности
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Последнее обновление: {new Date().getFullYear()}
        </p>
        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
          <p>
            RiskHub в демонстрационном режиме хранит учётные данные и записи о
            рисках локально в браузере пользователя. Серверная обработка
            персональных данных не выполняется, если вы не подключите
            собственный бэкенд.
          </p>
          <h2 className="mt-6 text-xl font-semibold">Какие данные сохраняются</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
            <li>Имя, email и пароль (в открытом виде — только для прототипа)</li>
            <li>Карточки рисков и пользовательские настройки интерфейса</li>
          </ul>
          <h2 className="mt-6 text-xl font-semibold">Ваши действия</h2>
          <p className="text-sm text-muted-foreground">
            Вы можете очистить данные, удалив локальное хранилище сайта в
            настройках браузера. Для продуктивного использования подключите
            шифрование, бэкенд и политику обработки ПДн.
          </p>
        </div>
      </div>
    </div>
  )
}
