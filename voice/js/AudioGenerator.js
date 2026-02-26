/**
 * Класс для генерации звуковых сигналов с использованием Web Audio API.
 */
class AudioGenerator {
    /**
     * @param {Object} defaultOptions - Настройки по умолчанию для всех генераций.
     * @param {number} defaultOptions.sampleRate - Частота дискретизации (по умолчанию 44100).
     * @param {number} defaultOptions.channels - Количество каналов (1 - моно, 2 - стерео).
     */
    constructor(defaultOptions = {}) {
        this.defaultOptions = {
            sampleRate: defaultOptions.sampleRate || 44100,
            channels: defaultOptions.channels || 1,
        };
        // Создаём offline-контекст для генерации буфера (можно и реальный, но offline удобнее)
        this.offlineCtx = new OfflineAudioContext(
            this.defaultOptions.channels,
            1, // длина будет переопределена при генерации
            this.defaultOptions.sampleRate
        );
    }

    /**
     * Генерирует AudioBuffer на основе переданных параметров.
     * @param {Object} options - Параметры генерации.
     * @param {string} options.type - Тип волны: 'sine', 'square', 'sawtooth', 'triangle', 'noise'.
     * @param {number} options.frequency - Частота в Гц (для noise игнорируется).
     * @param {number} options.duration - Длительность в секундах.
     * @param {number} options.amplitude - Амплитуда (0..1), по умолчанию 0.5.
     * @param {number} options.pan - Панорама (-1 лево, 1 право), только для стерео.
     * @returns {AudioBuffer}
     */
    generate(options) {
        const opts = { ...this.defaultOptions, ...options };
        const { type, frequency, duration, amplitude = 0.5, pan = 0 } = opts;

        // Создаём offline-контекст с нужной длительностью
        const length = Math.ceil(duration * opts.sampleRate);
        const offlineCtx = new OfflineAudioContext(opts.channels, length, opts.sampleRate);

        // Создаём источник в зависимости от типа
        let sourceNode;
        if (type === 'noise') {
            // Для шума используем BufferSource с белым шумом
            const bufferSize = length;
            const noiseBuffer = offlineCtx.createBuffer(opts.channels, bufferSize, opts.sampleRate);
            for (let channel = 0; channel < opts.channels; channel++) {
                const data = noiseBuffer.getChannelData(channel);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * amplitude;
                }
            }
            sourceNode = offlineCtx.createBufferSource();
            sourceNode.buffer = noiseBuffer;
        } else {
            // Используем OscillatorNode для тональных сигналов
            sourceNode = offlineCtx.createOscillator();
            sourceNode.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
            sourceNode.frequency.value = frequency;
        }

        // Управление амплитудой
        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = amplitude;

        // Панорамирование (если стерео)
        let finalNode = gainNode;
        if (opts.channels === 2 && pan !== 0) {
            const panner = offlineCtx.createStereoPanner();
            panner.pan.value = pan;
            gainNode.connect(panner);
            finalNode = panner;
        }

        // Подключение
        sourceNode.connect(gainNode);
        finalNode.connect(offlineCtx.destination);

        // Рендерим буфер (синхронно, но в реале это асинхронно)
        // Внимание: startRendering возвращает Promise, поэтому метод должен быть async
        // Но для простоты можно вернуть промис, либо сделать метод async.
        // Сделаем его async, чтобы можно было await.
        return offlineCtx.startRendering();
    }

    /**
     * Упрощённый синхронный метод (возвращает промис, но можно использовать .then).
     */
    async generateAsync(options) {
        return await this.generate(options);
    }

    /**
     * Воспроизводит сгенерированный звук через реальный AudioContext.
     * @param {Object} options - Те же параметры, что и для generate.
     * @returns {Promise<void>}
     */
    async play(options) {
        const buffer = await this.generate(options);
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        // Возвращаем промис, который резолвится после окончания
        return new Promise(resolve => {
            source.onended = resolve;
        });
    }

    /**
     * Сохраняет сгенерированный звук в WAV файл и скачивает.
     * @param {Object} options - Параметры генерации.
     * @param {string} filename - Имя файла (по умолчанию 'generated.wav').
     */
    async download(options, filename = 'generated.wav') {
        const buffer = await this.generate(options);
        const wavBlob = this._bufferToWav(buffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Конвертирует AudioBuffer в WAV Blob.
     * @private
     */
    _bufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const length = buffer.length;
        const bitsPerSample = 16;
        const bytesPerSample = bitsPerSample / 8;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = length * blockAlign;

        const header = new ArrayBuffer(44);
        const view = new DataView(header);

        // RIFF chunk
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(view, 8, 'WAVE');
        // fmt subchunk
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // audio format (PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        // data subchunk
        writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Собираем данные
        const audioData = new Float32Array(length * numChannels);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                audioData[i * numChannels + channel] = channelData[i];
            }
        }

        // Конвертируем в 16-bit PCM
        const pcmData = new Int16Array(length * numChannels);
        for (let i = 0; i < audioData.length; i++) {
            const s = Math.max(-1, Math.min(1, audioData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Объединяем заголовок и данные
        const wavBuffer = new ArrayBuffer(44 + pcmData.buffer.byteLength);
        const wavView = new Uint8Array(wavBuffer);
        wavView.set(new Uint8Array(header), 0);
        wavView.set(new Uint8Array(pcmData.buffer), 44);

        return new Blob([wavBuffer], { type: 'audio/wav' });
    }
}

// Вспомогательная функция для записи строки в DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Возможные расширения

// Добавить поддержку ADSR-огибающей (создание GainNode с автоматизацией).
//
// Частотная модуляция (FM): передавать параметры modFrequency, modDepth.
//
// Гармоники: передавать массив harmonics с частотами и амплитудами.
//
// Фильтры: после генерации применять BiquadFilterNode.
