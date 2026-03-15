document.addEventListener('DOMContentLoaded', () => {
  let audioContext = null;
  let microphone = null;
  let analyzer = null;
  let micUI = null;
  let analyzerUI = null;
  let isInitialized = false;

  const initApp = async () => {
    if (isInitialized) return;
    isInitialized = true;

    // Создаём и резюмим AudioContext внутри жеста пользователя
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Создаём компоненты
    microphone = new Microphone(audioContext);
    analyzer = new Analyzer(audioContext);
    micUI = new MicrophoneUI(microphone);
    analyzerUI = new AnalyzerUI(analyzer);

    // Инициализация UI
    micUI.init();
    analyzerUI.init();

    // Связывание: микрофон → анализатор → колонки
    microphone.on('stateChange', (isActive) => {
      if (isActive) {
        const output = microphone.getOutput();
        if (output) {
          analyzer.connect(output);
        }
      }
    });

    // Экспорт для отладки
    window.app = { audioContext, microphone, analyzer, micUI, analyzerUI };

    console.log('✅ Аудиосистема запущена');
  };

  // Запуск по первому клику/тапу
  const startOnGesture = async (e) => {
    e?.preventDefault?.();
    await initApp();

    // Убираем слушатели после запуска
    document.removeEventListener('click', startOnGesture);
    document.removeEventListener('touchstart', startOnGesture);
  };

  document.addEventListener('click', startOnGesture, { passive: false });
  document.addEventListener('touchstart', startOnGesture, { passive: false });

  // Визуальная подсказка
  console.log('🎵 Нажмите на страницу для запуска');
});
