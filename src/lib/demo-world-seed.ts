import { getDemoCredentials } from '@/lib/auth-storage'
import {
  normalizeProjectRecord,
  nextProjectCode,
  type ProjectRecord
} from '@/lib/project-types'
import {
  dbGetAllProjects,
  dbPutMember,
  dbPutProject,
  dbUpgradeProjectShapesIfNeeded,
  maybeBootstrapInvitationsFromLegacySingletonIdb,
  reconcileAllProjectStoresIntoShared
} from '@/lib/projects-db'
import type { RiskComment, RiskRecord } from '@/lib/risk-types'
import {
  mergeRisksIntoSharedCatalog,
  normalizeRiskRecord
} from '@/lib/risks-storage'
import { saveProfileForUser } from '@/lib/user-profile-storage'

const DEMO_WORLD_KEY = 'riskhub_demo_l3_world_v1'

const AUTHORS = [
  'Демо Аккаунт',
  'Алексей Петров',
  'Марина Соколова',
  'Игорь Волков',
  'Елена Кузнецова',
  'Дмитрий Орлов',
  'Анна Белова',
  'Павел Смирнов',
  'Ольга Новикова',
  'Сергей Морозов',
  'Никита Фёдоров',
  'Татьяна Лебедева'
] as const

function hashTopic(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36).slice(0, 10)
}

function makeThread(riskTitle: string, startIso: string): RiskComment[] {
  const bodies = [
    `Коллеги, по «${riskTitle}» нужно зафиксировать владельца и крайний срок анализа.`,
    'Поддерживаю: без ответственного со стороны заказчика мы упрёмся в согласования.',
    'Предлагаю опереться на библиотеку рисков внедрения АСУПП — там уже есть близкие формулировки.',
    'Финансовое влияние пока среднее, но при срыве сроков интеграции вырастет заметно.',
    'Интегратор просит уточнить объём внеконтрактных работ — это напрямую связано с этим риском.',
    'На производстве слышу сопротивление из‑за параллельного ввода в двух системах.',
    'Можно смягчить через пилот на одной линии, но тогда общий график сдвинется на несколько недель.',
    'Без выгрузки исторических данных из действующих систем требования останутся неполными.',
    'Согласен вынести на УК и при необходимости эскалировать на первое лицо.',
    'Подготовлю два сценария: ускоренный с урезанным объёмом и базовый с полной моделью.',
    'После встречи с ключевыми пользователями уточним приоритет: скорость ввода или полнота функций.',
    'Фиксирую итог: переводим в работу, меры — с чек‑листом и еженедельным контролем.'
  ]
  const t0 = Date.parse(startIso)
  return bodies.map((text, i) => ({
    id: `cm_${hashTopic(riskTitle)}_${i}`,
    at: new Date(t0 + i * 43_200_000 + i * 97_000).toISOString(),
    authorName: AUTHORS[i % AUTHORS.length],
    text
  }))
}

type MeasureSeed = { label: string; done: boolean }

type RiskSeed = {
  id: string
  code: string
  name: string
  description: string
  category: string
  probability: 'Низкая' | 'Средняя' | 'Высокая'
  impact: 'Низкое' | 'Среднее' | 'Высокое'
  status: string
  author: string
  created: string
  updated: string
  measures: MeasureSeed[]
}

function buildRisk(
  projectName: string,
  projectId: string,
  spec: RiskSeed
): RiskRecord {
  return normalizeRiskRecord({
    id: spec.id,
    code: spec.code,
    name: spec.name,
    description: spec.description,
    category: spec.category,
    probability: spec.probability,
    impact: spec.impact,
    status: spec.status,
    author: spec.author,
    created: spec.created,
    updated: spec.updated,
    project: projectName,
    projectId,
    comments: makeThread(spec.name, spec.created),
    responseMeasures: spec.measures.map((m, i) => ({
      id: `ms_${spec.id}_${i}`,
      label: m.label,
      done: m.done
    })),
    activityLog: [
      { id: `${spec.id}-c`, at: spec.created, message: 'Риск создан' },
      {
        id: `${spec.id}-u`,
        at: spec.updated,
        message: 'Скорректированы меры и статус после совещания'
      }
    ]
  })
}

