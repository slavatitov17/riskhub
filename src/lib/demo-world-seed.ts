import { getDemoCredentials, getUsers, saveUsers } from '@/lib/auth-storage'
import {
  normalizeProjectRecord,
  nextProjectCode,
  type ProjectRecord
} from '@/lib/project-types'
import {
  dbDeleteProjectCascade,
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

const DEMO_WORLD_KEY = 'riskhub_demo_l3_world_v3'

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

interface FictionalUser {
  userId: string
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
}

const FICTIONAL_USERS: FictionalUser[] = [
  {
    userId: 'u_dem_al_pet',
    firstName: 'Алексей',
    lastName: 'Петров',
    email: 'a.petrov@demo.riskhub',
    department: 'Управление проектами',
    position: 'Руководитель проекта'
  },
  {
    userId: 'u_dem_ma_sok',
    firstName: 'Марина',
    lastName: 'Соколова',
    email: 'm.sokolova@demo.riskhub',
    department: 'Функциональный блок',
    position: 'Бизнес-аналитик'
  },
  {
    userId: 'u_dem_ig_vol',
    firstName: 'Игорь',
    lastName: 'Волков',
    email: 'i.volkov@demo.riskhub',
    department: 'Техническая архитектура',
    position: 'Системный архитектор'
  },
  {
    userId: 'u_dem_el_kuz',
    firstName: 'Елена',
    lastName: 'Кузнецова',
    email: 'e.kuznetsova@demo.riskhub',
    department: 'Управление требованиями',
    position: 'Аналитик требований'
  },
  {
    userId: 'u_dem_dm_orl',
    firstName: 'Дмитрий',
    lastName: 'Орлов',
    email: 'd.orlov@demo.riskhub',
    department: 'Финансовый контроль',
    position: 'Финансовый аналитик'
  },
  {
    userId: 'u_dem_an_bel',
    firstName: 'Анна',
    lastName: 'Белова',
    email: 'a.belova@demo.riskhub',
    department: 'Управление рисками',
    position: 'Риск-менеджер'
  },
  {
    userId: 'u_dem_pv_smi',
    firstName: 'Павел',
    lastName: 'Смирнов',
    email: 'p.smirnov@demo.riskhub',
    department: 'Интеграция и инфраструктура',
    position: 'Инженер интеграции'
  },
  {
    userId: 'u_dem_ol_nov',
    firstName: 'Ольга',
    lastName: 'Новикова',
    email: 'o.novikova@demo.riskhub',
    department: 'Управление изменениями',
    position: 'Менеджер по изменениям'
  },
  {
    userId: 'u_dem_sg_mor',
    firstName: 'Сергей',
    lastName: 'Морозов',
    email: 's.morozov@demo.riskhub',
    department: 'Разработка и тестирование',
    position: 'Ведущий разработчик'
  },
  {
    userId: 'u_dem_nk_fed',
    firstName: 'Никита',
    lastName: 'Фёдоров',
    email: 'n.fedorov@demo.riskhub',
    department: 'Техническая поддержка',
    position: 'Технический консультант'
  },
  {
    userId: 'u_dem_ta_leb',
    firstName: 'Татьяна',
    lastName: 'Лебедева',
    email: 't.lebedeva@demo.riskhub',
    department: 'Документация',
    position: 'Бизнес-аналитик'
  }
]

function userByName(name: string): FictionalUser | undefined {
  return FICTIONAL_USERS.find(
    (u) => `${u.firstName} ${u.lastName}` === name
  )
}

function hashTopic(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36).slice(0, 10)
}

function commentAtWorkdayMinutes(
  startIso: string,
  index: number,
  total: number
): string {
  const base = new Date(startIso)
  const y = base.getFullYear()
  const mo = base.getMonth()
  const d = base.getDate()
  const workStartMin = 8 * 60 + 30
  const workEndMin = 17 * 60
  const span = workEndMin - workStartMin
  const totalSafe = Math.max(1, total)
  const minuteOfDay =
    totalSafe <= 1
      ? workStartMin + Math.floor(span / 2)
      : workStartMin + Math.round((span * index) / (totalSafe - 1))
  const hh = Math.floor(minuteOfDay / 60)
  const mm = minuteOfDay % 60
  return new Date(y, mo, d, hh, mm, 0, 0).toISOString()
}

