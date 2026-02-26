const PATH_TO_AUDIO_FOLDER = 'records/'

// ========== ИНИЦИАЛИЗАЦИЯ ==========

// Создаем хранилище
const generator = new AudioGenerator();

// Создаем генератор звуков
const storage = new AudioStorage(['rec1.webm', 'rec2.webm']);

// ===== Запуск при загрузке страницы =====
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем панель
    new StoragePanel('storagePanel', storage);
});