type ProjectTpl = {
  id: string
  name: string
  category: string
  description: string
  createdAt: string
  updatedAt: string
  risks: RiskSeed[]
}

const MES: ProjectTpl = {
  id: 'proj_demo_l3_mes',
  name: 'MES на участке «Цех‑4»: диспетчеризация и учёт WIP',
  category: 'Технологический',
  description:
    'Внедрение MES для оперативного учёта запусков, сменных заданий и контроля WIP с интеграцией в ERP и склад.',
  createdAt: '2025-05-12T09:30:00.000Z',
  updatedAt: '2025-11-03T14:10:00.000Z',
  risks: [
    {
      id: 'demo_r_mes_01',
      code: 'R-910',
      name: 'Несинхронизированные НСИ между MES и ERP',
      description:
        'Персонал использует разные источники НСИ; не налажена синхронизация между контурами, как в типовом риске библиотеки по внешнему окружению.',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2025-05-28T10:00:00.000Z',
      updated: '2025-09-14T11:20:00.000Z',
      measures: [
        { label: 'Утвердить регламент обновления НСИ и ответственных', done: true },
        { label: 'Настроить ежедневную репликацию справочников', done: false },
        { label: 'Пилотная сверка на 200 SKU', done: false }
      ]
    },
    {
      id: 'demo_r_mes_02',
      code: 'R-911',
      name: 'Длительная работа в legacy и новой MES',
      description:
        'Продолжительный период параллельной работы в старой и внедряемой системе; рост нагрузки на персонал и риск ошибок.',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Марина Соколова',
      created: '2025-06-11T08:15:00.000Z',
      updated: '2025-10-02T16:40:00.000Z',
      measures: [
        { label: 'Сжать окно двойного ввода до 6 недель', done: false },
        { label: 'Доп. смена операторов на переходный период', done: false }
      ]
    },
    {
      id: 'demo_r_mes_03',
      code: 'R-912',
      name: 'Производительность расчёта сменных планов',
      description:
        'Платформа может не обеспечить требуемое время пересчёта при пиковых объёмах заказов.',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Игорь Волков',
      created: '2025-07-09T13:00:00.000Z',
      updated: '2026-01-19T09:05:00.000Z',
      measures: [
        { label: 'Нагрузочное тестирование на данных полугодия', done: true },
        { label: 'План масштабирования серверов приложений', done: false }
      ]
    },
    {
      id: 'demo_r_mes_04',
      code: 'R-913',
      name: 'Низкое качество исходных требований по полуфабрикатам',
      description:
        'Технические постановки от заказчика неполные; риск некорректной модели учёта переделов.',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Елена Кузнецова',
      created: '2025-08-22T07:45:00.000Z',
      updated: '2025-12-08T12:00:00.000Z',
      measures: [
        { label: 'Серия воркшопов с технологами', done: true },
        { label: 'Базовый документ «Правила учёта WIP» v1', done: false }
      ]
    },
    {
      id: 'demo_r_mes_05',
      code: 'R-914',
      name: 'Нет критериев приёмки результатов планирования',
      description:
        'Отсутствуют удобные механизмы оценки адекватности расчётов новой системы относительно бизнес-процесса.',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Демо Аккаунт',
      created: '2025-09-05T15:30:00.000Z',
      updated: '2026-02-11T10:15:00.000Z',
      measures: [
        { label: 'Матрица KPI для сравнения с эталонными сменами', done: false },
        { label: 'Подписание приёмки с владельцем производства', done: false }
      ]
    },
    {
      id: 'demo_r_mes_06',
      code: 'R-915',
      name: 'Задержка готовности интеграции с WMS',
      description:
        'Смежный проект склада сдвигает контур штрихкодов и подтверждений отгрузок.',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Павел Смирнов',
      created: '2025-10-17T11:10:00.000Z',
      updated: '2026-03-01T14:50:00.000Z',
      measures: [
        { label: 'Совместный план интерфейсов с командой WMS', done: true },
        { label: 'Временная ручная загрузка подтверждений', done: false }
      ]
    },
    {
      id: 'demo_r_mes_07',
      code: 'R-916',
      name: 'Жёсткое ограничение бюджета на отчётность MES',
      description:
        'Финансовый риск: внеконтрактные отчёты и дашборды могут не попасть в текущий контракт.',
      category: 'Финансовый',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Дмитрий Орлов',
      created: '2025-11-26T09:00:00.000Z',
      updated: '2026-03-20T08:30:00.000Z',
      measures: [
        { label: 'Приоритизация отчётов с заказчиком', done: false },
        { label: 'Оценка доп. трудозатрат integrator', done: true }
      ]
    },
    {
      id: 'demo_r_mes_08',
      code: 'R-917',
      name: 'Слабая вовлечённость сменных мастеров в пилот',
      description:
        'Риск сопротивления внедрению: мастера перегружены, нет времени на обучение.',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Мониторинг',
      author: 'Ольга Новикова',
      created: '2026-01-08T12:20:00.000Z',
      updated: '2026-03-28T17:00:00.000Z',
      measures: [
        { label: 'Оплата сверхурочных на время пилота', done: false },
        { label: 'Наставники из числа «чемпионов» цеха', done: true }
      ]
    }
  ]
}

