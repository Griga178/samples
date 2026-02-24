// Элементы DOM
const startBtn = document.getElementById('startRecordBtn');
const stopBtn = document.getElementById('stopRecordBtn');
const playerContainer = document.getElementById('player-container');
const audioPlayer = document.getElementById('audioPlayer');
const rmsCanvas = document.getElementById('rmsGraph');
const rmsSpan = document.getElementById('rmsValue');

// Переменные для записи
let mediaRecorder;
let audioChunks = [];
let audioBlob = null;
let audioUrl = null;

// Переменные для воспроизведения и анализа
let audioContext = null;
let analyser = null;
let source = null;
let animationId = null;
let rmsData = [];           // массив значений RMS для графика
const maxDataPoints = 200;   // количество точек на графике

// Инициализация canvas для RMS
const rmsCtx = rmsCanvas.getContext('2d');
const canvasWidth = rmsCanvas.width;
const canvasHeight = rmsCanvas.height;

// ---- Запись ----
startBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            // Освобождаем микрофон
            stream.getTracks().forEach(track => track.stop());

            // Создаём blob и URL
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            playerContainer.style.display = 'block';

            // Активируем кнопки
            startBtn.disabled = false;
            stopBtn.disabled = true;
        };

        mediaRecorder.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } catch (err) {
        alert('Ошибка доступа к микрофону: ' + err.message);
    }
});

stopBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
});

// ---- Воспроизведение и анализ ----
audioPlayer.addEventListener('play', () => {
    // Если уже был анализ, останавливаем
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Создаём аудиоконтекст, если ещё нет
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Если контекст в suspended, запускаем (требуется после жеста пользователя)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    // Создаём источник из аудио-элемента
    if (source) {
        source.disconnect();
    }
    source = audioContext.createMediaElementSource(audioPlayer);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // Сброс данных для нового графика
    rmsData = [];
    drawRmsGraph(); // очистит canvas

    // Запускаем цикл обновления
    updateAnalysis();
});

audioPlayer.addEventListener('pause', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
});

audioPlayer.addEventListener('ended', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    // Можно оставить график как есть
});

function updateAnalysis() {
    if (!analyser) return;

    const bufferLength = analyser.fftSize;
    const timeData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeData);

    // Вычисляем RMS
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        const value = (timeData[i] - 128) / 128; // нормализация от -1 до 1
        sum += value * value;
    }
    const rms = Math.sqrt(sum / bufferLength);
    rmsSpan.textContent = rms.toFixed(4);

    // Добавляем значение в массив для графика
    rmsData.push(rms);
    if (rmsData.length > maxDataPoints) {
        rmsData.shift();
    }

    // Рисуем график
    drawRmsGraph();

    // Запрашиваем следующий кадр
    animationId = requestAnimationFrame(updateAnalysis);
}

function drawRmsGraph() {
    rmsCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (rmsData.length === 0) return;

    // Настройка стиля
    rmsCtx.strokeStyle = '#4CAF50';
    rmsCtx.lineWidth = 2;
    rmsCtx.beginPath();

    const step = canvasWidth / maxDataPoints;
    let x = 0;
    for (let i = 0; i < rmsData.length; i++) {
        // Нормируем высоту: предполагаем RMS максимум около 0.5 (можно подобрать)
        const y = canvasHeight - (rmsData[i] * canvasHeight * 2); // примерное масштабирование
        const clampedY = Math.min(canvasHeight, Math.max(0, y));
        if (i === 0) {
            rmsCtx.moveTo(x, clampedY);
        } else {
            rmsCtx.lineTo(x, clampedY);
        }
        x += step;
    }
    rmsCtx.stroke();
}

// Очистка при загрузке нового файла (можно добавить)
audioPlayer.addEventListener('loadstart', () => {
    rmsData = [];
    drawRmsGraph();
    rmsSpan.textContent = '0.00';
});
