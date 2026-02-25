const PATH_TO_AUDIO_FOLDER = 'records/'

// Создаем хранилище
// const storage = new AudioStorage(['rec1.webm', 'rec2.webm']);
// storage.basePath = PATH_TO_AUDIO_FOLDER; // если надо поменять путь до файлов

// Создаем генератор звуков
// const generator = new AudioGenerator();
// console.log(generator)
//
// const playBtn = document.getElementById('playBtn');
// playBtn.addEventListener('click', async () => {
//     try {
//         await generator.play({ type: 'sine', frequency: 440, duration: 2 });
//     } catch (e) {
//         console.error('Ошибка воспроизведения:', e);
//     }
// });

// ========== ИНИЦИАЛИЗАЦИЯ ==========
const generator = new AudioGenerator();


// ===== Запуск при загрузке страницы =====
document.addEventListener('DOMContentLoaded', () => {
    // Создаём экземпляр хранилища (замените на ваш реальный)
    const storage = new AudioStorage(['rec1.webm', 'rec2.webm']);
    // Инициализируем панель
    new StoragePanel('storagePanel', storage);
});