const ERP: ProjectTpl = {
  id: 'proj_demo_l3_erp',
  name: 'ERP Finance: консолидация и управленческий учёт',
  category: 'Финансовый',
  description:
    'Замена разрозненных учётных контура на единый ERP-модуль Финансы с мультивалютностью и международной отчётностью.',
  createdAt: '2025-08-03T11:00:00.000Z',
  updatedAt: '2026-02-14T13:25:00.000Z',
  risks: [
    {
      id: 'demo_r_erp_01',
      code: 'R-920',
      name: 'Изменение требований к отчётности в ходе проекта',
      description:
        'Заказчик меняет состав форм и регламентов сдачи отчётности на этапе ввода в эксплуатацию.',
      category: 'Финансовый',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2025-08-19T10:30:00.000Z',
      updated: '2025-12-01T09:00:00.000Z',
      measures: [
        { label: 'Процесс change request с оценкой влияния на сроки', done: true },
        { label: 'Резерв буфера на доработки отчётов 15%', done: false }
      ]
    },
    {
      id: 'demo_r_erp_02',
      code: 'R-921',
      name: 'Низкое качество данных в интегрируемых системах',
      description:
        'Неудовлетворительное качество данных в источниках; риск искажения управленческой отчётности.',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Сергей Морозов',
      created: '2025-09-02T14:15:00.000Z',
      updated: '2026-01-10T11:40:00.000Z',
      measures: [
        { label: 'Профилирование и чистка ключевых справочников', done: false },
        { label: 'Правила блокировки проводок при ошибках НСИ', done: true }
      ]
    },
    {
      id: 'demo_r_erp_03',
      code: 'R-922',
      name: 'Нестабильное финансирование этапов внедрения',
      description:
        'Возможны задержки оплат; риск простоя команды и сдвига календарного плана.',
      category: 'Финансовый',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Мониторинг',
      author: 'Анна Белова',
      created: '2025-10-08T08:00:00.000Z',
      updated: '2026-02-20T15:10:00.000Z',
      measures: [
        { label: 'Помесячный кэшфлоу-план по проекту', done: true },
        { label: 'Триггеры приостановки работ при задержке >30 дней', done: false }
      ]
    },
    {
      id: 'demo_r_erp_04',
      code: 'R-923',
      name: 'Недостаточный контроль бюджета проекта',
      description:
        'Слабая прозрачность фактических трудозатрат и подрядных счетов по вехам.',
      category: 'Финансовый',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Никита Фёдоров',
      created: '2025-11-11T13:45:00.000Z',
      updated: '2026-03-05T10:00:00.000Z',
      measures: [
        { label: 'Еженедельный статус по освоению бюджета', done: true },
        { label: 'Сверка с планом закупок', done: false }
      ]
    },
    {
      id: 'demo_r_erp_05',
      code: 'R-924',
      name: 'Конфликт приоритетов между холдингом и дочерними обществами',
      description:
        'Разные требования к учётной политике и срокам закрытия периода.',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Татьяна Лебедева',
      created: '2025-12-03T09:20:00.000Z',
      updated: '2026-03-18T12:30:00.000Z',
      measures: [
        { label: 'Единый регламент закрытия месяца', done: false },
        { label: 'Рабочая группа CFO дочерних обществ', done: true }
      ]
    },
    {
      id: 'demo_r_erp_06',
      code: 'R-925',
      name: 'Срыв сроков из‑за объёма миграции исторических остатков',
      description:
        'Перенос сальдо и оборотов за несколько лет сложнее запланированного.',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Закрыт',
      author: 'Демо Аккаунт',
      created: '2026-01-15T07:50:00.000Z',
      updated: '2026-03-25T16:00:00.000Z',
      measures: [
        { label: 'Поэтапная миграция по компаниям', done: true },
        { label: 'Автоматические сверки оборотов', done: true }
      ]
    },
    {
      id: 'demo_r_erp_07',
      code: 'R-926',
      name: 'Регуляторные изменения в РСБУ/МСФО в год go-live',
      description:
        'Внешний риск: новые требования к раскрытиям могут потребовать доработок.',
      category: 'Внешний',
      probability: 'Низкая',
      impact: 'Высокое',
      status: 'Мониторинг',
      author: 'Алексей Петров',
      created: '2026-02-02T11:00:00.000Z',
      updated: '2026-03-30T09:15:00.000Z',
      measures: [
        { label: 'Мониторинг проектов НПА', done: true },
        { label: 'Резерв на доработку отчётности', done: false }
      ]
    }
  ]
}

