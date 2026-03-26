/* =========================================
   PROJECTS DATA
   Each project has bilingual content
   ========================================= */

   const projects = [
       {
           id: 1,
           category: "extract",
           title: {
               en: "Multi-Platform Web Scraper",
               ru: "ETL-пайплайн для автоматизированного обновления цен"
           },
           description: {
               en: "Advanced scraping system with Selenium and debugger mode for bypassing anti-bot protections. Includes auto-file upload automation.",
               ru: `Веб-интерфейс для управления настройками, мониторинга и
               запуска ETL-процесса. Автоматическое извлечение данных из 1500+
               веб-страниц, трансформация, валидация, формирование документов и
               загрузка в корпоративную систему. Результат: сокращение ручного
               труда на 60%, исключение ошибок ввода и потери данных.`
           },
           tags: ["Python", "Flask", "Selenium", "Requests", "WebSocket", "Openpyxl", "BeautifulSoup", "PyAutoGUI"],
           links: {
               github: null,
               demo: null
           },
           hasDemo: false,
           fullDescription: {
             ru: `
             <h2>Комплексная автоматизация обновления цен поставщиков</h2>
             <h3>Задача</h3>
             <p>В формате Excel содержатся ссылки на интернет-ресурсы.
             Необходимо перейти по ссылке, указать цену товара (при условии,
               что он есть в наличии) и сделать скриншот этой страницы. После
               сбора цен и их проверки необходимо объединить скриншоты по
               поставщику и загрузить их во внутреннюю систему хранения через
               локальный веб-сайт. Для каждого поставщика отдельная карточка.
               Количество уникальных поставщиков — более 300 шт., количество
               ссылок — более 1500 шт. Процесс выполняется раз в квартал.</p>
             <h3>Решение</h3>
             <p>Конфигурация</p>
             <ul>
               <li>Хранение настроек парсинга (теги, атрибуты, приоритеты) в SQLite.</li>
               <li>Веб-интерфейс для конфигурации и мгновенного тестирования правил извлечения (снижение времени на настройку).</li>
               <li>Ведение журнала последних успешных сборов для инкрементальной обработки.</li>
               <li>Механизм повторных попыток при сбоях сети/парсинга.</li>
             </ul>
             <p>ETL-пайплайн</p>
            <p class="cursive"> Extract</p>
            <ul>
            <li>Чтение списка ссылок из Excel, нормализация данных.</li>
            <li>Фильтрация только устаревших/необработанных записей (оптимизация ресурсов).</li>
            <li>Процесс парсинга - эмуляция браузера с отладкой, управление через WebSocket (обход блокировок, имитация поведения пользователя).</li>
            <li>Автоматическое создание скриншотов для верификации (PyAutoGUI).</li>
            </ul>

            <p class="cursive"> Transform & Validate</p>
            <ul>
            <li>Извлечённые цены проходят валидацию (формат, диапазон, аномалии).</li>
            <li>Логирование ошибок с возможностью ручного ввода данных с сохранением скриншота (fallback-процедура).</li>
            <li>Группировка результатов по поставщикам для последующей генерации документов.</li>
            </ul>

            <p class="cursive">Load</p>
            <ul>
            <li>Автоматическое формирование Word-документов со вставкой скриншотов.</li>
            <li>Загрузка документов в корпоративную систему через Selenium с авторизацией и заполнением карточек поставщиков.</li>
            <li>Обновление статусов в SQLite для отслеживания завершённых циклов.</li>
            </ul>

            <h3>Результаты</h3>
            <ul>
            <li>60% цен обновляется полностью автоматически, остальные требуют вмешательства (ввод капчи или неактуальные ссылки).</li>
            <li>Исключены ошибки человеческого фактора: потеря скриншотов, опечатки при вводе.</li>
            <li>Повышена прослеживаемость: каждое изменение цены привязано к скриншоту.</li>
            <li>Масштабируемость: архитектура позволяет добавлять новые домены через веб-интерфейс без изменения кода.</li>
            </ul>
             `,
             en: `
             <h2>Comprehensive Automation of Supplier Price Updates</h2>
             <h3>The Task</h3>
             <p>The Excel file contains links to internet resources. It is
             necessary to follow the link, specify the price of the item (if it
              is in stock), and take a screenshot of the page. After collecting
              and verifying the prices, the screenshots should be grouped by
              supplier and uploaded to the internal storage system via a local
              website. Each supplier has a separate card. There are over 300
              unique suppliers and over 1500 links. The process is performed
              once a quarter. </p>
             <h3>Solution</h3>
             Configuration
             <ul>
              <li>Parsing settings (tags, attributes, priorities) are stored in SQLite.</li>
              <li>A web interface for configuring and instantly testing parsing rules (reduces setup time).</li>
              <li>Screenshots are displayed alongside the extracted data.</li>
              <li>A log of the last successful runs is maintained for incremental processing.</li>
              <li>A retry mechanism handles network/parsing failures.</li>
             </ul>
              ETL Pipeline
              <p class="cursive">Extract</p>
              <ul>
              <li>Reading a list of links from Excel, data normalization.</li>
              <li>Filtering only outdated/unprocessed records (resource optimization).</li>
              <li>Parsing process – browser emulation with debugging, control via WebSocket (bypassing blocks, simulating user behavior).</li>
              <li>Automatic screenshot generation for verification (PyAutoGUI).</li>
              </ul>
              <p class="cursive">Transform & Validate</p>
              <ul>
              <li>Extracted prices undergo validation (format, range, anomalies).</li>
              <li>Error logging with the ability to manually input data while retaining the screenshot (fallback procedure).</li>
              <li>Grouping results by supplier for subsequent document generation.</li>
              </ul>
              <p class="cursive">Load</p>
              <ul>
              <li>Automatic generation of Word documents with embedded screenshots.</li>
              <li>Uploading documents to the corporate system via Selenium with authentication and supplier card population.</li>
              <li>Updating statuses in SQLite to track completed cycles.</li>
              </ul>

             <h3>Results</h3>
             <ul>
              <li>60% of prices are updated fully automatically; the rest
              require manual intervention (CAPTCHA entry or outdated links).</li>
              <li>Human errors have been eliminated: lost screenshots, typos
              during data entry.</li>
              <li>Traceability has been improved: every price change is linked
              to a screenshot.</li>
              <li>Scalability: the architecture allows adding new domains via
              the web interface without code changes.</li>
             </ul>
             `
           }
       },
       {
           id: 2,
           category: "extract",
           title: {
               en: "Crypto Trading Analytics",
               ru: "Витрина данных по закупкам 44‑ФЗ (ЕИС)"
           },
           description: {
               en: "Integration with Binance & Tinkoff APIs for real-time data. Pandas-based analysis with technical indicators and Matplotlib visualization.",
               ru: `Python‑приложение для мониторинга государственных
               контрактов. Инкрементальный парсинг портала ЕИС (30 000+
                 записей), хранение в нормализованной БД, веб‑интерфейс с
                 фильтрацией, поиском и возможностью классификации товаров.
                 Сокращает время поиска закупаемых товаров`
           },
           tags: ["Python", "SQLAlchemy", "SQLite", "Flask", "HTML", "CSS", "JS"],
           links: {
               github: null,
               demo: null
           },
           hasDemo: false,
           fullDescription: {
             ru: `
             <h2>Витрина данных по закупкам 44‑ФЗ (ЕИС)</h2>
             <h3>Задача</h3>
             <p>Для расчета средних цен на разные категории товаров используются контракты, заключенные по 44-ФЗ. Нужен инструмент для быстрого поиска товаров, участвующих в государственных закупках для отражения в реестре цен на категории товаров. Обычный поиск закупаемых товаров занимает много времени, необходимо заполнить фильтр, открыть карточку товара, найти информацию на нескольких вкладках, проверить штрафы и отметить контракт просмотренным во избежание повторной работы.</p>
             <h3>Решение</h3>
             <p>Спроектирована реляционная схема БД (SQLite)
              для хранения контрактов, поставщиков, товаров и классификаторов.
              Парсер на Python запускается от последней сохранённой даты -
              загружаются только новые или изменённые записи, исключая
              дублирование и экономя время.</p>
             <p>Создан веб‑интерфейс для управления процессами и просмотра
             результатов. Интерактивная таблица (DataTables) с фильтрацией по
             дате, сумме, поставщику и текстовым полям. Экспорт результатов в
             Excel/CSV. Кнопка запуска парсинга: процесс выполняется в фоне,
             статус обновляется в реальном времени. Пользователь может
             просматривать найденные товары и назначать им категории из
             справочника (ID категории). Комментарии и классификация
             сохраняются в БД, что исключает повторный просмотр одних и тех
             же позиций и улучшает качество аналитики.</p>
             <h3>Результат</h3>
             <p>Сокращение времени поиска товаров. Система комментариев
             исключает повторный просмотр.</p>

             `,
             en: `<h2>Public Procurement Data Mart (44-FZ / EIS)</h2>
             <h3>Objective</h3>
             <p>Contracts awarded under 44-FZ are used to calculate average prices for various product categories. A tool is needed to quickly search for goods involved in public procurement for inclusion in the product category price register. Manual search is time consuming: it requires filling out filters, opening the product card, locating information across several tabs, checking penalties, and marking the contract as viewed to avoid duplicate work.</p>
             <h3>Solution</h3>
             <p>A relational database schema (SQLite) was designed to store contracts, suppliers, goods, and classifiers. The Python parser runs from the last saved date – only new or changed records are loaded, eliminating duplicates and saving time.</p>
             <p>A web interface was created for process management and result viewing. An interactive table (DataTables) provides filtering by date, amount, supplier, and text fields. Results can be exported to Excel/CSV. A “Run parser” button triggers a background process with real time status updates. Users can review the retrieved goods and assign them categories from a reference list (category ID). Comments and classifications are stored in the database, preventing re examination of the same items and improving analytics quality.</p>
             <h3>Result</h3>
             <p>Search time for goods is significantly reduced. The commenting system eliminates duplicate reviews.</p>`,
           }
       },
       {
           id: 3,
           category: "extract",
           title: {
               en: "Strategy Backtesting Engine",
               ru: "Автоматизированный контроль соответствия характеристик"
           },
           description: {
               en: "Module for testing trading strategies on historical data. Multiprocessing optimization for rapid parameter tuning and signal generation.",
               ru: `Python-ETL для отслеживания изменений характеристик
               категорий товаров с портала ЕИС, сравнения с внутренним
               справочником товаров (Excel) и генерации отчёта о расхождениях.
               Ускоряет ручную сверку характеристик (более 10 тыс строк),
               ускоряет процесс с нескольких часов до минут, хранит историю
               версий в БД.`
           },
           tags: ["Python", "Requests", "SQLAlchemy", "Openpyxl"],
           links: {
               github: "https://github.com/yourusername/backtester",
               demo: null
           },
           hasDemo: false,
           fullDescription: {
             ru: `
                <h2>Движок бэктестинга стратегий</h2>
                <h3>Обзор</h3>
                <p>Движок позволяет тестировать торговые стратегии на исторических данных. Основные возможности:</p>
                <ul>
                  <li>Загрузка данных из CSV / Binance API</li>
                  <li>Расчёт индикаторов (скользящие средние, RSI)</li>
                  <li>Мультипроцессорная оптимизация параметров</li>
                  <li>Генерация сигналов и логирование сделок</li>
                </ul>
                <h3>Скриншоты</h3>
                <img src="images/backtest_chart.png" alt="График бэктеста" style="max-width:100%; margin:10px 0;">
                <img src="images/backtest_report.png" alt="Отчёт" style="max-width:100%; margin:10px 0;">
                <h3>Технологии</h3>
                <p>Python, pandas, multiprocessing, SQLite, Matplotlib</p>
              `,
             en: "..." // аналогично на английском
             },
       },
       {
           id: 4,
           category: "frontend",
           title: {
               en: "Responsive Landing Page",
               ru: "Кэширующий слой для исторических биржевых данных"
           },
           description: {
               en: "Clean, fast-loading landing page built from design mockups. Semantic HTML5, CSS3, and vanilla JavaScript for optimal performance.",
               ru: `Python-библиотека, которая предоставляет унифицированный
               доступ к данным Binance и Tinkoff API с автоматическим
               кэшированием в SQLite. Управляет пропусками, гарантирует
               целостность временных рядов и служит надёжным фундаментом для
               торговых стратегий и ботов.`
           },
           tags: ["HTML5", "CSS3", "JavaScript", "Responsive"],
           links: {
               github: "https://github.com/yourusername/landing",
               demo: "https://yourlanding.example.com"
           },
           hasDemo: true
       },
       {
           id: 5,
           category: "frontend",
           title: {
               en: "Responsive Landing Page",
               ru: "Оптимизация параметров модели с мультипроцессорным поиском"
           },
           description: {
               en: "Clean, fast-loading landing page built from design mockups. Semantic HTML5, CSS3, and vanilla JavaScript for optimal performance.",
               ru: `Адаптивный алгоритм подбора двух параметров: грубый перебор
               с выделением перспективных зон, затем уточнение с шагом до
               0.0001. Распараллеливание через multiprocessing сократило время
               расчёта в десятки раз. Результаты сохранены в Excel (все
                 комбинации с метриками, лучшие на отдельном листе). Проект
                 продемонстрировал важность строгой валидации на вневыборке:
                 параметры, оптимальные на истории, привели к убытку на новых
                 данных, что помогло избежать ложных ожиданий.`
           },
           tags: ["HTML5", "CSS3", "JavaScript", "Responsive"],
           links: {
               github: "https://github.com/yourusername/landing",
               demo: "https://yourlanding.example.com"
           },
           hasDemo: true
       },
       {
           id: 6,
           category: "frontend",
           title: {
               en: "Responsive Landing Page",
               ru: "Аналитика и отчёты по торговым стратегиям "
           },
           description: {
               en: "Clean, fast-loading landing page built from design mockups. Semantic HTML5, CSS3, and vanilla JavaScript for optimal performance.",
               ru: `Разработан модуль пост-анализа для унифицированной оценки
               торговых моделей. Автоматически рассчитывает ключевые метрики
               (прибыль, просадка, мат ожидание, годовая доходность и др.),
               строит графики капитала и распределения сделок, формирует
               многолистовые Excel‑отчёты. Поддерживает как единичные стратегии,
               так и массовую генерацию по всем валютным парам. Результат:
               единая среда для сравнения параметров и принятия инвестиционных
               решений, ускорение анализа за счёт автоматизации`
           },
           tags: ["HTML5", "CSS3", "JavaScript", "Responsive"],
           links: {
               github: "https://github.com/yourusername/landing",
               demo: "https://yourlanding.example.com"
           },
           hasDemo: true
       },
       {
           id: 7,
           category: "frontend",
           title: {
               en: "Responsive Landing Page",
               ru: "Торговый бот Binance с потоковой обработкой рыночных данных"
           },
           description: {
               en: "Clean, fast-loading landing page built from design mockups. Semantic HTML5, CSS3, and vanilla JavaScript for optimal performance.",
               ru: `Разработан автоматизированный пайплайн для получения
               исторических и потоковых цен, расчёта индикаторов в реальном
               времени и генерации торговых сигналов. Реализован механизм
               синхронизации с минутными барами без дрейфа таймингов, валидация
               сигналов перед отправкой ордеров, логирование всех сделок.
               Обеспечена устойчивость к разрывам соединения: при восстановлении
               бот дозагружает пропущенные данные, пересчитывает индикаторы и
               формирует актуальные сигналы. Поддерживается работа с несколькими
               валютными парами (последовательно) и переключение на тестовую сеть Binance`
           },
           tags: ["HTML5", "CSS3", "JavaScript", "Responsive"],
           links: {
               github: "https://github.com/yourusername/landing",
               demo: "https://yourlanding.example.com"
           },
           hasDemo: true
       }

   ];

// Filter categories with bilingual labels
const filterCategories = [
    { key: "all", label: { en: "All", ru: "Все" } },
    { key: "extract", label: { en: "Extract", ru: "Extract" } },
    { key: "data", label: { en: "Data Analysis", ru: "Анализ данных" } },
    { key: "frontend", label: { en: "Frontend", ru: "Frontend" } }
];
