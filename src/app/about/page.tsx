import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary/5 to-background px-4 py-10 md:py-20">
      <div className="mx-auto max-w-3xl text-center md:text-left">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">← На страницу входа</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          О системе RiskHub
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          RiskHub — прототип базы знаний по рискам для ИТ-проектов: каталог
          рисков, аналитика, уведомления и сценарии реагирования в одном
          интерфейсе.
        </p>
        <ul className="mx-auto mt-8 max-w-xl space-y-3 text-left text-sm text-muted-foreground md:mx-0">
          <li>• Локальное хранение данных в браузере (без сервера по умолчанию)</li>
          <li>• Роли и расширенная аналитика — в следующих релизах</li>
          <li>• Готовность к подключению Supabase / корпоративного API</li>
        </ul>
        <div className="mt-10 flex flex-wrap justify-center gap-3 md:justify-start">
          <Button asChild>
            <Link href="/">Войти</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/support">Справка</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
