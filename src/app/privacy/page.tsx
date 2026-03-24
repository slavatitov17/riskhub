import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-primary/10 via-background to-background px-4 py-10 md:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Button variant="ghost" asChild className="w-fit">
          <Link href="/">← Назад</Link>
        </Button>

        <Card className="border bg-card/95 shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Политика конфиденциальности
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Последнее обновление: {new Date().getFullYear()}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">1. Общие положения</h2>
              <p>
                В демо-режиме RiskHub хранит данные локально в браузере
                пользователя. Серверная обработка информации не выполняется,
                если вы отдельно не подключили внешний backend.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">2. Какие данные сохраняются</h2>
              <p>
                Локально могут сохраняться имя, email, пароль демо-пользователя,
                карточки рисков, фильтры и часть пользовательских настроек.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">3. Срок хранения данных</h2>
              <p>
                Данные хранятся до очистки localStorage в браузере или до ручного
                удаления внутри интерфейса.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">4. Защита и ограничения</h2>
              <p>
                Демо-режим не предназначен для хранения конфиденциальной
                корпоративной информации. Рекомендуется использовать тестовые
                данные без персональных идентификаторов.
              </p>
            </section>
            <section className="space-y-2 rounded-lg border p-4">
              <h2 className="text-base font-semibold text-foreground">5. Контроль пользователя</h2>
              <p>
                Вы можете удалить все данные через очистку данных сайта в
                браузере. Для продуктивного контура необходимо подключить
                шифрование, серверную валидацию и журналирование доступа.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
