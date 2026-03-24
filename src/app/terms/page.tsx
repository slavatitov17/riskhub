import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 md:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/">← Назад</Link>
        </Button>

        <Card className="border bg-card/95 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Условия использования
            </CardTitle>
            <p className="text-sm text-muted-foreground">Демонстрационная версия RiskHub</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">1. Назначение сервиса</h2>
              <p>
                RiskHub предоставляется как демонстрационный продукт для оценки
                интерфейса, пользовательских сценариев и логики работы с реестром
                рисков.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">2. Формат предоставления</h2>
              <p>
                Сервис работает по модели «как есть», без гарантий непрерывной
                доступности, полноты данных и совместимости со всеми браузерами.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">3. Ответственность пользователя</h2>
              <p>
                Пользователь самостоятельно отвечает за корректность вводимой
                информации и за сохранность устройства, где хранятся локальные
                данные приложения.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">4. Ограничения использования</h2>
              <p>
                Запрещается использовать демонстрационный контур для обработки
                критичных данных, коммерчески значимых реестров и реальных
                персональных данных без внедрения мер защиты.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">5. Изменение условий</h2>
              <p>
                Команда RiskHub может обновлять условия использования и структуру
                демо-окружения без предварительного уведомления.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
