import type { AppLocale } from '@/contexts/locale-context'

export interface PageCopy {
  lastUpdated: string
  refresh: string
  openMenu: string
  openRiskList: string
  panel: {
    activeRisks: string
    closedRisks: string
    criticalRisks: string
    quickActions: string
    addRisk: string
    addProject: string
    recentRisks: string
    allRisks: string
    noNewRisks: string
    newRisksHint: string
    notifications: string
    allNotifications: string
    noNewNotifications: string
    unreadHint: string
  }
  settingsSystem: {
    interface: string
    theme: string
    themeLight: string
    themeDark: string
    themeToastDark: string
    themeToastLight: string
    language: string
    other: string
    notificationsHeading: string
    emailNotif: string
    emailNotifAria: string
    inAppNotif: string
    inAppNotifAria: string
  }
  settingsProfile: {
    title: string
    changePhoto: string
    userFallback: string
    firstName: string
    lastName: string
    workplace: string
    department: string
    position: string
    about: string
    firstPlaceholder: string
    lastPlaceholder: string
  }
  help: {
    aboutLink: string
    termsLink: string
    privacyLink: string
    helpTitle: string
    supportUsers: string
    supportIntro: string
    helpFormatTitle: string
    helpFormatBody: string
    faqTitle: string
  }
  helpContact: {
    title: string
    subjectPlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    send: string
    sentDemo: string
  }
  projectsList: {
    newProject: string
  }
  risksList: {
    newRisk: string
  }
  registry: {
    filters: string
    reset: string
    filtersResetToast: string
    searchPlaceholder: string
    searchAria: string
    find: string
    search: string
    closeSelected: string
    deleteSelected: string
    colId: string
    colName: string
    colCreated: string
    colUpdated: string
    colStatus: string
    colCategory: string
    colProbability: string
    colImpact: string
    colProject: string
    colAuthor: string
    colMembers: string
    colActions: string
    actionsSr: string
    selectAll: string
    loading: string
    totalRecords: string
    rowsPerPage: string
    pageLabel: string
    prevPage: string
    nextPage: string
    dialogFilters: string
    apply: string
    filtersApplied: string
    cancel: string
    confirm: string
    delete: string
    view: string
    edit: string
    show: string
    createdFrom: string
    createdTo: string
    updatedFrom: string
    updatedTo: string
    status: string
    probability: string
    impact: string
    category: string
    project: string
    author: string
    allProjects: string
    allAuthors: string
    updatedLabel: string
  }
  registryProjects: {
    cardTitle: string
    emptyNoProjects: string
    emptyFiltered: string
    bulkCloseTitle: string
    bulkDeleteTitle: string
    bulkDescription: string
    deleteTitle: string
    deleteDescription: string
    deleted: string
    closedOk: string
    closedFail: string
    deletedOk: string
    deletedFail: string
    searchEmpty: string
    searchFound: string
  }
  registryRisks: {
    cardTitle: string
    emptyNoRisks: string
    emptyFiltered: string
    bulkCloseTitle: string
    bulkDeleteTitle: string
    bulkDescription: string
    closedToast: string
    deletedToast: string
    deleteTitle: string
    deleteDescription: string
    deleted: string
    searchEmpty: string
    searchFound: string
  }
  filterCount: (n: number) => string
  projectDetail: {
    noAccess: string
    toProjects: string
    back: string
    edit: string
    more: string
    idCopied: string
    copyId: string
    delete: string
    demo: string
    description: string
    owner: string
    created: string
    updated: string
    risksTitle: string
    add: string
    riskName: string
    riskCategory: string
    riskStatus: string
    noRisks: string
    members: string
    invite: string
    name: string
    noMembers: string
    activity: string
    inviteTitle: string
    inviteEmail: string
    addAnotherEmail: string
    inviteHint: string
    cancel: string
    sendInvite: string
    noValidEmails: string
    invitesSent: string
    deleteProjectTitle: string
    deleteProjectDescription: string
    projectDeleted: string
    memberDialog: string
    workplace: string
    department: string
    position: string
    about: string
  }
  riskDetail: {
    back: string
    edit: string
    more: string
    idCopied: string
    copyId: string
    delete: string
    category: string
    project: string
    descriptionTitle: string
    probability: string
    impact: string
    author: string
    created: string
    updated: string
    comments: string
    noComments: string
    commentPlaceholder: string
    removeAttachment: string
    attachFile: string
    send: string
    commentSent: string
    needTextOrFile: string
    measuresTitle: string
    addMeasure: string
    noMeasures: string
    measurePlaceholder: string
    editMeasure: string
    measureAdded: string
    measureUpdated: string
    measureEmpty: string
    activity: string
    deleteTitle: string
    deleteDescription: string
    riskDeleted: string
    download: string
    attachmentLabel: string
  }
  analytics: {
    modeRisks: string
    modeProjects: string
    exportPdfButton: string
    all: string
    allCategories: string
    allProjects: string
    filtersTitle: string
    periodLabel: string
    periodFrom: string
    periodTo: string
    riskProbability: string
    riskImpact: string
    riskStatus: string
    riskId: string
    riskCategory: string
    project: string
    projectCategory: string
    projectStatus: string
    projectId: string
    participants: string
    keywords: string
    keywordsPlaceholder: string
    reset: string
    apply: string
    selectedCount: string
    notFound: string
    searchRiskId: string
    searchProject: string
    searchProjectId: string
    chartByCategory: string
    chartTimeline: string
    chartShareCategory: string
    chartShareProject: string
    chartPieCategory: string
    chartByStatus: string
    chartProbability: string
    chartProjectByCategory: string
    chartProjectTimeline: string
    chartProjectByStatus: string
    legendCount: string
    tooltipValues: string
    timelineActive: string
    timelineClosed: string
    emptyNoRisksTitle: string
    emptyNoRisksHint: string
    emptyFilteredTitle: string
    emptyFilteredHint: string
    pdfReportTitle: string
    pdfBrandLine: string
    pdfGeneratedLabel: string
    pdfFiltersHeading: string
    pdfModePrefix: string
    pdfExportSuccess: string
    pdfExportError: string
  }
  legal: {
    about: { sections: { title: string; body: string }[] }
    terms: {
      updated: string
      sections: { title: string; body: string }[]
    }
    privacy: {
      updated: string
      sections: { title: string; body: string }[]
    }
  }
  helpFaq: { q: string; a: string }[]
  header: {
    notificationsAria: string
    profileMenuAria: string
    userFallback: string
  }
}

