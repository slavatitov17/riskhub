# RiskHub

База знаний по рискам (ИТ-проекты). Фронтенд: **Next.js 14** (App Router), **React 18**, **TypeScript**, **Tailwind CSS**, компоненты в стиле **shadcn/ui**.

## Команды

Установка зависимостей (выполните в `c:\Users\Admin\riskhub`):

```bash
cd c:\Users\Admin\riskhub
npm install
```

Запуск dev-сервера:

```bash
npm run dev
```

Сборка:

```bash
npm run build
```

### Git (первый раз)

```bash
cd c:\Users\Admin\riskhub
git init
git branch -M main
git remote add origin https://github.com/slavatitov17/riskhub.git
git add .
git status
git commit -m "feat: initialize Next app with dashboard panel"
git push -u origin main
```

> Для `git push` нужна авторизация GitHub (PAT или SSH).

### Shadcn/ui

В проекте уже есть `components.json` и базовые UI-компоненты в `src/components/ui`. Дополнительные блоки можно добавлять через MCP или CLI:

```bash
npx shadcn@latest add dialog sheet tabs
```

## Структура

- `src/app` — маршруты App Router, группа `(dashboard)` — основной каркас с сайдбаром
- `src/components/ui` — примитивы (Button, Card, Table, …)
- `src/components/layout` — сайдбар и шапка
