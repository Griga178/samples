// Импорты в основном файле
/**
 * Основная функция инициализации приложения
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Игра "Прыгай" инициализируется...');

    // Инициализация компонентов
    const canvas = document.getElementById('gameCanvas');
    const analyzer = new Analyzer();
    const modalManager = new ModalManager();
    const resultsTable = new ResultsTable();

    // Создание игры
    const game = new Game(canvas, CANVAS_COLORS);
    game.analyzer = analyzer; // Передаем анализатор в игру

    // Создание меню
    const menu = new Menu(game, modalManager);

    // Настройка обработчика правил
    const instructionsHeader = document.querySelector('.instructions h3');
    if (instructionsHeader) {
        instructionsHeader.addEventListener('click', () => {
            modalManager.open('rules');
        });
    }

    // Загрузка сохраненных результатов (если есть)
    const savedResults = loadSavedResults();
    if (savedResults.length > 0) {
        resultsTable.update(savedResults);
    }

    console.log('✅ Игра успешно инициализирована!');

    // Функция загрузки сохраненных результатов
    function loadSavedResults() {
        try {
            const saved = localStorage.getItem('gameResults');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Ошибка загрузки результатов:', e);
            return [];
        }
    }

    // Функция сохранения результатов
    window.saveGameResult = function(resultData) {
        try {
            const saved = loadSavedResults();
            saved.push(resultData);
            localStorage.setItem('gameResults', JSON.stringify(saved));
        } catch (e) {
            console.error('Ошибка сохранения результата:', e);
        }
    };
});

/**
 * Глобальная функция для тестирования
 */
window.debugGame = function() {
    console.log('🔧 Отладочная информация:');
    console.log('Canvas:', document.getElementById('gameCanvas'));
    console.log('Кнопки:', {
        start: document.getElementById('startButton'),
        restart: document.getElementById('restartButton'),
        settings: document.getElementById('settingsButton'),
        exit: document.getElementById('exitButton')
    });
};
