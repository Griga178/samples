/* =========================================
   PROJECTS DATA
   Each project has bilingual content
   ========================================= */

   const projects = [
       {
           id: 1,
           category: "backend",
           title: {
               en: "Multi-Platform Web Scraper",
               ru: "Мультиплатформенный парсер"
           },
           description: {
               en: "Advanced scraping system with Selenium and debugger mode for bypassing anti-bot protections. Includes auto-file upload automation.",
               ru: "Продвинутая система парсинга на Selenium с режимом отладки для обхода защит. Включает автоматизацию загрузки файлов."
           },
           tags: ["Python", "Selenium", "Requests", "PyAutoGUI"],
           links: {
               github: "https://github.com/yourusername/scraper",
               demo: null
           },
           hasDemo: false
       },
       {
           id: 2,
           category: "data",
           title: {
               en: "Crypto Trading Analytics",
               ru: "Аналитика крипто-торговли"
           },
           description: {
               en: "Integration with Binance & Tinkoff APIs for real-time data. Pandas-based analysis with technical indicators and Matplotlib visualization.",
               ru: "Интеграция с API Binance и Тинькофф для данных в реальном времени. Анализ на Pandas с техническими индикаторами и визуализацией."
           },
           tags: ["Python", "Pandas", "API", "Matplotlib", "SQLAlchemy"],
           links: {
               github: "https://github.com/yourusername/trading-analytics",
               demo: null
           },
           hasDemo: false
       },
       {
           id: 3,
           category: "backend",
           title: {
               en: "Strategy Backtesting Engine",
               ru: "Движок бэктестинга стратегий"
           },
           description: {
               en: "Module for testing trading strategies on historical data. Multiprocessing optimization for rapid parameter tuning and signal generation.",
               ru: "Модуль для тестирования стратегий на исторических данных. Оптимизация через multiprocessing для быстрой настройки параметров."
           },
           tags: ["Python", "Multiprocessing", "Algorithms", "Finance"],
           links: {
               github: "https://github.com/yourusername/backtester",
               demo: null
           },
           hasDemo: false
       },
       {
           id: 4,
           category: "frontend",
           title: {
               en: "Responsive Landing Page",
               ru: "Адаптивный лендинг"
           },
           description: {
               en: "Clean, fast-loading landing page built from design mockups. Semantic HTML5, CSS3, and vanilla JavaScript for optimal performance.",
               ru: "Чистый, быстрый лендинг по готовым макетам. Семантический HTML5, CSS3 и ванильный JavaScript для максимальной производительности."
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
    { key: "data", label: { en: "Data Analysis", ru: "Анализ данных" } },
    { key: "backend", label: { en: "Python Backend", ru: "Python Backend" } },
    { key: "frontend", label: { en: "Frontend", ru: "Frontend" } }
];