const BPM: ProjectTpl = {
  id: 'proj_demo_l3_bpm',
  name: 'BPM: кредитный конвейер и согласования',
  category: 'Организационный',
  description:
    'Внедрение BPM-платформы для сквозного процесса кредитования: скоринг, комитеты, юридические этапы.',
  createdAt: '2025-10-18T08:45:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z',
  risks: [
    {
      id: 'demo_r_bpm_01',
      code: 'R-930',
      name: 'Топ-менеджмент не подготовлен к новой модели согласований',
      description:
        'Риск низкой поддержки: решения затягиваются, процесс остаётся формальным.',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2025-10-29T09:00:00.000Z',
      updated: '2026-01-22T14:00:00.000Z',
      measures: [
        { label: 'Серия сессий для первых лиц по ценности процесса', done: true },
        { label: 'KPI времени цикла сделки', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_02',
      code: 'R-931',
      name: 'Не описаны будущие сквозные бизнес-процессы',
      description:
        'Отсутствует утверждённая модель «как будет»; риск автоматизации хаоса.',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Марина Соколова',
      created: '2025-11-14T10:20:00.000Z',
      updated: '2026-02-05T11:30:00.000Z',
      measures: [
        { label: 'BPMN 2.0 для основных веток процесса', done: false },
        { label: 'Согласование с комплаенс и юристами', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_03',
      code: 'R-932',
      name: 'Интеграция с scoring и внешними бюро кредитных историй',
      description:
        'ИТ-инфраструктура и договорной доступ к внешним API могут задержаться.',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Игорь Волков',
      created: '2025-12-01T13:00:00.000Z',
      updated: '2026-03-08T09:45:00.000Z',
      measures: [
        { label: 'Песочница для тестов API', done: true },
        { label: 'Резервный ручной запрос скоринга', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_04',
      code: 'R-933',
      name: 'Перегрузка участников согласующих ролей',
      description:
        'Широкие массы сотрудников не готовы к новой дисциплине SLA по задачам.',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Елена Кузнецова',
      created: '2026-01-09T08:30:00.000Z',
      updated: '2026-03-15T16:20:00.000Z',
      measures: [
        { label: 'Делегирование и замещения в оргструктуре', done: false },
        { label: 'Мобильное утверждение для руководителей', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_05',
      code: 'R-934',
      name: 'Юридические сроки не укладываются в целевой lead time',
      description:
        'Внутренние регламенты юридической службы конфликтуют с целевым BPM.',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Дмитрий Орлов',
      created: '2026-01-27T12:00:00.000Z',
      updated: '2026-03-22T10:10:00.000Z',
      measures: [
        { label: 'Упрощённый маршрут для типовых сумм', done: false },
        { label: 'Единое хранилище шаблонов договоров', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_06',
      code: 'R-935',
      name: 'Информационная безопасность маршрутов с ПДн',
      description:
        'Требования ИБ к маршрутизации персональных данных в BPM не полностью формализованы.',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Анна Белова',
      created: '2026-02-10T09:40:00.000Z',
      updated: '2026-03-29T13:00:00.000Z',
      measures: [
        { label: 'Аудит ролевой модели', done: true },
        { label: 'Журналирование доступа к карточкам клиентов', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_07',
      code: 'R-936',
      name: 'Недостаточная проектная культура заказчика',
      description:
        'Нет устоявшихся процессов управления проектами; решения принимаются несистемно.',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Павел Смирнов',
      created: '2026-02-24T11:15:00.000Z',
      updated: '2026-04-01T08:00:00.000Z',
      measures: [
        { label: 'Назначение владельца продукта со стороны банка', done: false },
        { label: 'Еженедельный стейт с фиксацией решений', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_08',
      code: 'R-937',
      name: 'Взаимосвязь с проектом обновления core banking',
      description:
        'Параллельный проект меняет справочники продуктов; риск рассинхронизации.',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Демо Аккаунт',
      created: '2026-03-06T14:50:00.000Z',
      updated: '2026-04-02T15:30:00.000Z',
      measures: [
        { label: 'Кросс-проектный совет архитекторов', done: true },
        { label: 'Единый календарь релизов', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_09',
      code: 'R-938',
      name: 'Ошибки в настройке таймеров эскалации',
      description:
        'Риск пропуска дедлайнов комитета из-за неверных таймаутов в движке BPM.',
      category: 'Технологический',
      probability: 'Низкая',
      impact: 'Высокое',
      status: 'Закрыт',
      author: 'Ольга Новикова',
      created: '2026-03-19T07:00:00.000Z',
      updated: '2026-04-03T11:45:00.000Z',
      measures: [
        { label: 'Регрессионные тесты сценариев эскалации', done: true },
        { label: 'Плейбук для администраторов', done: true }
      ]
    }
  ]
}

const CRM: ProjectTpl = {
  id: 'proj_demo_l3_crm',
  name: 'CRM и мобильные кассы для дилерской сети',
  category: 'Операционный',
  description:
    'Облачная CRM с офлайн-режимом для торговых представителей, интеграция с ERP отгрузок и маркетинговыми акциями.',
  createdAt: '2026-01-22T10:00:00.000Z',
  updatedAt: '2026-03-27T12:00:00.000Z',
  risks: [
    {
      id: 'demo_r_crm_01',
      code: 'R-940',
      name: 'Качество мастер-данных клиентов и дублей',
      description:
        'Дубли контрагентов и устаревшие адреса доставки снижают эффективность маршрутов.',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2026-01-28T09:00:00.000Z',
      updated: '2026-03-10T10:00:00.000Z',
      measures: [
        { label: 'Алгоритм слияния дублей', done: false },
        { label: 'Политика золотой записи', done: true }
      ]
    },
    {
      id: 'demo_r_crm_02',
      code: 'R-941',
      name: 'Офлайн-синхронизация на Android в полях',
      description:
        'Конфликты версий заказов при возврате связи; риск потери строк заказа.',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Сергей Морозов',
      created: '2026-02-03T11:30:00.000Z',
      updated: '2026-03-14T15:20:00.000Z',
      measures: [
        { label: 'Стратегия last-write-wins + аудит', done: true },
        { label: 'Полевые испытания в 3 регионах', done: false }
      ]
    },
    {
      id: 'demo_r_crm_03',
      code: 'R-942',
      name: 'Обучение торговых представителей съедает пик сезона',
      description:
        'Внедрение совпадает с высоким сезоном; мало времени на обучение.',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Никита Фёдоров',
      created: '2026-02-11T08:45:00.000Z',
      updated: '2026-03-21T09:10:00.000Z',
      measures: [
        { label: 'Микрообучение в приложении', done: false },
        { label: 'Выделенные дни «тихого» пилота', done: true }
      ]
    },
    {
      id: 'demo_r_crm_04',
      code: 'R-943',
      name: 'Интеграция промо-цен с ERP без полной автоматизации',
      description:
        'Ручные корректировки цен в ERP приводят к расхождениям с CRM.',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Татьяна Лебедева',
      created: '2026-02-19T13:20:00.000Z',
      updated: '2026-03-26T11:00:00.000Z',
      measures: [
        { label: 'Сервис сверки цен раз в сутки', done: false },
        { label: 'Матрица ответственности за промо', done: true }
      ]
    },
    {
      id: 'demo_r_crm_05',
      code: 'R-944',
      name: 'Противодействие региональных дистрибьюторов новой прозрачности',
      description:
        'Часть партнёров не заинтересована в прозрачной отчётности по визитам.',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Алексей Петров',
      created: '2026-02-27T10:10:00.000Z',
      updated: '2026-04-01T14:40:00.000Z',
      measures: [
        { label: 'Пакет мотивации за использование CRM', done: false },
        { label: 'Договорные KPI по данным', done: false }
      ]
    },
    {
      id: 'demo_r_crm_06',
      code: 'R-945',
      name: 'Пропускная способность API при массовых выгрузках',
      description:
        'Ночные выгрузки заказов могут упираться в лимиты облачного шлюза.',
      category: 'Технологический',
      probability: 'Низкая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Демо Аккаунт',
      created: '2026-03-04T07:55:00.000Z',
      updated: '2026-04-02T08:30:00.000Z',
      measures: [
        { label: 'Пакетирование и очередь сообщений', done: true },
        { label: 'Автомасштабирование инстансов', done: false }
      ]
    },
    {
      id: 'demo_r_crm_07',
      code: 'R-946',
      name: 'Юридические ограничения на хранение коммуникаций',
      description:
        'Требования к хранению переписки с клиентами различаются по странам сети.',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Марина Соколова',
      created: '2026-03-11T12:40:00.000Z',
      updated: '2026-04-03T10:15:00.000Z',
      measures: [
        { label: 'Юридическая матрица по юрисдикциям', done: true },
        { label: 'Политики ретенции в CRM', done: false }
      ]
    },
    {
      id: 'demo_r_crm_08',
      code: 'R-947',
      name: 'Недостаточный бюджет на кастомные отчёты маркетинга',
      description:
        'Маркетинг ожидает отчёты по воронке, не входящие в базовую лицензию.',
      category: 'Финансовый',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Игорь Волков',
      created: '2026-03-20T09:00:00.000Z',
      updated: '2026-04-03T16:50:00.000Z',
      measures: [
        { label: 'Согласование scope отчётов фазой 2', done: false },
        { label: 'Временные выгрузки в BI', done: true }
      ]
    }
  ]
}

const WMS: ProjectTpl = {
  id: 'proj_demo_l3_wms',
  name: 'WMS: штрихкодирование и зонирование РЦ',
  category: 'Технологический',
  description:
    'Внедрение WMS на распределительном центре: адресное хранение, радиотерминалы, интеграция с транспортной TMS.',
  createdAt: '2026-03-08T07:30:00.000Z',
  updatedAt: '2026-04-02T09:00:00.000Z',
  risks: [
    {
      id: 'demo_r_wms_01',
      code: 'R-950',
      name: 'Не готовность аппаратной и сетевой среды зоны приёмки',
      description:
        'Классический риск: в нужное время не готова инфраструктура Wi‑Fi и серверов печати этикеток.',
      category: 'Технологический',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2026-03-10T08:00:00.000Z',
      updated: '2026-03-25T12:00:00.000Z',
      measures: [
        { label: 'Чек-лист готовности стойки и точек доступа', done: true },
        { label: 'Резервные точки доступа в зоне А', done: false }
      ]
    },
    {
      id: 'demo_r_wms_02',
      code: 'R-951',
      name: 'Ошибки при инвентаризации во время переезда SKU',
      description:
        'Параллельный перенос ассортимента между зонами даёт расхождения остатков.',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Елена Кузнецова',
      created: '2026-03-12T10:30:00.000Z',
      updated: '2026-03-28T14:20:00.000Z',
      measures: [
        { label: 'Полное замораживание движений на ночь переезда', done: false },
        { label: 'Контрольные пересчёты по A-классу', done: true }
      ]
    },
    {
      id: 'demo_r_wms_03',
      code: 'R-952',
      name: 'Сопротивление кладовщиков новой дисциплине сканирования',
      description:
        'Персонал привык к «знанию наизусть» ячеек; риск обхода сканирования.',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Дмитрий Орлов',
      created: '2026-03-15T07:15:00.000Z',
      updated: '2026-03-30T09:00:00.000Z',
      measures: [
        { label: 'Система KPI по ошибкам подбора', done: false },
        { label: 'Наставники в каждой смене', done: true }
      ]
    },
    {
      id: 'demo_r_wms_04',
      code: 'R-953',
      name: 'Интеграция с TMS и окнами отгрузки',
      description:
        'Сложность синхронизации слотов погрузки с фактическим комплектованием.',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Анна Белова',
      created: '2026-03-18T11:45:00.000Z',
      updated: '2026-04-01T10:30:00.000Z',
      measures: [
        { label: 'Обмен статусами отгрузки в реальном времени', done: false },
        { label: 'Ручной диспетчер на переходный период', done: true }
      ]
    },
    {
      id: 'demo_r_wms_05',
      code: 'R-954',
      name: 'Просчёт объёма работ по конвертации адресов хранения',
      description:
        'Объёмы перекодировки ячеек занижены; риск срыва финальной миграции.',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Павел Смирнов',
      created: '2026-03-21T13:00:00.000Z',
      updated: '2026-04-03T08:15:00.000Z',
      measures: [
        { label: 'Пересчёт объёма с выборочной физической проверкой', done: true },
        { label: 'Дополнительная бригада маркировки', done: false }
      ]
    },
    {
      id: 'demo_r_wms_06',
      code: 'R-955',
      name: 'Отказы оборудования ТСД в морозильной зоне',
      description:
        'Эксплуатационный риск: аккумуляторы и экраны терминалов в морозе.',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Ольга Новикова',
      created: '2026-03-24T09:20:00.000Z',
      updated: '2026-04-03T15:00:00.000Z',
      measures: [
        { label: 'Закупка морозостойких моделей ТСД', done: false },
        { label: 'Запасные устройства на смену', done: true }
      ]
    }
  ]
}

const ALL_PROJECTS: ProjectTpl[] = [MES, ERP, BPM, CRM, WMS]

export async function ensureDemoWorldSeeded(): Promise<void> {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(DEMO_WORLD_KEY)) return

  await maybeBootstrapInvitationsFromLegacySingletonIdb()
  await reconcileAllProjectStoresIntoShared()
  await dbUpgradeProjectShapesIfNeeded()

  const existing = await dbGetAllProjects()
  if (existing.some((p) => p.id.startsWith('proj_demo_l3_'))) {
    localStorage.setItem(DEMO_WORLD_KEY, '1')
    return
  }

  const { userId, email } = getDemoCredentials()
  let list: ProjectRecord[] = [...existing]
  const riskRows: RiskRecord[] = []

  for (const tpl of ALL_PROJECTS) {
    const code = nextProjectCode(list)
    const row = normalizeProjectRecord({
      id: tpl.id,
      code,
      name: tpl.name,
      category: tpl.category,
      ownerUserId: userId,
      createdAt: tpl.createdAt,
      updatedAt: tpl.updatedAt,
      isPublicLegacy: false,
      status: 'Активен',
      description: tpl.description,
      activityLog: [
        { id: `${tpl.id}-c`, at: tpl.createdAt, message: 'Проект создан' },
        {
          id: `${tpl.id}-u`,
          at: tpl.updatedAt,
          message: 'Уточнены цели этапов и зоны ответственности'
        }
      ]
    })
    await dbPutProject(row)
    await dbPutMember({
      id: `${tpl.id}__${userId}`,
      projectId: tpl.id,
      userId,
      email,
      joinedAt: tpl.createdAt
    })
    list = [...list, row]
    for (const rs of tpl.risks) {
      riskRows.push(buildRisk(tpl.name, tpl.id, rs))
    }
  }

  mergeRisksIntoSharedCatalog(riskRows)

  saveProfileForUser(userId, {
    firstName: 'Демо',
    lastName: 'Аккаунт',
    workplace: 'ООО Демо',
    department: 'Управление демо-аккаунтами',
    position: 'Специалист по демо-аккаунтам',
    about: 'Демо-информация'
  })

  localStorage.setItem(DEMO_WORLD_KEY, '1')
  window.dispatchEvent(new CustomEvent('riskhub-session-changed'))
}
