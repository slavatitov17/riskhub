import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TermsContent() {
  return (
    <Card className="border bg-card/95 shadow-lg backdrop-blur">
      <CardHeader>
        <CardTitle className="text-3xl font-bold tracking-tight">
          Условия использования
        </CardTitle>
        <p className="text-sm text-muted-foreground">Последнее обновление: 24.03.2026</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">1. Назначение сервиса</h2>
          <p>
            Платформа для интеллектуального управления рисками: семантический поиск,
            аналитика и визуализация связей для поддержки решений.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">2. Формат предоставления</h2>
          <p>
            Доступ через веб-интерфейс с ролевой моделью, интеграцией с корпоративными
            системами и защищенным облачным хранением данных.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">3. Ответственность пользователя</h2>
          <p>
            Пользователь самостоятельно отвечает за корректность вводимой информации и
            за своевременное обновление данных о рисках.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">4. Ограничения использования</h2>
          <p>
            Запрещена передача учетных данных третьим лицам, несанкционированное
            копирование данных
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">5. Изменение условий</h2>
          <p>
            Администрация вправе изменять условия с уведомлением пользователей за 7 дней
            через систему уведомлений или корпоративную почту.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
