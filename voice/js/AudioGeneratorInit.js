

// Элементы формы
const sampleRateInput = document.getElementById('sampleRate');
const channelsSelect = document.getElementById('channels');
const typeSelect = document.getElementById('type');
const frequencyInput = document.getElementById('frequency');
const durationInput = document.getElementById('duration');
const amplitudeRange = document.getElementById('amplitude');
const amplitudeSpan = document.getElementById('amplitudeValue');
const panRange = document.getElementById('pan');
const panSpan = document.getElementById('panValue');

// Элементы для нереализованных параметров (не используются, но можно считывать при желании)
const attackInput = document.getElementById('attack');
const decayInput = document.getElementById('decay');
const sustainInput = document.getElementById('sustain');
const releaseInput = document.getElementById('release');
const modFreqInput = document.getElementById('modFrequency');
const modDepthInput = document.getElementById('modDepth');
const harmonicsInput = document.getElementById('harmonics');
const filterTypeSelect = document.getElementById('filterType');
const filterFreqInput = document.getElementById('filterFreq');
const filterQInput = document.getElementById('filterQ');

// Отображение текущих значений ползунков
amplitudeRange.addEventListener('input', () => {
    amplitudeSpan.textContent = amplitudeRange.value;
});
panRange.addEventListener('input', () => {
    panSpan.textContent = panRange.value;
});

// Функция сбора основных параметров из формы
function getBasicOptions() {
    return {
        sampleRate: parseInt(sampleRateInput.value, 10),
        channels: parseInt(channelsSelect.value, 10),
        type: typeSelect.value,
        frequency: parseFloat(frequencyInput.value),
        duration: parseFloat(durationInput.value),
        amplitude: parseFloat(amplitudeRange.value),
        pan: parseFloat(panRange.value)
    };
}

// Функция сбора всех параметров (включая нереализованные, но они пока игнорируются)
function getAllOptions() {
    const basic = getBasicOptions();
    // Можно добавить нереализованные поля, но они не используются в заглушках
    return basic;
}

// Обновление статуса
function setStatus(message) {
    document.getElementById('status').textContent = message;
}

// ========== ОБРАБОТЧИКИ КНОПОК ==========
document.getElementById('playBtn').addEventListener('click', async () => {
    const options = getAllOptions();
    setStatus(`Воспроизведение: ${options.type} ${options.frequency} Гц...`);
    try {
        await generator.play(options);
        setStatus('Воспроизведение завершено');
    } catch (e) {
        setStatus('Ошибка воспроизведения');
        console.error(e);
    }
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const options = getAllOptions();
    setStatus('Генерация для сохранения...');
    try {
        const buffer = await generator.generate(options);
        // Конвертируем AudioBuffer в Blob (упрощённо, для примера)
        // В реальности нужно использовать AudioGenerator.download или свой конвертер
        // Здесь просто имитируем сохранение
        const blob = new Blob(['dummy audio data'], { type: 'audio/webm' });
        const id = storage.addRecord(blob, `generated_${Date.now()}.webm`);
        setStatus(`Сохранено в хранилище с ID: ${id}`);
    } catch (e) {
        setStatus('Ошибка сохранения');
        console.error(e);
    }
});

document.getElementById('downloadBtn').addEventListener('click', async () => {
    const options = getAllOptions();
    const filename = `generated_${options.type}_${options.frequency}Hz.wav`;
    setStatus(`Подготовка файла ${filename}...`);
    try {
        await generator.download(options, filename);
        setStatus('Файл скачан (имитация)');
    } catch (e) {
        setStatus('Ошибка скачивания');
        console.error(e);
    }
});
