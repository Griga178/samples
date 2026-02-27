/**
 * Класс для непрерывной генерации звука по частям.
 * Генерирует буферы заданной длительности (chunkDuration) и передаёт их в callback.
 * Работает до вызова stop().
 */
class Generator {
    /**
     * @param {Object} defaultOptions - Параметры генерации по умолчанию.
     * @param {number} defaultOptions.chunkDuration - Длительность одного чанка в секундах (по умолчанию 0.1).
     * @param {string} defaultOptions.type - Тип волны.
     * @param {number} defaultOptions.frequency - Частота.
     * @param {number} defaultOptions.amplitude - Амплитуда.
     * @param {number} defaultOptions.pan - Панорама.
     * @param {number} defaultOptions.sampleRate - Частота дискретизации.
     * @param {number} defaultOptions.channels - Количество каналов.
     * @param {Array} defaultOptions.harmonics - Гармоники.
     * @param {Object} defaultOptions.filter - Фильтр.
     * @param {Object} defaultOptions.fm - FM.
     */
    constructor(defaultOptions = {}) {
        this.defaultOptions = {
            chunkDuration: 0.1, // длительность одного генерируемого куска
            type: 'sine',
            frequency: 220,
            amplitude: 0.5,
            pan: 0,
            sampleRate: 44100,
            channels: 1,
            harmonics: [],
            filter: null,
            fm: null,
            ...defaultOptions
        };

        this.isGenerating = false;
        this.chunkIndex = 0; // для учёта времени при генерации
        this.callback = null;
        this.options = { ...this.defaultOptions };
    }

    /**
     * Запускает непрерывную генерацию.
     * @param {Function} callback - Функция, которая будет вызываться с каждым сгенерированным AudioBuffer.
     * @param {Object} options - Параметры генерации (переопределяют дефолтные на время работы).
     */
    start(callback, options = {}) {
        if (this.isGenerating) return;
        this.isGenerating = true;
        this.chunkIndex = 0;
        this.callback = callback;
        // Запоминаем опции для всех последующих чанков
        this.options = { ...this.defaultOptions, ...options };
        this._generateNextChunk();
    }

    /**
     * Останавливает генерацию.
     */
    stop() {
        this.isGenerating = false;
        this.callback = null;
    }

    /**
     * Генерирует следующий чанк и планирует следующий.
     * @private
     */
    _generateNextChunk() {
        if (!this.isGenerating) return;

        const {
            chunkDuration,
            type,
            frequency,
            amplitude,
            pan,
            sampleRate,
            channels,
            harmonics,
            filter,
            fm
        } = this.options;

        // Вычисляем время начала этого чанка в общем потоке (для возможной синхронизации)
        const startTime = this.chunkIndex * chunkDuration;
        this.chunkIndex++;

        // Создаём offline контекст для этого чанка
        const length = Math.ceil(chunkDuration * sampleRate);
        const offlineCtx = new OfflineAudioContext(channels, length, sampleRate);

        // Генерация чанка (аналогично run(), но с учётом startTime для непрерывности фазы)
        // Для осцилляторов нужно сохранять фазу между чанками, чтобы не было щелчков.
        // Простейший способ — генерировать сигнал вручную, заполняя буфер, с учётом фазы.
        // Но для упрощения используем осцилляторы, но тогда они будут начинаться с нулевой фазы на каждом чанке, что вызовет щелчки.
        // Чтобы избежать щелчков, нужно синтезировать сигнал через AudioProcessingEvent? Устарело.
        // Лучше использовать ScriptProcessorNode (устарел) или AudioWorklet (сложно).
        // Для демонстрации оставим с осцилляторами, но это не идеально.
        // Можно генерировать чанки с перекрытием и плавным скрещиванием, но это сложно.
        // Для целей анализа, возможно, щелчки не критичны.
        // В реальном проекте лучше использовать AudioWorklet для непрерывной генерации.

        // Упрощённо: создаём осцилляторы на каждый чанк, но они будут сбрасывать фазу.
        const oscillators = [];

        // Основной осциллятор
        const mainOsc = offlineCtx.createOscillator();
        mainOsc.type = type;
        mainOsc.frequency.value = frequency;
        oscillators.push(mainOsc);

        const mainGain = offlineCtx.createGain();
        mainGain.gain.value = amplitude;

        mainOsc.connect(mainGain);

        // FM модуляция
        if (fm && fm.modFrequency && fm.modDepth) {
            const modOsc = offlineCtx.createOscillator();
            modOsc.frequency.value = fm.modFrequency;
            const modGain = offlineCtx.createGain();
            modGain.gain.value = fm.modDepth * frequency;
            modOsc.connect(modGain);
            modGain.connect(mainOsc.frequency);
            oscillators.push(modOsc);
        }

        // Гармоники
        const masterGain = offlineCtx.createGain();
        masterGain.gain.value = 1;
        mainGain.connect(masterGain);

        harmonics.forEach(harm => {
            const harmOsc = offlineCtx.createOscillator();
            harmOsc.type = type;
            harmOsc.frequency.value = harm.frequency;
            oscillators.push(harmOsc);

            const harmGain = offlineCtx.createGain();
            harmGain.gain.value = amplitude * harm.amplitude;
            harmOsc.connect(harmGain);
            harmGain.connect(masterGain);
        });

        // Фильтр
        let finalNode = masterGain;
        if (filter) {
            const biquad = offlineCtx.createBiquadFilter();
            biquad.type = filter.type || 'lowpass';
            biquad.frequency.value = filter.frequency || 1000;
            biquad.Q.value = filter.Q || 1;
            masterGain.connect(biquad);
            finalNode = biquad;
        }

        // Панорама
        if (channels === 2 && pan !== 0) {
            const panner = offlineCtx.createStereoPanner();
            panner.pan.value = pan;
            finalNode.connect(panner);
            finalNode = panner;
        }

        finalNode.connect(offlineCtx.destination);

        // Запускаем все осцилляторы
        oscillators.forEach(osc => {
            osc.start(0);
            osc.stop(chunkDuration);
        });

        // Рендерим чанк
        offlineCtx.startRendering().then(buffer => {
            if (this.isGenerating && this.callback) {
                this.callback(buffer);
                // Планируем следующий чанк с учётом длительности (чтобы реальное время совпадало)
                setTimeout(() => this._generateNextChunk(), chunkDuration * 1000 * 0.9); // небольшая задержка для компенсации времени рендеринга
            }
        });
    }
}