const RU: PageCopy = {
  lastUpdated: 'Последнее обновление:',
  refresh: 'Обновить',
  openMenu: 'Открыть меню',
  openRiskList: 'Открыть список рисков',
  panel: {
    activeRisks: 'Активных рисков',
    closedRisks: 'Закрытых рисков',
    criticalRisks: 'Критических рисков',
    quickActions: 'Быстрые действия',
    addRisk: 'Добавить риск',
    addProject: 'Добавить проект',
    recentRisks: 'Последние добавленные риски',
    allRisks: 'Все риски',
    noNewRisks: 'Нет новых рисков',
    newRisksHint: 'Здесь появятся новые риски',
    notifications: 'Уведомления',
    allNotifications: 'Все уведомления',
    noNewNotifications: 'Нет новых уведомлений',
    unreadHint: 'Здесь появятся непрочитанные уведомления'
  },
  settingsSystem: {
    interface: 'Интерфейс',
    theme: 'Тема',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeToastDark: 'Тёмная тема',
    themeToastLight: 'Светлая тема',
    language: 'Язык',
    other: 'Другое',
    notificationsHeading: 'Уведомления',
    emailNotif: 'Получать уведомления на Email',
    emailNotifAria: 'Получать уведомления на Email',
    inAppNotif: 'Встроенные уведомления',
    inAppNotifAria: 'Встроенные уведомления'
  },
  settingsProfile: {
    title: 'Ваш профиль',
    changePhoto: 'Изменить фото',
    userFallback: 'Пользователь',
    firstName: 'Имя',
    lastName: 'Фамилия',
    workplace: 'Место работы',
    department: 'Отдел',
    position: 'Должность',
    about: 'О себе',
    firstPlaceholder: 'Иван',
    lastPlaceholder: 'Иванов'
  },
  help: {
    aboutLink: 'О системе',
    termsLink: 'Условия использования',
    privacyLink: 'Политика конфиденциальности',
    helpTitle: 'Как мы можем помочь',
    supportUsers: 'Поддержка пользователей',
    supportIntro:
      'В этом разделе собраны практические рекомендации по входу, работе с рисками, уведомлениями и настройкам интерфейса.',
    helpFormatTitle: 'Формат помощи',
    helpFormatBody:
      'Ниже расположен расширенный FAQ в формате аккордеона: откройте нужный вопрос, чтобы быстро получить ответ.',
    faqTitle: 'Частые вопросы'
  },
  helpContact: {
    title: 'Обращение в поддержку',
    subjectPlaceholder: 'Тема обращения',
    messageLabel: 'Сообщение',
    messagePlaceholder: 'Опишите проблему...',
    send: 'Отправить',
    sentDemo: 'Обращение отправлено (демо)'
  },
  projectsList: { newProject: 'Новый проект' },
  risksList: { newRisk: 'Новый риск' },
  registry: {
    filters: 'Фильтры',
    reset: 'Сбросить',
    filtersResetToast: 'Фильтры сброшены',
    searchPlaceholder: 'Поиск по названию или описанию...',
    searchAria: 'Поиск по названию или описанию',
    find: 'Найти',
    search: 'Искать',
    closeSelected: 'Закрыть выбранные',
    deleteSelected: 'Удалить выбранные',
    colId: 'ID',
    colName: 'Название',
    colCreated: 'Создан',
    colUpdated: 'Обновлён',
    colStatus: 'Статус',
    colCategory: 'Категория',
    colProbability: 'Вероятность',
    colImpact: 'Воздействие',
    colProject: 'Проект',
    colAuthor: 'Автор',
    colMembers: 'Участники',
    colActions: 'Действия',
    actionsSr: 'Действия',
    selectAll: 'Выбрать все',
    loading: 'Загрузка…',
    totalRecords: 'Всего записей:',
    rowsPerPage: 'Записей на странице',
    pageLabel: 'Страница {current} из {total}',
    prevPage: 'Назад',
    nextPage: 'Вперёд',
    dialogFilters: 'Фильтры',
    apply: 'Применить',
    filtersApplied: 'Фильтры применены',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    delete: 'Удалить',
    view: 'Показать',
    edit: 'Изменить',
    show: 'Показать',
    createdFrom: 'Создан с',
    createdTo: 'Создан по',
    updatedFrom: 'Обновлён с',
    updatedTo: 'Обновлён по',
    status: 'Статус',
    probability: 'Вероятность',
    impact: 'Воздействие',
    category: 'Категория',
    project: 'Проект',
    author: 'Автор',
    allProjects: 'Все проекты',
    allAuthors: 'Все авторы',
    updatedLabel: 'Обновлён'
  },
  registryProjects: {
    cardTitle: 'Проекты',
    emptyNoProjects:
      'Нет проектов. Создайте первый проект, чтобы добавить риски по нему',
    emptyFiltered: 'Нет проектов по текущим фильтрам.',
    bulkCloseTitle: 'Закрыть выбранные проекты?',
    bulkDeleteTitle: 'Удалить выбранные проекты?',
    bulkDescription:
      'Выбрано записей: {n}. Подтвердите выполнение действия. Демо-проекты и проекты без прав владельца будут пропущены при массовом действии.',
    deleteTitle: 'Удалить проект?',
    deleteDescription:
      'Проект, участники и приглашения будут удалены из локального хранилища. Риски, привязанные к проекту, останутся в реестре.',
    deleted: 'Проект удалён',
    closedOk: 'Завершено проектов: {n}',
    closedFail:
      'Не удалось завершить {n} (демо-проект или нет прав владельца)',
    deletedOk: 'Удалено проектов: {n}',
    deletedFail:
      'Не удалось удалить {n} (демо-проект или нет прав владельца)',
    searchEmpty: 'Введите текст для поиска',
    searchFound: 'Поиск: «{q}» — найдено {n}'
  },
  registryRisks: {
    cardTitle: 'Риски',
    emptyNoRisks: 'Нет рисков. Создайте первый риск, чтобы начать работу над ним',
    emptyFiltered: 'Нет рисков по текущим фильтрам.',
    bulkCloseTitle: 'Закрыть выбранные риски?',
    bulkDeleteTitle: 'Удалить выбранные риски?',
    bulkDescription:
      'Выбрано записей: {n}. Подтвердите выполнение действия.',
    closedToast: 'Выбранные риски закрыты',
    deletedToast: 'Выбранные риски удалены',
    deleteTitle: 'Удалить риск?',
    deleteDescription:
      'Действие необратимо в рамках локального хранилища браузера.',
    deleted: 'Риск удалён',
    searchEmpty: 'Введите текст для поиска',
    searchFound: 'Поиск: «{q}» — найдено {n}'
  },
  filterCount: (n: number) => {
    if (n === 1) return '1 фильтр'
    if (n >= 2 && n <= 4) return `${n} фильтра`
    return `${n} фильтров`
  },
  projectDetail: {
    noAccess: 'Нет доступа',
    toProjects: 'К проектам',
    back: 'Назад',
    edit: 'Редактировать',
    more: 'Ещё',
    idCopied: 'ID скопирован',
    copyId: 'Копировать ID',
    delete: 'Удалить',
    demo: 'Демо',
    description: 'Описание проекта',
    owner: 'Владелец',
    created: 'Создан',
    updated: 'Обновлён',
    risksTitle: 'Риски по проекту',
    add: 'Добавить',
    riskName: 'Название',
    riskCategory: 'Категория',
    riskStatus: 'Статус',
    noRisks: 'В этом проекте пока нет рисков.',
    members: 'Участники',
    invite: 'Пригласить',
    name: 'Имя',
    noMembers: 'Нет участников',
    activity: 'Лента изменений',
    inviteTitle: 'Пригласить в проект',
    inviteEmail: 'Email для приглашения',
    addAnotherEmail: 'Указать еще',
    inviteHint:
      'Пользователь увидит приглашение после входа в систему RiskHub.',
    cancel: 'Отмена',
    sendInvite: 'Отправить приглашение',
    noValidEmails: 'Нет корректных адресов для приглашения',
    invitesSent: 'Отправлено приглашений: {n}',
    deleteProjectTitle: 'Удалить проект?',
    deleteProjectDescription:
      'Проект, участники и приглашения будут удалены из локального хранилища. Риски, привязанные к проекту, останутся в реестре.',
    projectDeleted: 'Проект удалён',
    memberDialog: 'Участник',
    workplace: 'Место работы',
    department: 'Отдел',
    position: 'Должность',
    about: 'О себе'
  },
  riskDetail: {
    back: 'Назад',
    edit: 'Редактировать',
    more: 'Ещё',
    idCopied: 'ID скопирован',
    copyId: 'Копировать ID',
    delete: 'Удалить',
    category: 'Категория',
    project: 'Проект',
    descriptionTitle: 'Описание риска',
    probability: 'Вероятность',
    impact: 'Воздействие',
    author: 'Автор',
    created: 'Создан',
    updated: 'Обновлён',
    comments: 'Комментарии',
    noComments: 'Комментариев пока нет.',
    commentPlaceholder: 'Оставить комментарий...',
    removeAttachment: 'Убрать вложение',
    attachFile: 'Прикрепить файл',
    send: 'Отправить',
    commentSent: 'Комментарий отправлен',
    needTextOrFile: 'Введите текст или прикрепите файл',
    measuresTitle: 'Меры реагирования',
    addMeasure: '+ Добавить',
    noMeasures: 'Мер реагирования пока нет.',
    measurePlaceholder: 'Текст меры реагирования',
    editMeasure: 'Изменить меру',
    measureAdded: 'Мера добавлена',
    measureUpdated: 'Мера обновлена',
    measureEmpty: 'Текст не может быть пустым',
    activity: 'Лента изменений',
    deleteTitle: 'Удалить риск {code}?',
    deleteDescription: 'Запись будет удалена из локального хранилища.',
    riskDeleted: 'Риск удалён',
    download: 'Скачать',
    attachmentLabel: 'Вложение'
  },
  analytics: {
    modeRisks: 'Риски',
    modeProjects: 'Проекты',
    exportPdfButton: 'Выгрузить в PDF',
    all: 'Все',
    allCategories: 'Все категории',
    allProjects: 'Все проекты',
    filtersTitle: 'Фильтры',
    periodLabel: 'Период',
    periodFrom: 'Период с',
    periodTo: 'Период по',
    riskProbability: 'Вероятность риска',
    riskImpact: 'Воздействие риска',
    riskStatus: 'Статус риска',
    riskId: 'ID риска',
    riskCategory: 'Категория риска',
    project: 'Проект',
    projectCategory: 'Категория проекта',
    projectStatus: 'Статус проекта',
    projectId: 'ID проекта',
    participants: 'Участники',
    keywords: 'Ключевые слова',
    keywordsPlaceholder: 'Поиск по названию или описанию...',
    reset: 'Сбросить',
    apply: 'Применить',
    selectedCount: 'Выбрано: {n}',
    notFound: 'Не найдено',
    searchRiskId: 'Поиск по ID…',
    searchProject: 'Поиск по проекту…',
    searchProjectId: 'Поиск по ID проекта…',
    chartByCategory: 'Количество рисков по категориям',
    chartTimeline: 'Динамика рисков по времени',
    chartShareCategory: 'Количество рисков',
    chartShareProject: 'Количество проектов',
    chartPieCategory: 'Доля рисков по категориям',
    chartByStatus: 'Распределение по статусам',
    chartProbability: 'Вероятность рисков',
    chartProjectByCategory: 'Количество проектов по категориям',
    chartProjectTimeline: 'Динамика проектов по времени',
    chartProjectByStatus: 'Распределение проектов по статусам',
    legendCount: 'Количество рисков',
    tooltipValues: 'значений',
    timelineActive: 'Активные',
    timelineClosed: 'Закрытые',
    emptyNoRisksTitle: 'Нет данных для графиков',
    emptyNoRisksHint: 'Добавьте риски и здесь появится аналитика',
    emptyFilteredTitle: 'Нет данных по фильтрам',
    emptyFilteredHint: 'Измените период или фильтры отчёта',
    pdfReportTitle: 'Аналитический отчёт',
    pdfBrandLine: 'RiskHub',
    pdfGeneratedLabel: 'Дата формирования',
    pdfFiltersHeading: 'Применённые фильтры',
    pdfModePrefix: 'Режим',
    pdfExportSuccess: 'Отчет выгружен в PDF',
    pdfExportError: 'Не удалось сформировать PDF'
  },
  legal: {
    about: {
      sections: [
        {
          title: 'Что такое RiskHub',
          body: 'Интеллектуальная система управления рисками, объединяющая структурированные данные, семантический поиск и корпоративные интеграции.'
        },
        {
          title: 'Ключевые возможности',
          body: 'Семантический поиск, автоматическое выявление рисков, графы связей, верификация экспертами и интеграция с Jira, Slack, CRM.'
        },
        {
          title: 'Планы развития',
          body: 'Расширение ИИ-аналитики, углубление интеграций, внедрение предиктивных моделей.'
        }
      ]
    },
    terms: {
      updated: 'Последнее обновление: 24.03.2026',
      sections: [
        {
          title: '1. Назначение сервиса',
          body: 'Платформа для интеллектуального управления рисками: семантический поиск, аналитика и визуализация связей для поддержки решений.'
        },
        {
          title: '2. Формат предоставления',
          body: 'Доступ через веб-интерфейс с ролевой моделью, интеграцией с корпоративными системами и защищенным облачным хранением данных.'
        },
        {
          title: '3. Ответственность пользователя',
          body: 'Пользователь самостоятельно отвечает за корректность вводимой информации и за своевременное обновление данных о рисках.'
        },
        {
          title: '4. Ограничения использования',
          body: 'Запрещена передача учетных данных третьим лицам, несанкционированное копирование данных.'
        },
        {
          title: '5. Изменение условий',
          body: 'Администрация вправе изменять условия с уведомлением пользователей за 7 дней через систему уведомлений или корпоративную почту.'
        }
      ]
    },
    privacy: {
      updated: 'Последнее обновление: 24.03.2026',
      sections: [
        {
          title: '1. Общие положения',
          body: 'Настоящая политика определяет порядок обработки и защиты данных пользователей платформы RiskHub.'
        },
        {
          title: '2. Какие данные сохраняются',
          body: 'Сохраняются профили пользователей, карточки рисков, история изменений, логи действий и интеграционные данные.'
        },
        {
          title: '3. Срок хранения данных',
          body: 'Данные хранятся в течение всего срока использования сервиса и подлежат удалению при изменении корпоративных правил.'
        },
        {
          title: '4. Защита и ограничения',
          body: 'Применяется шифрование, разграничение прав доступа, аудит действий и соответствие требованиям законодательства.'
        },
        {
          title: '5. Контроль пользователя',
          body: 'Пользователь вправе запросить выгрузку своих данных или их удаление через администратора системы.'
        }
      ]
    }
  },
  helpFaq: [
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
  ],
  header: {
    notificationsAria: 'Уведомления',
    profileMenuAria: 'Меню профиля',
    userFallback: 'Пользователь'
  }
}

