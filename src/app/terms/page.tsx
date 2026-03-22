import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-background px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">← На страницу входа</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Условия использования
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Демонстрационная версия RiskHub
        </p>
        <div className="mt-8 space-y-4 text-sm text-muted-foreground">
          <p>
            Настоящие условия регулируют использование веб-интерфейса RiskHub в
            целях оценки UX и прототипирования. Продукт поставляется «как есть»,
            без гарантий доступности или сохранности данных.
          </p>
          <p>
            Пользователь несёт ответственность за содержание вводимой
            информации и за сохранность устройства, на котором хранятся
            локальные данные.
          </p>
          <p>
            Запрещается использовать демо-версию для обработки реальных
            персональных данных без выполнения требований законодательства.
          </p>
        </div>
      </div>
    </div>
  )
}