function makeThread(riskTitle: string, startIso: string): RiskComment[] {
  const bodies = [
    `Коллеги, нужно определить владельца риска "${riskTitle}" и назначить срок первичного анализа`,
    '@Марина Соколова, можешь уточнить позицию функционального заказчика по этому направлению',
    'Алексей, связалась с заказчиком и жду подтверждения до конца недели',
    'Хорошо, пока ждём ответ, предлагаю параллельно провести встречу с архитекторами',
    '@Дмитрий Орлов, подготовь пожалуйста оценку финансового влияния для следующего совещания',
    'На стороне заказчика вижу сопротивление из-за параллельной работы в двух системах',
    'Можно смягчить через пилот на ограниченном контуре, но тогда общий план сдвинется на несколько недель',
    'Без актуальных данных из действующей системы требования к миграции останутся неполными',
    'Анна, согласен с твоей позицией, выносим вопрос на управляющий комитет',
    'Подготовлю два сценария, ускоренный с урезанным охватом и базовый со штатной моделью',
    '@Игорь Волков, каков текущий статус готовности технической среды для следующего этапа',
    'Фиксирую итог, риск переводится в работу с еженедельным контролем и чек-листом мер'
  ]
  return bodies.map((text, i) => ({
    id: `cm_${hashTopic(riskTitle)}_${i}`,
    at: commentAtWorkdayMinutes(startIso, i, bodies.length),
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
  memberUserIds: string[]
  risks: RiskSeed[]
}

const MES: ProjectTpl = {
  id: 'proj_demo_l3_mes',
  name: 'MES-система для управления производством в четвёртом цехе',
  category: 'Технологический',
  description:
    'Внедрение MES для оперативного учёта запусков, сменных заданий и контроля незавершённого производства с интеграцией в ERP и систему управления складом',
  createdAt: '2025-05-12T09:30:00.000Z',
  updatedAt: '2025-11-03T14:10:00.000Z',
  memberUserIds: [
    'u_dem_al_pet',
    'u_dem_ma_sok',
    'u_dem_ig_vol',
    'u_dem_el_kuz',
    'u_dem_dm_orl',
    'u_dem_ol_nov'
  ],
  risks: [
    {
      id: 'demo_r_mes_01',
      code: 'R-910',
      name: 'Несинхронизированные справочники между MES и ERP',
      description:
        'Персонал использует разные источники НСИ и не налажена синхронизация данных между контурами, что приводит к расхождениям в учёте производственных операций',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2025-05-28T10:00:00.000Z',
      updated: '2025-09-14T11:20:00.000Z',
      measures: [
        { label: 'Утвердить регламент обновления НСИ и назначить ответственных', done: true },
        { label: 'Настроить ежедневную репликацию справочников', done: false },
        { label: 'Провести пилотную сверку на 200 позициях номенклатуры', done: false }
      ]
    },
    {
      id: 'demo_r_mes_02',
      code: 'R-911',
      name: 'Длительная параллельная работа в устаревшей и внедряемой системе',
      description:
        'Продолжительный период двойного ввода данных в старую и внедряемую систему увеличивает нагрузку на персонал и повышает вероятность ошибок учёта',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Марина Соколова',
      created: '2025-06-11T08:15:00.000Z',
      updated: '2025-10-02T16:40:00.000Z',
      measures: [
        { label: 'Сократить период двойного ввода до шести недель', done: false },
        { label: 'Организовать дополнительную смену операторов на переходный период', done: false }
      ]
    },
    {
      id: 'demo_r_mes_03',
      code: 'R-912',
      name: 'Недостаточная производительность расчёта сменных планов',
      description:
        'Платформа может не обеспечить требуемое время пересчёта при пиковых объёмах заказов в период высокой загрузки производства',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Игорь Волков',
      created: '2025-07-09T13:00:00.000Z',
      updated: '2026-01-19T09:05:00.000Z',
      measures: [
        { label: 'Провести нагрузочное тестирование на данных за полугодие', done: true },
        { label: 'Разработать план масштабирования серверов приложений', done: false }
      ]
    },
    {
      id: 'demo_r_mes_04',
      code: 'R-913',
      name: 'Неполные требования к учёту незавершённого производства',
      description:
        'Технические постановки от заказчика не содержат полного описания переделов, что создаёт риск некорректной модели учёта НЗП в MES',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Елена Кузнецова',
      created: '2025-08-22T07:45:00.000Z',
      updated: '2025-12-08T12:00:00.000Z',
      measures: [
        { label: 'Провести серию воркшопов с технологами цеха', done: true },
        { label: 'Подготовить документ "Правила учёта НЗП" версии 1', done: false }
      ]
    },
    {
      id: 'demo_r_mes_05',
      code: 'R-914',
      name: 'Отсутствие критериев приёмки результатов планирования',
      description:
        'Нет согласованных механизмов оценки адекватности расчётов новой системы относительно реальных производственных бизнес-процессов',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Демо Аккаунт',
      created: '2025-09-05T15:30:00.000Z',
      updated: '2026-02-11T10:15:00.000Z',
      measures: [
        { label: 'Разработать матрицу KPI для сравнения с эталонными сменами', done: false },
        { label: 'Согласовать и подписать критерии приёмки с владельцем производства', done: false }
      ]
    },
    {
      id: 'demo_r_mes_06',
      code: 'R-915',
      name: 'Задержка готовности интеграции с системой управления складом',
      description:
        'Смежный проект склада переносит реализацию контура штрихкодирования и подтверждений отгрузок, блокируя часть функциональности MES',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Павел Смирнов',
      created: '2025-10-17T11:10:00.000Z',
      updated: '2026-03-01T14:50:00.000Z',
      measures: [
        { label: 'Согласовать совместный план интерфейсов со складской командой', done: true },
        { label: 'Реализовать временную ручную загрузку подтверждений отгрузок', done: false }
      ]
    },
    {
      id: 'demo_r_mes_07',
      code: 'R-916',
      name: 'Ограниченный бюджет на разработку аналитических отчётов MES',
      description:
        'Внеконтрактные отчёты и дашборды производственного мониторинга могут не войти в текущий бюджет проекта',
      category: 'Финансовый',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Дмитрий Орлов',
      created: '2025-11-26T09:00:00.000Z',
      updated: '2026-03-20T08:30:00.000Z',
      measures: [
        { label: 'Приоритизировать перечень отчётов совместно с заказчиком', done: false },
        { label: 'Подготовить оценку дополнительных трудозатрат интегратора', done: true }
      ]
    },
    {
      id: 'demo_r_mes_08',
      code: 'R-917',
      name: 'Низкая вовлечённость сменных мастеров в пилотное внедрение',
      description:
        'Сменные мастера перегружены текущей работой и не имеют достаточно времени для участия в обучении и тестировании MES',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Мониторинг',
      author: 'Ольга Новикова',
      created: '2026-01-08T12:20:00.000Z',
      updated: '2026-03-28T17:00:00.000Z',
      measures: [
        { label: 'Предусмотреть оплату сверхурочных на период пилота', done: false },
        { label: 'Назначить наставников из числа чемпионов цеха', done: true }
      ]
    }
  ]
}

const ERP: ProjectTpl = {
  id: 'proj_demo_l3_erp',
  name: 'ERP-система для финансового учёта и консолидации холдинга',
  category: 'Финансовый',
  description:
    'Замена разрозненных учётных контуров на единый ERP-модуль финансов с поддержкой мультивалютности, международной отчётности и консолидации данных дочерних обществ',
  createdAt: '2025-08-03T11:00:00.000Z',
  updatedAt: '2026-02-14T13:25:00.000Z',
  memberUserIds: [
    'u_dem_al_pet',
    'u_dem_ma_sok',
    'u_dem_dm_orl',
    'u_dem_an_bel',
    'u_dem_pv_smi',
    'u_dem_sg_mor',
    'u_dem_nk_fed',
    'u_dem_ta_leb'
  ],
  risks: [
    {
      id: 'demo_r_erp_01',
      code: 'R-920',
      name: 'Изменение требований к отчётности в ходе проекта',
      description:
        'Заказчик корректирует состав форм и регламенты сдачи отчётности уже на этапе ввода системы в эксплуатацию, что влечёт доработки в готовом решении',
      category: 'Финансовый',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2025-08-19T10:30:00.000Z',
      updated: '2025-12-01T09:00:00.000Z',
      measures: [
        { label: 'Ввести процесс управления изменениями с оценкой влияния на сроки', done: true },
        { label: 'Зарезервировать буфер на доработки отчётов в размере 15 процентов', done: false }
      ]
    },
    {
      id: 'demo_r_erp_02',
      code: 'R-921',
      name: 'Низкое качество данных в подключаемых источниках',
      description:
        'Неудовлетворительное качество данных в системах-источниках создаёт риск искажения управленческой отчётности после миграции в ERP',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Сергей Морозов',
      created: '2025-09-02T14:15:00.000Z',
      updated: '2026-01-10T11:40:00.000Z',
      measures: [
        { label: 'Провести профилирование и чистку ключевых справочников', done: false },
        { label: 'Настроить правила блокировки проводок при ошибках в НСИ', done: true }
      ]
    },
    {
      id: 'demo_r_erp_03',
      code: 'R-922',
      name: 'Нестабильное финансирование этапов внедрения',
      description:
        'Возможные задержки оплат по договору с интегратором могут привести к простою команды и сдвигу контрольных точек календарного плана',
      category: 'Финансовый',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Мониторинг',
      author: 'Анна Белова',
      created: '2025-10-08T08:00:00.000Z',
      updated: '2026-02-20T15:10:00.000Z',
      measures: [
        { label: 'Сформировать помесячный план движения денежных средств по проекту', done: true },
        { label: 'Зафиксировать триггеры приостановки работ при задержке платежа более 30 дней', done: false }
      ]
    },
    {
      id: 'demo_r_erp_04',
      code: 'R-923',
      name: 'Недостаточный контроль расходования бюджета проекта',
      description:
        'Слабая прозрачность фактических трудозатрат команды и подрядных счетов по этапам снижает управляемость стоимостью проекта',
      category: 'Финансовый',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Никита Фёдоров',
      created: '2025-11-11T13:45:00.000Z',
      updated: '2026-03-05T10:00:00.000Z',
      measures: [
        { label: 'Проводить еженедельный статус-отчёт по освоению бюджета', done: true },
        { label: 'Организовать сверку с планом закупок подрядчика', done: false }
      ]
    },
    {
      id: 'demo_r_erp_05',
      code: 'R-924',
      name: 'Конфликт учётных политик холдинга и дочерних обществ',
      description:
        'Разные требования к учётной политике и срокам закрытия отчётного периода в дочерних обществах осложняют унификацию настроек ERP',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Татьяна Лебедева',
      created: '2025-12-03T09:20:00.000Z',
      updated: '2026-03-18T12:30:00.000Z',
      measures: [
        { label: 'Разработать единый регламент закрытия отчётного месяца', done: false },
        { label: 'Создать рабочую группу из финансовых директоров дочерних обществ', done: true }
      ]
    },
    {
      id: 'demo_r_erp_06',
      code: 'R-925',
      name: 'Превышение объёма работ по миграции исторических остатков',
      description:
        'Перенос сальдо и оборотов за несколько лет в ERP оказался значительно сложнее запланированного и требует дополнительных ресурсов',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Закрыт',
      author: 'Демо Аккаунт',
      created: '2026-01-15T07:50:00.000Z',
      updated: '2026-03-25T16:00:00.000Z',
      measures: [
        { label: 'Реализовать поэтапную миграцию данных по компаниям', done: true },
        { label: 'Настроить автоматические контрольные сверки оборотов', done: true }
      ]
    },
    {
      id: 'demo_r_erp_07',
      code: 'R-926',
      name: 'Изменение регуляторных требований РСБУ и МСФО в год ввода',
      description:
        'Новые требования к раскрытию финансовой информации могут потребовать доработок уже настроенных отчётных форм незадолго до старта продуктива',
      category: 'Внешний',
      probability: 'Низкая',
      impact: 'Высокое',
      status: 'Мониторинг',
      author: 'Алексей Петров',
      created: '2026-02-02T11:00:00.000Z',
      updated: '2026-03-30T09:15:00.000Z',
      measures: [
        { label: 'Организовать мониторинг проектов нормативных правовых актов', done: true },
        { label: 'Зарезервировать ресурс на доработку отчётности', done: false }
      ]
    }
  ]
}

const BPM: ProjectTpl = {
  id: 'proj_demo_l3_bpm',
  name: 'ERP-система для управления закупками и контроля поставщиков',
  category: 'Операционный',
  description:
    'Внедрение модуля закупок ERP для автоматизации тендерных процедур, управления договорами с поставщиками и контроля исполнения поставок',
  createdAt: '2025-10-18T08:45:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z',
  memberUserIds: [
    'u_dem_al_pet',
    'u_dem_ig_vol',
    'u_dem_el_kuz',
    'u_dem_pv_smi',
    'u_dem_ol_nov',
    'u_dem_nk_fed',
    'u_dem_sg_mor'
  ],
  risks: [
    {
      id: 'demo_r_bpm_01',
      code: 'R-930',
      name: 'Низкая готовность поставщиков к электронному документообороту',
      description:
        'Большая часть поставщиков не имеет технической возможности или опыта работы с EDI и порталами самообслуживания в ERP',
      category: 'Организационный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2025-10-29T09:00:00.000Z',
      updated: '2026-01-22T14:00:00.000Z',
      measures: [
        { label: 'Провести серию обучающих сессий для ключевых поставщиков', done: true },
        { label: 'Ввести KPI по доле поставщиков в ЭДО', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_02',
      code: 'R-931',
      name: 'Неформализованные процессы согласования заявок на закупку',
      description:
        'Отсутствует утверждённая модель процесса в нотации BPMN, что создаёт риск автоматизации неоптимальных процедур согласования',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Марина Соколова',
      created: '2025-11-14T10:20:00.000Z',
      updated: '2026-02-05T11:30:00.000Z',
      measures: [
        { label: 'Разработать BPMN-схемы для основных маршрутов согласования', done: false },
        { label: 'Согласовать схемы с юридической службой и службой комплаенс', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_03',
      code: 'R-932',
      name: 'Задержка интеграции с модулем управления запасами',
      description:
        'Техническая готовность интерфейса обмена данными о запасах и заявках на пополнение может запоздать относительно плана внедрения',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Игорь Волков',
      created: '2025-12-01T13:00:00.000Z',
      updated: '2026-03-08T09:45:00.000Z',
      measures: [
        { label: 'Развернуть тестовую среду для отладки интеграционного API', done: true },
        { label: 'Предусмотреть резервный ручной ввод остатков на переходный период', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_04',
      code: 'R-933',
      name: 'Перегрузка сотрудников в период двойного ввода данных',
      description:
        'Сотрудники отдела закупок не готовы выдерживать дисциплину SLA по задачам при одновременной работе в старой и новой системе',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Елена Кузнецова',
      created: '2026-01-09T08:30:00.000Z',
      updated: '2026-03-15T16:20:00.000Z',
      measures: [
        { label: 'Настроить механизмы делегирования и замещения в оргструктуре', done: false },
        { label: 'Реализовать мобильное согласование заявок для руководителей', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_05',
      code: 'R-934',
      name: 'Несоответствие шаблонов договоров требованиям модуля закупок',
      description:
        'Внутренние шаблоны типовых договоров не адаптированы к структуре данных ERP, что потребует доработки юридических документов',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Дмитрий Орлов',
      created: '2026-01-27T12:00:00.000Z',
      updated: '2026-03-22T10:10:00.000Z',
      measures: [
        { label: 'Создать упрощённый маршрут согласования для типовых договоров', done: false },
        { label: 'Сформировать единое хранилище шаблонов договоров в ERP', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_06',
      code: 'R-935',
      name: 'Требования информационной безопасности к тендерным данным',
      description:
        'Требования ИБ к разграничению доступа к коммерческим предложениям и тендерным данным в ERP не полностью формализованы',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Анна Белова',
      created: '2026-02-10T09:40:00.000Z',
      updated: '2026-03-29T13:00:00.000Z',
      measures: [
        { label: 'Провести аудит ролевой модели доступа в модуле закупок', done: true },
        { label: 'Настроить журналирование доступа к тендерным документам', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_07',
      code: 'R-936',
      name: 'Недостаточная проектная зрелость у ключевых заказчиков',
      description:
        'В организации заказчика отсутствуют устоявшиеся процессы управления ИТ-проектами, что приводит к несистемному принятию решений',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Павел Смирнов',
      created: '2026-02-24T11:15:00.000Z',
      updated: '2026-04-01T08:00:00.000Z',
      measures: [
        { label: 'Назначить владельца продукта со стороны заказчика', done: false },
        { label: 'Проводить еженедельные стейт-митинги с фиксацией решений', done: true }
      ]
    },
    {
      id: 'demo_r_bpm_08',
      code: 'R-937',
      name: 'Зависимость от параллельного обновления финансового модуля ERP',
      description:
        'Параллельный проект по обновлению финансового блока меняет справочники контрагентов и структуру аналитики, создавая риск рассинхронизации',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Демо Аккаунт',
      created: '2026-03-06T14:50:00.000Z',
      updated: '2026-04-02T15:30:00.000Z',
      measures: [
        { label: 'Создать кросс-проектный совет архитекторов', done: true },
        { label: 'Согласовать единый календарь релизов обоих проектов', done: false }
      ]
    },
    {
      id: 'demo_r_bpm_09',
      code: 'R-938',
      name: 'Ошибки настройки автоматических уведомлений о дедлайнах тендера',
      description:
        'Неверно настроенные таймеры уведомлений в модуле закупок могут приводить к пропуску плановых дат завершения тендерных процедур',
      category: 'Технологический',
      probability: 'Низкая',
      impact: 'Высокое',
      status: 'Закрыт',
      author: 'Ольга Новикова',
      created: '2026-03-19T07:00:00.000Z',
      updated: '2026-04-03T11:45:00.000Z',
      measures: [
        { label: 'Написать регрессионные тесты сценариев уведомлений', done: true },
        { label: 'Подготовить плейбук для администраторов модуля', done: true }
      ]
    }
  ]
}

const CRM: ProjectTpl = {
  id: 'proj_demo_l3_crm',
  name: 'MES-система для планирования производственных заданий и расчёта эффективности оборудования',
  category: 'Технологический',
  description:
    'Внедрение MES для формирования сменно-суточных заданий, расчёта показателя общей эффективности оборудования и контроля выполнения производственной программы',
  createdAt: '2026-01-22T10:00:00.000Z',
  updatedAt: '2026-03-27T12:00:00.000Z',
  memberUserIds: [
    'u_dem_al_pet',
    'u_dem_ma_sok',
    'u_dem_dm_orl',
    'u_dem_an_bel',
    'u_dem_sg_mor'
  ],
  risks: [
    {
      id: 'demo_r_crm_01',
      code: 'R-940',
      name: 'Недостаточная детализация маршрутных карт для планирования',
      description:
        'Маршрутные карты не содержат нормативов по переходам и режимам обработки, что не позволяет строить точные производственные планы в MES',
      category: 'Операционный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2026-01-28T09:00:00.000Z',
      updated: '2026-03-10T10:00:00.000Z',
      measures: [
        { label: 'Запустить проект обогащения маршрутных карт совместно с технологами', done: false },
        { label: 'Утвердить форму нормативной маршрутной карты для MES', done: true }
      ]
    },
    {
      id: 'demo_r_crm_02',
      code: 'R-941',
      name: 'Конфликты данных при офлайн-работе операторов на планшетах',
      description:
        'При восстановлении связи возможны конфликты версий производственных заданий, что создаёт риск потери или дублирования строк в журнале выработки',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Сергей Морозов',
      created: '2026-02-03T11:30:00.000Z',
      updated: '2026-03-14T15:20:00.000Z',
      measures: [
        { label: 'Реализовать стратегию слияния last-write-wins с ведением аудит-лога', done: true },
        { label: 'Провести полевые испытания в трёх производственных цехах', done: false }
      ]
    },
    {
      id: 'demo_r_crm_03',
      code: 'R-942',
      name: 'Совпадение периода обучения с пиком производственного сезона',
      description:
        'Внедрение приходится на сезон максимальной загрузки оборудования и персонала, что резко ограничивает время на обучение и тестирование',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Никита Фёдоров',
      created: '2026-02-11T08:45:00.000Z',
      updated: '2026-03-21T09:10:00.000Z',
      measures: [
        { label: 'Встроить микрообучение непосредственно в интерфейс MES', done: false },
        { label: 'Выделить дни тихого пилота без нормативной нагрузки на персонал', done: true }
      ]
    },
    {
      id: 'demo_r_crm_04',
      code: 'R-943',
      name: 'Расхождение плановых и фактических данных о выходе продукции',
      description:
        'Ручные корректировки фактической выработки операторами приводят к систематическим расхождениям с плановыми показателями в MES',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Татьяна Лебедева',
      created: '2026-02-19T13:20:00.000Z',
      updated: '2026-03-26T11:00:00.000Z',
      measures: [
        { label: 'Настроить сервис автосверки данных раз в час', done: false },
        { label: 'Разработать матрицу ответственности за корректировки в MES', done: true }
      ]
    },
    {
      id: 'demo_r_crm_05',
      code: 'R-944',
      name: 'Противодействие линейных руководителей прозрачному учёту ОЭЕ',
      description:
        'Часть начальников участков не заинтересована в объективной прозрачности показателей эффективности оборудования и может саботировать ввод данных',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Алексей Петров',
      created: '2026-02-27T10:10:00.000Z',
      updated: '2026-04-01T14:40:00.000Z',
      measures: [
        { label: 'Ввести систему поощрений за корректный ввод данных в MES', done: false },
        { label: 'Закрепить в KPI начальников участков показатели ОЭЕ', done: false }
      ]
    },
    {
      id: 'demo_r_crm_06',
      code: 'R-945',
      name: 'Ограниченная пропускная способность API при сборе данных с ПЛК',
      description:
        'При массовом поступлении телеметрии с программируемых логических контроллеров в часы пик интеграционный API может не справляться с нагрузкой',
      category: 'Технологический',
      probability: 'Низкая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Демо Аккаунт',
      created: '2026-03-04T07:55:00.000Z',
      updated: '2026-04-02T08:30:00.000Z',
      measures: [
        { label: 'Реализовать буферизацию и очередь сообщений от ПЛК', done: true },
        { label: 'Настроить автомасштабирование инстансов API', done: false }
      ]
    },
    {
      id: 'demo_r_crm_07',
      code: 'R-946',
      name: 'Ограничения на хранение данных о производственных инцидентах',
      description:
        'Требования к срокам и форматам хранения данных о нарушениях производственного процесса различаются в зависимости от регуляторной юрисдикции',
      category: 'Внешний',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Марина Соколова',
      created: '2026-03-11T12:40:00.000Z',
      updated: '2026-04-03T10:15:00.000Z',
      measures: [
        { label: 'Сформировать юридическую матрицу по юрисдикциям для MES', done: true },
        { label: 'Настроить политики ретенции данных в системе', done: false }
      ]
    },
    {
      id: 'demo_r_crm_08',
      code: 'R-947',
      name: 'Недостаточный бюджет на разработку специализированных отчётов',
      description:
        'Производственный директор ожидает отчёты по ОЭЕ и потерям в разрезе оборудования, которые не входят в базовую конфигурацию MES',
      category: 'Финансовый',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Игорь Волков',
      created: '2026-03-20T09:00:00.000Z',
      updated: '2026-04-03T16:50:00.000Z',
      measures: [
        { label: 'Согласовать расширенный перечень отчётов в рамках второй фазы', done: false },
        { label: 'Подготовить временные выгрузки в BI для ключевых показателей', done: true }
      ]
    }
  ]
}

const WMS: ProjectTpl = {
  id: 'proj_demo_l3_wms',
  name: 'ERP-система для управления персоналом и кадрового учёта',
  category: 'Организационный',
  description:
    'Внедрение HR-модуля ERP для автоматизации кадрового делопроизводства, управления оргструктурой, табельного учёта и расчёта заработной платы',
  createdAt: '2026-03-08T07:30:00.000Z',
  updatedAt: '2026-04-02T09:00:00.000Z',
  memberUserIds: [
    'u_dem_al_pet',
    'u_dem_ma_sok',
    'u_dem_ig_vol',
    'u_dem_el_kuz',
    'u_dem_dm_orl',
    'u_dem_an_bel',
    'u_dem_pv_smi',
    'u_dem_ol_nov',
    'u_dem_ta_leb'
  ],
  risks: [
    {
      id: 'demo_r_wms_01',
      code: 'R-950',
      name: 'Неготовность инфраструктуры для интеграции с системами контроля доступа',
      description:
        'В нужные сроки не подготовлена интеграция HR-модуля ERP с системой пропусков и биометрического контроля доступа на предприятии',
      category: 'Технологический',
      probability: 'Высокая',
      impact: 'Высокое',
      status: 'В работе',
      author: 'Демо Аккаунт',
      created: '2026-03-10T08:00:00.000Z',
      updated: '2026-03-25T12:00:00.000Z',
      measures: [
        { label: 'Подготовить чек-лист готовности инфраструктуры и точек интеграции', done: true },
        { label: 'Предусмотреть резервный ручной режим до завершения интеграции', done: false }
      ]
    },
    {
      id: 'demo_r_wms_02',
      code: 'R-951',
      name: 'Ошибки при переносе исторических кадровых данных',
      description:
        'Параллельный перенос сведений о сотрудниках из нескольких разрозненных источников порождает дубли и расхождения в кадровом учёте',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Высокое',
      status: 'Активный',
      author: 'Елена Кузнецова',
      created: '2026-03-12T10:30:00.000Z',
      updated: '2026-03-28T14:20:00.000Z',
      measures: [
        { label: 'Провести полное замораживание изменений на период финальной миграции', done: false },
        { label: 'Выполнить контрольные пересчёты по приоритетным категориям сотрудников', done: true }
      ]
    },
    {
      id: 'demo_r_wms_03',
      code: 'R-952',
      name: 'Сопротивление HR-специалистов переходу на новые процессы',
      description:
        'Сотрудники кадровой службы привыкли к существующим инструментам и воспринимают внедрение ERP как усложнение привычной работы',
      category: 'Организационный',
      probability: 'Высокая',
      impact: 'Среднее',
      status: 'Мониторинг',
      author: 'Дмитрий Орлов',
      created: '2026-03-15T07:15:00.000Z',
      updated: '2026-03-30T09:00:00.000Z',
      measures: [
        { label: 'Ввести систему KPI по точности и своевременности ввода данных', done: false },
        { label: 'Назначить наставников в каждом подразделении HR-службы', done: true }
      ]
    },
    {
      id: 'demo_r_wms_04',
      code: 'R-953',
      name: 'Интеграция с расчётной системой заработной платы',
      description:
        'Сложность синхронизации данных о начислениях и удержаниях между HR-модулем ERP и внешней расчётной системой может задержать переход',
      category: 'Технологический',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Анна Белова',
      created: '2026-03-18T11:45:00.000Z',
      updated: '2026-04-01T10:30:00.000Z',
      measures: [
        { label: 'Наладить обмен расчётными данными в режиме реального времени', done: false },
        { label: 'Назначить ручного диспетчера данных на переходный период', done: true }
      ]
    },
    {
      id: 'demo_r_wms_05',
      code: 'R-954',
      name: 'Недооценка объёма работ по конфигурации оргструктуры',
      description:
        'Объёмы работ по настройке иерархии подразделений и должностей в ERP оказались значительно занижены, что угрожает срокам финальной миграции',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'Активный',
      author: 'Павел Смирнов',
      created: '2026-03-21T13:00:00.000Z',
      updated: '2026-04-03T08:15:00.000Z',
      measures: [
        { label: 'Пересчитать объём с выборочной физической проверкой структуры', done: true },
        { label: 'Привлечь дополнительных консультантов по настройке HR-модуля', done: false }
      ]
    },
    {
      id: 'demo_r_wms_06',
      code: 'R-955',
      name: 'Проблемы с биометрической идентификацией сотрудников',
      description:
        'Оборудование для биометрического считывания в ряде корпусов не обеспечивает стабильную работу в условиях высокой запылённости',
      category: 'Операционный',
      probability: 'Средняя',
      impact: 'Среднее',
      status: 'В работе',
      author: 'Ольга Новикова',
      created: '2026-03-24T09:20:00.000Z',
      updated: '2026-04-03T15:00:00.000Z',
      measures: [
        { label: 'Закупить защищённые модели считывателей для пыльных помещений', done: false },
        { label: 'Предусмотреть резервные считыватели на каждой проходной', done: true }
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

  // Remove old generation demo data so new content replaces it
  const allProjects = await dbGetAllProjects()
  const oldDemoProjects = allProjects.filter((p) => p.id.startsWith('proj_demo_l3_'))
  for (const old of oldDemoProjects) {
    await dbDeleteProjectCascade(old.id)
  }

  // Purge old demo risks from shared localStorage catalog
  const SHARED_RISKS_KEY = 'riskhub_risks_shared_v1'
  const rawRisks = localStorage.getItem(SHARED_RISKS_KEY)
  if (rawRisks) {
    try {
      const parsed = JSON.parse(rawRisks) as Array<{ projectId?: string }>
      const filtered = parsed.filter(
        (r) => !r.projectId?.startsWith('proj_demo_l3_')
      )
      localStorage.setItem(SHARED_RISKS_KEY, JSON.stringify(filtered))
    } catch {
      // ignore parse errors
    }
  }

  const { userId, email } = getDemoCredentials()
  const currentProjects = await dbGetAllProjects()
  let list: ProjectRecord[] = [...currentProjects]
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

    // Add the main demo user as member
    await dbPutMember({
      id: `${tpl.id}__${userId}`,
      projectId: tpl.id,
      userId,
      email,
      joinedAt: tpl.createdAt
    })

    // Add fictional team members
    for (const fictUserId of tpl.memberUserIds) {
      const fictUser = FICTIONAL_USERS.find((u) => u.userId === fictUserId)
      if (!fictUser) continue
      await dbPutMember({
        id: `${tpl.id}__${fictUserId}`,
        projectId: tpl.id,
        userId: fictUserId,
        email: fictUser.email,
        joinedAt: tpl.createdAt
      })
    }

    list = [...list, row]
    for (const rs of tpl.risks) {
      riskRows.push(buildRisk(tpl.name, tpl.id, rs))
    }
  }

  mergeRisksIntoSharedCatalog(riskRows)

  // Save profiles for all fictional users
  for (const u of FICTIONAL_USERS) {
    saveProfileForUser(u.userId, {
      firstName: u.firstName,
      lastName: u.lastName,
      workplace: 'ООО Демо',
      department: u.department,
      position: u.position,
      about: ''
    })
  }

  saveProfileForUser(userId, {
    firstName: 'Демо',
    lastName: 'Аккаунт',
    workplace: 'ООО Демо',
    department: 'Управление демо-аккаунтами',
    position: 'Специалист по демо-аккаунтам',
    about: 'Демо-информация'
  })

  // Register fictional users in the auth users list so their names
  // resolve correctly in the project card "Участники" section
  const currentUsers = getUsers()
  const fictionalToAdd = FICTIONAL_USERS.filter(
    (u) => !currentUsers.some((cu) => cu.id === u.userId)
  ).map((u) => ({
    id: u.userId,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    password: ''
  }))
  if (fictionalToAdd.length > 0) {
    saveUsers([...currentUsers, ...fictionalToAdd])
  }

  localStorage.setItem(DEMO_WORLD_KEY, '1')
  window.dispatchEvent(new CustomEvent('riskhub-session-changed'))
}

// Export fictional user names for reference in @mention suggestions
export { FICTIONAL_USERS, userByName }
