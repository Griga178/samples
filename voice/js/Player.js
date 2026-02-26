/**
 * Плеер для непрерывного воспроизведения последовательности AudioBuffer.
 * Буферы добавляются через enqueueBuffer() и воспроизводятся один за другим без зазоров.
 */
class Player {
    /**
     * @param {Object} options
     * @param {AudioContext} [options.audioContext] - Внешний AudioContext (если не задан, создаётся новый).
     * @param {number} [options.gain] - Начальная громкость (0..1).
     */
    constructor(options = {}) {
        this.audioContext = options.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.gainValue = options.gain !== undefined ? options.gain : 1;

        // Узел громкости (общий для всех источников)
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.gainValue;
        this.gainNode.connect(this.audioContext.destination);

        // Очередь буферов, ожидающих воспроизведения
        this.queue = [];

        // Время (в секундах), когда закончится играть последний запланированный буфер
        this.scheduledEndTime = 0;

        // Флаг, указывающий, что плеер активен (не остановлен)
        this.isActive = true;

        // Колбэк, вызываемый, когда очередь становится пустой (опционально)
        this.onEmpty = null;
    }

    /**
     * Добавляет буфер в очередь на воспроизведение.
     * @param {AudioBuffer} buffer - Буфер для воспроизведения.
     */
    enqueueBuffer(buffer) {
        if (!this.isActive) return;

        // Если контекст приостановлен, запускаем (требуется жест пользователя)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.warn('Не удалось запустить контекст:', e));
        }

        // Вычисляем время старта для этого буфера
        let startTime;
        if (this.scheduledEndTime === 0) {
            // Очередь пуста – начинаем немедленно
            startTime = this.audioContext.currentTime;
        } else {
            // Начинаем сразу после предыдущего буфера
            startTime = this.scheduledEndTime;
        }

        // Создаём источник
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.gainNode);

        // Планируем воспроизведение
        source.start(startTime);
        this.scheduledEndTime = startTime + buffer.duration;

        // При завершении удаляем источник из памяти (и проверяем очередь)
        source.onended = () => {
            source.disconnect();
            // Если после этого буфера очередь пуста, вызываем колбэк
            if (this.queue.length === 0 && this.scheduledEndTime <= this.audioContext.currentTime) {
                if (this.onEmpty) this.onEmpty();
            }
        };

        // Сохраняем источник в очереди, чтобы можно было остановить при необходимости
        this.queue.push({ source, startTime, duration: buffer.duration });
    }

    /**
     * Останавливает всё воспроизведение и очищает очередь.
     */
    stop() {
        this.isActive = false;
        // Останавливаем все запланированные источники
        this.queue.forEach(item => {
            try {
                item.source.stop();
                item.source.disconnect();
            } catch (e) {}
        });
        this.queue = [];
        this.scheduledEndTime = 0;
    }

    /**
     * Возобновляет приём новых буферов после stop() (опционально).
     */
    resume() {
        this.isActive = true;
    }

    /**
     * Устанавливает громкость.
     * @param {number} value - 0..1
     */
    setGain(value) {
        this.gainValue = Math.max(0, Math.min(1, value));
        if (this.gainNode) {
            this.gainNode.gain.value = this.gainValue;
        }
    }

    getGain() {
        return this.gainValue;
    }

    /**
     * Закрывает контекст и освобождает ресурсы.
     */
    async close() {
        this.stop();
        if (this.audioContext) {
            await this.audioContext.close();
        }
    }
}
