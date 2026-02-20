// Цветовая схема интерфейса

const INTERFACE_COLORS = {
    containerBg: "#0f172a",              // Темный фон контейнера
    divBg: "#1e293b",                    // Фон блоков (темно-синий)
    divBorderColor: "rgba(255, 255, 255, 0.1)",  // Прозрачная граница
    btnBg: "#06b6d4",                    // Бирюзовый для кнопок
    btnText: "#ffffff",                  // Белый текст на кнопках
    tableBg: "#1e293b",                  // Фон таблицы (темно-синий)
    tableText: "#f1f5f9",                // Светлый текст в таблице
    tableHeaderBg: "rgba(6, 182, 212, 0.9)",     // Бирюзовый для заголовка таблицы
    tableHeaderText: "#ffffff",          // Белый текст в заголовке
    secondaryBg: "#151e2d",              // Вторичный фон (для модалок)
    accentGreen: "#10b981",              // Зеленый акцент
    accentAmber: "#f59e0b",              // Янтарный акцент
    accentRed: "#ef4444",                // Красный акцент
    accentPurple: "#8b5cf6",             // Фиолетовый акцент
    textPrimary: "#f1f5f9",              // Основной текст
    textSecondary: "#cbd5e1",            // Вторичный текст
    borderLight: "rgba(255, 255, 255, 0.15)"     // Светлая граница
};

// Цветовая схема игры (canvas)
const CANVAS_COLORS = {
    circle: {
        initial: "rgba(6, 182, 212, 0.15)",     // Бирюзовый с прозрачностью (первая отрисовка)
        hover: "#f59e0b",                       // Янтарный (круг на который надо навести мышь)
        readyToStart: "#10b981",                // Зеленый (навели, готов к старту)
        inMotion: "rgba(14, 116, 144, 0.6)",    // Темно-бирюзовый полупрозрачный (пошло движение)
        finish: "#8b5cf6",                      // Фиолетовый (дошли до последнего круга)
        success: "#10b981",                     // Зеленый (попал в цель)
        errorMiss: "#ef4444",                   // Красный (не попал в цель)
        errorDeviation: "#f97316"               // Оранжевый (отклонение от курса)
    },
    background: {
        welcome: "#f8fafc",                     // Светлый фон перед стартом
        gameStart: "#f0f9ff",                   // Голубоватый фон во время игры
        roundEnded: "#dbeafe",                  // Светло-голубой фон закончен раунд
        gameStopped: "#93c5fd",                 // Голубой фон закончена игра
        exit: "#0f172a",                        // Темный фон во время выхода
        exitText: "#f1f5f9",                    // Светлый текст при выходе
        gradientStart: "#dbeafe",               // Начало градиента
        gradientEnd: "#bfdbfe"                  // Конец градиента
    }
};

// Настройки по умолчанию
const DEFAULT_SETTINGS = {
    circlesAmount: 6,
    radius: 25,
    distance: 150,
    startCoord: { x: 400, y: 300 },
    maxCircles: 20,
    minRadius: 10,
    maxRadius: 60,
    minDistance: 50,
    maxDistance: 300
};

// Валидация настроек
const validateSettings = (settings) => {
    const errors = [];

    if (settings.circlesAmount < 1 || settings.circlesAmount > DEFAULT_SETTINGS.maxCircles) {
        errors.push(`Количество целей должно быть от 1 до ${DEFAULT_SETTINGS.maxCircles}`);
    }

    if (settings.radius < DEFAULT_SETTINGS.minRadius || settings.radius > DEFAULT_SETTINGS.maxRadius) {
        errors.push(`Радиус должен быть от ${DEFAULT_SETTINGS.minRadius} до ${DEFAULT_SETTINGS.maxRadius}`);
    }

    if (settings.distance < DEFAULT_SETTINGS.minDistance || settings.distance > DEFAULT_SETTINGS.maxDistance) {
        errors.push(`Дистанция должна быть от ${DEFAULT_SETTINGS.minDistance} до ${DEFAULT_SETTINGS.maxDistance}`);
    }

    return errors;
};
