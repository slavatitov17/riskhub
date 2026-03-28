import { Card, CardContent } from '@/components/ui/card'

export function AboutContent() {
  return (
    <Card className="border bg-card/95 shadow-lg backdrop-blur">
      <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">Что такое RiskHub</h2>
          <p>
            Интеллектуальная система управления рисками, объединяющая структурированные
            данные, семантический поиск и корпоративные интеграции.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">Ключевые возможности</h2>
          <p>
            Семантический поиск, автоматическое выявление рисков, графы связей,
            верификация экспертами и интеграция с Jira, Slack, CRM.
          </p>
        </section>
        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="text-base font-semibold text-foreground">Планы развития</h2>
          <p>
            Расширение ИИ-аналитики, углубление интеграций, внедрение предиктивных
            моделей.
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
