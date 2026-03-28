'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const faq = [
  {
    q: 'Как создать новый риск?',
    a: 'После входа откройте раздел «Риски», нажмите «Новый риск», выберите проект, заполните форму и сохраните запись.'
  },
  {
    q: 'Как работает фильтрация?',
    a: 'Нажмите кнопку «Фильтры», выберите нужные статусы и категории. Выбранные фильтры отображаются рядом.'
  },
  {
    q: 'Есть ли мобильная версия?',
    a: 'Да, интерфейс адаптирован под телефоны и планшеты. Основное меню открывается через кнопку в шапке.'
  },
  {
    q: 'Почему не приходят письма подтверждения?',
    a: 'Текущая версия работает в демонстрационном режиме и не отправляет почтовые сообщения.'
  },
  {
    q: 'Как формируется уровень риска?',
    a: 'Уровень определяется комбинацией вероятности и воздействия, а также текущим статусом контроля.'
  },
  {
    q: 'Что делать при ошибке интерфейса?',
    a: 'Обновите страницу, проверьте браузер и очистите кэш. Если проблема повторяется, опишите шаги в поддержку.'
  },
  {
    q: 'Где посмотреть уведомления?',
    a: 'Уведомления доступны по иконке колокольчика в шапке и через блок на главной странице.'
  },
  {
    q: 'Как изменить язык интерфейса?',
    a: 'Переключение языка доступно в системных настройках внутри основного приложения.'
  },
  {
    q: 'Где найти юридическую информацию?',
    a: 'Доступны разделы «О системе», «Условия использования» и «Политика конфиденциальности» в приложении и на странице входа.'
  }
]

export function SupportHelpSections() {
  const [openId, setOpenId] = useState('0')

  return (
    <>
      <Card className="border bg-card/95 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Как мы можем помочь</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Поддержка пользователей
            </h2>
            <p>
              В этом разделе собраны практические рекомендации по входу, работе с рисками,
              уведомлениями и настройками интерфейса.
            </p>
          </section>
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 text-base font-semibold text-foreground">Формат помощи</h2>
            <p>
              Ниже расположен расширенный FAQ в формате аккордеона: откройте нужный вопрос,
              чтобы быстро получить ответ.
            </p>
          </section>
        </CardContent>
      </Card>

      <Card className="border bg-card/95 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Частые вопросы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {faq.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden border bg-card/95 shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  onClick={() =>
                    setOpenId((prev) => (prev === String(i) ? '' : String(i)))
                  }
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 transition-transform ${openId === String(i) ? 'rotate-180' : ''}`}
                  />
                </button>
                {openId === String(i) && (
                  <CardContent className="border-t pb-4 pt-4 text-sm text-muted-foreground">
                    {item.a}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}
