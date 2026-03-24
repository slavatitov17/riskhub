import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 md:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/">← Назад</Link>
        </Button>

        <Card className="border bg-card/95 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">
              О системе RiskHub
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">Что такое RiskHub</h2>
              <p>
                RiskHub — это единое рабочее пространство для регистрации,
                оценки и мониторинга рисков ИТ-проектов.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">Ключевые возможности</h2>
              <p>
                Система включает реестр рисков, фильтрацию, карточки статусов,
                оповещения и базовую аналитику по жизненному циклу рисков.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">Архитектурный подход</h2>
              <p>
                Текущая версия использует локальное хранение данных в браузере,
                что ускоряет демо и не требует серверной инфраструктуры на старте.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">Планы развития</h2>
              <p>
                В следующих этапах запланированы роли пользователей, расширенные
                отчёты, интеграция с корпоративными API и централизованное
                безопасное хранение данных.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
