import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted/30 px-4">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Страница не найдена
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Ссылка устарела или адрес введён с ошибкой. Вернитесь на главную или
          воспользуйтесь входом в систему.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">На страницу входа</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/panel">Панель</Link>
        </Button>
      </div>
    </div>
  )
}
