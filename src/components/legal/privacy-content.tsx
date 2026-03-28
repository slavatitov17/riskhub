import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PrivacyContent() {
  return (
    <Card className="border bg-card/95 shadow-lg backdrop-blur">
      <CardHeader>
        <p className="text-sm text-muted-foreground">Последнее обновление: 24.03.2026</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">1. Общие положения</h2>
          <p>
            Настоящая политика определяет порядок обработки и защиты данных пользователей
            платформы RiskHub.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">2. Какие данные сохраняются</h2>
          <p>
            Сохраняются профили пользователей, карточки рисков, история изменений, логи
            действий и интеграционные данные.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">3. Срок хранения данных</h2>
          <p>
            Данные хранятся в течение всего срока использования сервиса и подлежат
            удалению при изменении корпоративных правил.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">4. Защита и ограничения</h2>
          <p>
            Применяется шифрование, разграничение прав доступа, аудит действий и
            соответствие требованиям законодательства.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">5. Контроль пользователя</h2>
          <p>
            Пользователь вправе запросить выгрузку своих данных или их удаление через
            администратора системы.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