const EN: PageCopy = {
  lastUpdated: 'Last updated:',
  refresh: 'Refresh',
  openMenu: 'Open menu',
  openRiskList: 'Open risk list',
  panel: {
    activeRisks: 'Active risks',
    closedRisks: 'Closed risks',
    criticalRisks: 'Critical risks',
    quickActions: 'Quick actions',
    addRisk: 'Add risk',
    addProject: 'Add project',
    recentRisks: 'Recently added risks',
    allRisks: 'All risks',
    noNewRisks: 'No new risks',
    newRisksHint: 'New risks will appear here',
    notifications: 'Notifications',
    allNotifications: 'All notifications',
    noNewNotifications: 'No new notifications',
    unreadHint: 'Unread notifications will appear here'
  },
  settingsSystem: {
    interface: 'Interface',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeToastDark: 'Dark theme',
    themeToastLight: 'Light theme',
    language: 'Language',
    other: 'Other',
    notificationsHeading: 'Notifications',
    emailNotif: 'Receive email notifications',
    emailNotifAria: 'Receive email notifications',
    inAppNotif: 'In-app notifications',
    inAppNotifAria: 'In-app notifications'
  },
  settingsProfile: {
    title: 'Your profile',
    changePhoto: 'Change photo',
    userFallback: 'User',
    firstName: 'First name',
    lastName: 'Last name',
    workplace: 'Workplace',
    department: 'Department',
    position: 'Job title',
    about: 'About',
    firstPlaceholder: 'John',
    lastPlaceholder: 'Smith'
  },
  help: {
    aboutLink: 'About',
    termsLink: 'Terms of use',
    privacyLink: 'Privacy policy',
    helpTitle: 'How we can help',
    supportUsers: 'User support',
    supportIntro:
      'This section covers sign-in, working with risks, notifications, and interface settings.',
    helpFormatTitle: 'Help format',
    helpFormatBody:
      'Below is an expandable FAQ: open a question to see the answer.',
    faqTitle: 'Frequently asked questions'
  },
  helpContact: {
    title: 'Contact support',
    subjectPlaceholder: 'Subject',
    messageLabel: 'Message',
    messagePlaceholder: 'Describe the issue...',
    send: 'Send',
    sentDemo: 'Request sent (demo)'
  },
  projectsList: { newProject: 'New project' },
  risksList: { newRisk: 'New risk' },
  registry: {
    filters: 'Filters',
    reset: 'Reset',
    filtersResetToast: 'Filters cleared',
    searchPlaceholder: 'Search by name or description...',
    searchAria: 'Search by name or description',
    find: 'Find',
    search: 'Search',
    closeSelected: 'Close selected',
    deleteSelected: 'Delete selected',
    colId: 'ID',
    colName: 'Name',
    colCreated: 'Created',
    colUpdated: 'Updated',
    colStatus: 'Status',
    colCategory: 'Category',
    colProbability: 'Probability',
    colImpact: 'Impact',
    colProject: 'Project',
    colAuthor: 'Author',
    colMembers: 'Members',
    colActions: 'Actions',
    actionsSr: 'Actions',
    selectAll: 'Select all',
    loading: 'Loading…',
    totalRecords: 'Total records:',
    rowsPerPage: 'Rows per page',
    pageLabel: 'Page {current} of {total}',
    prevPage: 'Previous',
    nextPage: 'Next',
    dialogFilters: 'Filters',
    apply: 'Apply',
    filtersApplied: 'Filters applied',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    view: 'View',
    edit: 'Edit',
    show: 'View',
    createdFrom: 'Created from',
    createdTo: 'Created to',
    updatedFrom: 'Updated from',
    updatedTo: 'Updated to',
    status: 'Status',
    probability: 'Probability',
    impact: 'Impact',
    category: 'Category',
    project: 'Project',
    author: 'Author',
    allProjects: 'All projects',
    allAuthors: 'All authors',
    updatedLabel: 'Updated'
  },
  registryProjects: {
    cardTitle: 'Projects',
    emptyNoProjects:
      'No projects yet. Create a project to attach risks to it.',
    emptyFiltered: 'No projects match the current filters.',
    bulkCloseTitle: 'Close selected projects?',
    bulkDeleteTitle: 'Delete selected projects?',
    bulkDescription:
      'Selected: {n}. Confirm the action. Demo projects and projects you do not own will be skipped.',
    deleteTitle: 'Delete project?',
    deleteDescription:
      'The project, members, and invitations will be removed from local storage. Linked risks remain in the registry.',
    deleted: 'Project deleted',
    closedOk: 'Projects closed: {n}',
    closedFail: 'Could not close {n} (demo project or not owner)',
    deletedOk: 'Projects deleted: {n}',
    deletedFail: 'Could not delete {n} (demo project or not owner)',
    searchEmpty: 'Enter text to search',
    searchFound: 'Search: “{q}” — {n} found'
  },
  registryRisks: {
    cardTitle: 'Risks',
    emptyNoRisks: 'No risks yet. Create a risk to get started.',
    emptyFiltered: 'No risks match the current filters.',
    bulkCloseTitle: 'Close selected risks?',
    bulkDeleteTitle: 'Delete selected risks?',
    bulkDescription: 'Selected: {n}. Confirm the action.',
    closedToast: 'Selected risks closed',
    deletedToast: 'Selected risks deleted',
    deleteTitle: 'Delete risk?',
    deleteDescription: 'This cannot be undone in local browser storage.',
    deleted: 'Risk deleted',
    searchEmpty: 'Enter text to search',
    searchFound: 'Search: “{q}” — {n} found'
  },
  filterCount: (n: number) => `${n} ${n === 1 ? 'filter' : 'filters'}`,
  projectDetail: {
    noAccess: 'No access',
    toProjects: 'Back to projects',
    back: 'Back',
    edit: 'Edit',
    more: 'More',
    idCopied: 'ID copied',
    copyId: 'Copy ID',
    delete: 'Delete',
    demo: 'Demo',
    description: 'Project description',
    owner: 'Owner',
    created: 'Created',
    updated: 'Updated',
    risksTitle: 'Risks in this project',
    add: 'Add',
    riskName: 'Name',
    riskCategory: 'Category',
    riskStatus: 'Status',
    noRisks: 'There are no risks in this project yet.',
    members: 'Members',
    invite: 'Invite',
    name: 'Name',
    noMembers: 'No members',
    activity: 'Activity',
    inviteTitle: 'Invite to project',
    inviteEmail: 'Invitation email',
    addAnotherEmail: 'Add another email',
    inviteHint: 'The user will see the invitation after signing in to RiskHub.',
    cancel: 'Cancel',
    sendInvite: 'Send invitation',
    noValidEmails: 'No valid email addresses to invite',
    invitesSent: 'Invitations sent: {n}',
    deleteProjectTitle: 'Delete project?',
    deleteProjectDescription:
      'The project, members, and invitations will be removed from local storage. Linked risks remain in the registry.',
    projectDeleted: 'Project deleted',
    memberDialog: 'Member',
    workplace: 'Workplace',
    department: 'Department',
    position: 'Job title',
    about: 'About'
  },
  riskDetail: {
    back: 'Back',
    edit: 'Edit',
    more: 'More',
    idCopied: 'ID copied',
    copyId: 'Copy ID',
    delete: 'Delete',
    category: 'Category',
    project: 'Project',
    descriptionTitle: 'Risk description',
    probability: 'Probability',
    impact: 'Impact',
    author: 'Author',
    created: 'Created',
    updated: 'Updated',
    comments: 'Comments',
    noComments: 'No comments yet.',
    commentPlaceholder: 'Write a comment...',
    removeAttachment: 'Remove attachment',
    attachFile: 'Attach file',
    send: 'Send',
    commentSent: 'Comment posted',
    needTextOrFile: 'Enter text or attach a file',
    measuresTitle: 'Response measures',
    addMeasure: '+ Add',
    noMeasures: 'No response measures yet.',
    measurePlaceholder: 'Measure text',
    editMeasure: 'Edit measure',
    measureAdded: 'Measure added',
    measureUpdated: 'Measure updated',
    measureEmpty: 'Text cannot be empty',
    activity: 'Activity',
    deleteTitle: 'Delete risk {code}?',
    deleteDescription: 'The record will be removed from local storage.',
    riskDeleted: 'Risk deleted',
    download: 'Download',
    attachmentLabel: 'Attachment'
  },
  analytics: {
    modeRisks: 'Risks',
    modeProjects: 'Projects',
    exportPdfButton: 'Export to PDF',
    all: 'All',
    allCategories: 'All categories',
    allProjects: 'All projects',
    filtersTitle: 'Filters',
    periodLabel: 'Period',
    periodFrom: 'From',
    periodTo: 'To',
    riskProbability: 'Risk probability',
    riskImpact: 'Risk impact',
    riskStatus: 'Risk status',
    riskId: 'Risk ID',
    riskCategory: 'Risk category',
    project: 'Project',
    projectCategory: 'Project category',
    projectStatus: 'Project status',
    projectId: 'Project ID',
    participants: 'Participants',
    keywords: 'Keywords',
    keywordsPlaceholder: 'Search by name or description...',
    reset: 'Reset',
    apply: 'Apply',
    selectedCount: 'Selected: {n}',
    notFound: 'No matches',
    searchRiskId: 'Search by risk ID…',
    searchProject: 'Search by project…',
    searchProjectId: 'Search by project ID…',
    chartByCategory: 'Risks by category',
    chartTimeline: 'Risk trend over time',
    chartShareCategory: 'Risk count',
    chartShareProject: 'Project count',
    chartPieCategory: 'Share of risks by category',
    chartByStatus: 'Distribution by status',
    chartProbability: 'Risk probability',
    chartProjectByCategory: 'Projects by category',
    chartProjectTimeline: 'Project trend over time',
    chartProjectByStatus: 'Distribution of projects by status',
    legendCount: 'Risk count',
    tooltipValues: 'values',
    timelineActive: 'Active',
    timelineClosed: 'Closed',
    emptyNoRisksTitle: 'No chart data',
    emptyNoRisksHint: 'Add risks to see analytics',
    emptyFilteredTitle: 'No data for current filters',
    emptyFilteredHint: 'Change the period or report filters',
    pdfReportTitle: 'Analytics report',
    pdfBrandLine: 'RiskHub',
    pdfGeneratedLabel: 'Generated',
    pdfFiltersHeading: 'Applied filters',
    pdfModePrefix: 'Mode',
    pdfExportSuccess: 'Report exported to PDF',
    pdfExportError: 'Could not generate PDF'
  },
  legal: {
    about: {
      sections: [
        {
          title: 'What is RiskHub',
          body: 'An intelligent risk management system combining structured data, semantic search, and enterprise integrations.'
        },
        {
          title: 'Key capabilities',
          body: 'Semantic search, automated risk detection, relationship graphs, expert review, and integrations with Jira, Slack, and CRM.'
        },
        {
          title: 'Roadmap',
          body: 'Expanded AI analytics, deeper integrations, and predictive models.'
        }
      ]
    },
    terms: {
      updated: 'Last updated: 24 Mar 2026',
      sections: [
        {
          title: '1. Purpose of the service',
          body: 'A platform for intelligent risk management: semantic search, analytics, and relationship visualization to support decisions.'
        },
        {
          title: '2. How access is provided',
          body: 'Access via the web UI with roles, integrations with corporate systems, and secure cloud storage.'
        },
        {
          title: '3. User responsibility',
          body: 'You are responsible for the accuracy of information entered and for keeping risk data up to date.'
        },
        {
          title: '4. Restrictions',
          body: 'Sharing credentials with third parties and unauthorized copying of data is prohibited.'
        },
        {
          title: '5. Changes to terms',
          body: 'Terms may be updated; continued use means you accept the current version.'
        }
      ]
    },
    privacy: {
      updated: 'Last updated: 24 Mar 2026',
      sections: [
        {
          title: '1. General',
          body: 'This policy describes how RiskHub processes and protects user data.'
        },
        {
          title: '2. Data we store',
          body: 'User profiles, risk records, change history, action logs, and integration data.'
        },
        {
          title: '3. Retention',
          body: 'Data is kept for the life of the service and may be removed when corporate rules change.'
        },
        {
          title: '4. Protection',
          body: 'Encryption, access control, auditing, and compliance with applicable law.'
        },
        {
          title: '5. Your control',
          body: 'You may request information about processing and limit certain processing in service settings.'
        }
      ]
    }
  },
  helpFaq: [
    {
      q: 'How do I create a risk?',
      a: 'After sign-in, open Risks, click New risk, pick a project, fill in the form, and save.'
    },
    {
      q: 'How do filters work?',
      a: 'Click Filters, choose statuses and categories. Active filters are shown next to the button.'
    },
    {
      q: 'Is there a mobile layout?',
      a: 'Yes. The UI adapts to phones and tablets. Open the main menu from the header on small screens.'
    },
    {
      q: 'Why am I not getting confirmation emails?',
      a: 'This demo build does not send email.'
    },
    {
      q: 'How is risk level determined?',
      a: 'From probability and impact, together with the current control status.'
    },
    {
      q: 'What if the UI errors?',
      a: 'Reload the page, try another browser, or clear cache. If it persists, contact support with steps to reproduce.'
    },
    {
      q: 'Where are notifications?',
      a: 'In the bell icon in the header and in the block on the home page.'
    },
    {
      q: 'How do I change the language?',
      a: 'Use System settings inside the app.'
    },
    {
      q: 'Where is legal information?',
      a: 'About, Terms of use, and Privacy policy are linked from Help and the sign-in page.'
    }
  ],
  header: {
    notificationsAria: 'Notifications',
    profileMenuAria: 'Profile menu',
    userFallback: 'User'
  }
}

export function getPageCopy(locale: AppLocale): PageCopy {
  return locale === 'en' ? EN : RU
}
