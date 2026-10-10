import { scenarioSchema } from './schema';

export const parseScenario = (value: unknown) => scenarioSchema.parse(value);

export const keyboardScenario = parseScenario({
  id: 'keyboard-to-character',
  locale: 'ru',
  version: '1.0.0',
  profile: 'Внешняя проводная USB HID-клавиатура, настольная ОС, браузер с активным HTML-полем ввода, одна латинская буква без IME.',
  scope: 'Учебная модель типичного пути от физического нажатия до видимого символа.',
  assumptions: [
    'Поле ввода уже находится в фокусе.',
    'Для примера выбрана клавиша A и латинская раскладка; результатом показана строчная a.',
    'Устройство, ОС и браузер могут реализовать отдельные стадии по-разному.'
  ],
  boundaries: [
    'Сценарий не эмулирует настоящий CPU, USB-шину, ОС или браузер.',
    'Не описаны Bluetooth, экранная клавиатура, мобильный ввод, IME и другие раскладки.',
    'Световой поток показывает переход сообщения или состояния, а не движение конкретного электрона.'
  ],
  sources: [
    { id: 'usb', title: 'USB-IF: HID specifications', url: 'https://www.usb.org/hid' },
    { id: 'uievents', title: 'W3C: UI Events', url: 'https://www.w3.org/TR/uievents/' },
    { id: 'input', title: 'W3C: Input Events Level 2', url: 'https://www.w3.org/TR/input-events-2/' },
    { id: 'html', title: 'WHATWG: HTML focus', url: 'https://html.spec.whatwg.org/multipage/interaction.html#focus' },
    { id: 'render', title: 'Chromium: RenderingNG architecture', url: 'https://developer.chrome.com/docs/chromium/renderingng-architecture' },
    { id: 'intel', title: 'Intel: Software Developer Manuals', url: 'https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html' },
    { id: 'webgl', title: 'Khronos: WebGL specification', url: 'https://registry.khronos.org/webgl/specs/latest/1.0/' }
  ],
  steps: [
    {
      id: 'press', order: 1, title: 'Физическое нажатие',
      userObservation: 'Клавиша A уходит вниз. На экране пока ничего не меняется.',
      explanation: {
        basic: 'Контакт под клавишей сообщает клавиатуре о нажатии.',
        deeper: 'Контроллер клавиатуры может сканировать матрицу клавиш и подавлять дребезг контакта.',
        expert: 'Схема матрицы, debounce и частота сканирования зависят от конкретной клавиатуры.'
      },
      visualCue: { node: 'keyboard', signalType: 'input', cameraAnchor: 0, optionalBranch: false },
      omissions: ['Материалы переключателя и прошивка клавиатуры не показаны.'],
      prohibitedClaims: ['Клавиша сразу отправляет букву A.'],
      sourceRefs: ['usb'], glossaryRefs: ['controller'],
      accessibilityNarration: 'Первый этап: физическое нажатие клавиши. Контакт регистрирует действие внутри клавиатуры.'
    },
    {
      id: 'hid', order: 2, title: 'Сообщение ввода',
      userObservation: 'Условный импульс проходит по кабелю к компьютеру.',
      explanation: {
        basic: 'Клавиатура сообщает компьютеру, какая физическая клавиша нажата.',
        deeper: 'В этой модели используется USB HID input report с обозначением клавиши, а не готовым символом.',
        expert: 'HID usage обозначает назначение элемента ввода. Формат отчёта и протокол зависят от устройства.'
      },
      visualCue: { node: 'usb', signalType: 'input', cameraAnchor: 1, optionalBranch: false },
      omissions: ['USB-кадры, хабы и интервалы опроса не моделируются.'],
      prohibitedClaims: ['USB всегда отправляет scan code.', 'По кабелю уже передаётся символ.'],
      sourceRefs: ['usb'], glossaryRefs: ['hid'],
      accessibilityNarration: 'Второй этап: клавиатура передаёт сообщение о физической клавише через USB.'
    },
    {
      id: 'os', order: 3, title: 'Контроллер и ОС',
      userObservation: 'На дисплее ещё нет нового символа.',
      explanation: {
        basic: 'Операционная система получает сообщение от устройства.',
        deeper: 'Контроллер и драйвер передают событие в подсистему ввода; дальше оно может ожидать обработки.',
        expert: 'Механизм уведомления CPU определяется контроллером и ОС. Нажатие не является прямым вызовом приложения.'
      },
      visualCue: { node: 'os', signalType: 'event', cameraAnchor: 2, optionalBranch: false },
      omissions: ['Не показаны IRQ vector, DMA, ядра и конкретный планировщик.'],
      prohibitedClaims: ['Клавиатура напрямую прерывает приложение.'],
      sourceRefs: ['usb', 'uievents'], glossaryRefs: ['driver', 'queue'],
      accessibilityNarration: 'Третий этап: контроллер и система принимают сообщение и передают событие дальше.'
    },
    {
      id: 'focus', order: 4, title: 'Раскладка и фокус',
      userObservation: 'Система ещё определяет, куда направить ввод.',
      explanation: {
        basic: 'Система определяет окно и поле, готовые принять ввод.',
        deeper: 'Раскладка и модификаторы влияют на значение клавиши. Фокус определяет получателя.',
        expert: 'Физический code, логический key и итоговый текст отличаются. IME и composition могут менять путь; здесь они исключены.'
      },
      visualCue: { node: 'focus', signalType: 'event', cameraAnchor: 2, optionalBranch: true },
      omissions: ['IME показан только как возможная альтернативная ветвь.'],
      prohibitedClaims: ['Код клавиши всегда равен букве.'],
      sourceRefs: ['uievents', 'html'], glossaryRefs: ['focus'],
      accessibilityNarration: 'Четвёртый этап: раскладка помогает определить значение, а фокус выбирает поле назначения.'
    },
    {
      id: 'browser', order: 5, title: 'Браузер и событие',
      userObservation: 'Поле ввода готовится принять текст.',
      explanation: {
        basic: 'Браузер передаёт событие активному полю и обработчикам страницы.',
        deeper: 'Клавиатурное событие и изменение текста различаются. При обычном вводе возможны keydown, beforeinput и input.',
        expert: 'Браузер создаёт DOM-события и выполняет обработчики согласно своей модели задач. JavaScript не получает сырой USB-отчёт.'
      },
      visualCue: { node: 'browser', signalType: 'event', cameraAnchor: 3, optionalBranch: false },
      omissions: ['Не показаны все процессы и потоки браузера.'],
      prohibitedClaims: ['JavaScript получает USB-пакет.'],
      sourceRefs: ['uievents', 'input'], glossaryRefs: ['event-loop'],
      accessibilityNarration: 'Пятый этап: браузер создаёт события для активного поля ввода.'
    },
    {
      id: 'state', order: 6, title: 'Изменение текста',
      userObservation: 'В состоянии поля теперь хранится строчная a.',
      explanation: {
        basic: 'Поле ввода или код страницы меняет хранимый текст.',
        deeper: 'Браузер отмечает части интерфейса, которым понадобится обновление.',
        expert: 'Инструкции CPU используют регистры, кэши и память. Эта сцена не трассирует реальные адреса или обращения к RAM.'
      },
      visualCue: { node: 'cpu', signalType: 'state', cameraAnchor: 4, optionalBranch: false },
      omissions: ['Не показаны реальные инструкции, адреса и внутренности кэша.'],
      prohibitedClaims: ['CPU всегда напрямую читает RAM.', 'Все данные хранятся в регистрах.'],
      sourceRefs: ['input', 'intel'], glossaryRefs: ['cache', 'ram'],
      accessibilityNarration: 'Шестой этап: текстовое состояние поля изменилось, но дисплей ещё может показывать прежний кадр.'
    },
    {
      id: 'render', order: 7, title: 'Подготовка кадра',
      userObservation: 'Символ готов к показу, экран может ещё не обновиться.',
      explanation: {
        basic: 'Браузер готовит обновлённый интерфейс.',
        deeper: 'В зависимости от изменения могут понадобиться расчёт стилей, раскладка, рисование и композиция.',
        expert: 'Растеризация и композиция распределяются между CPU и GPU по-разному. Участие GPU в каждой стадии не гарантировано.'
      },
      visualCue: { node: 'render', signalType: 'frame', cameraAnchor: 4, optionalBranch: true },
      omissions: ['Единого pipeline для всех браузеров здесь нет.'],
      prohibitedClaims: ['Каждый ввод всегда запускает GPU.'],
      sourceRefs: ['render'], glossaryRefs: ['rasterization', 'compositor'],
      accessibilityNarration: 'Седьмой этап: браузер подготавливает изображение обновлённого поля.'
    },
    {
      id: 'display', order: 8, title: 'Композиция и дисплей',
      userObservation: 'На экране появляется строчная a.',
      explanation: {
        basic: 'Готовый кадр появляется на очередном обновлении дисплея.',
        deeper: 'Композиция поверхностей и вывод изображения могут происходить после обработки события.',
        expert: 'Present, swap chain и scan-out зависят от платформы. Момент появления пикселей не равен моменту обработки обработчика.'
      },
      visualCue: { node: 'display', signalType: 'frame', cameraAnchor: 5, optionalBranch: false },
      omissions: ['Не моделируются HDMI, DisplayPort, LCD и OLED.'],
      prohibitedClaims: ['CPU немедленно зажигает пиксель.', 'Символ появляется в момент получения команды.'],
      sourceRefs: ['render'], glossaryRefs: ['refresh'],
      accessibilityNarration: 'Восьмой этап: подготовленный кадр выводится на дисплей, и пользователь видит символ.'
    }
  ],
  assessment: [
    {
      id: 'focus', prompt: 'Что изменится, если поле ввода не в фокусе?',
      options: [
        { id: 'a', label: 'Символ обязательно появится в этом поле' },
        { id: 'b', label: 'Ввод может получить другое окно или элемент' }
      ], correctOptionId: 'b', explanation: 'Фокус определяет получателя ввода. Без фокуса поля символ не обязан появиться именно в нём.'
    },
    {
      id: 'layout', prompt: 'Почему одна физическая клавиша может дать разные символы?',
      options: [
        { id: 'a', label: 'На результат влияют раскладка и модификаторы' },
        { id: 'b', label: 'USB-порт произвольно меняет буквы' }
      ], correctOptionId: 'a', explanation: 'Физическая клавиша и итоговый текст различаются: раскладка, модификаторы и способы ввода влияют на результат.'
    },
    {
      id: 'cache', prompt: 'Нужно ли CPU каждый раз обращаться непосредственно к RAM?',
      options: [
        { id: 'a', label: 'Да, каждый шаг требует прямого чтения RAM' },
        { id: 'b', label: 'Нет, часть работы обслуживают регистры и кэши' }
      ], correctOptionId: 'b', explanation: 'CPU использует иерархию памяти. Учебная сцена не показывает точные обращения.'
    },
    {
      id: 'refresh', prompt: 'Почему символ может появиться не мгновенно?',
      options: [
        { id: 'a', label: 'Подготовка кадра и обновление дисплея идут отдельными стадиями' },
        { id: 'b', label: 'Клавиша должна физически коснуться экрана' }
      ], correctOptionId: 'a', explanation: 'Изменение текста, подготовка изображения и его вывод на дисплей разделены во времени.'
    }
  ]
});
