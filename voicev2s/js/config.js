// Конфигурационные константы проекта
const CONFIG = {
  // Analyzer
  ANALYZER_UPDATE_RATE: 30, // fps

  // AudioCatcher
  BUFFER_SIZE: 4096,
  HOP_SIZE: 2048,
  ANALYSIS_INTERVAL: 100, // ms
  MAX_ACTIVE_TEMPLATES: 50,
  MATCH_VISUAL_DURATION: 500, // ms

  // Match Thresholds
  MATCH_THRESHOLDS: {
    YIN: 10,              // центов
    MCYIN: 8,             // центов
    Autocorrelation: 0.85, // коэффициент корреляции
    SpectralDistance: 0.2  // нормализованное расстояние
  },

  // Microphone Filters
  MIC_FILTERS_DEFAULT: {
    lowpass: 8000,
    highpass: 60,
    noiseGate: -42,
    compressor: {
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    }
  },

  // Storage
  MAX_RECORDING_SIZE_MB: 50,
  DB_NAME: 'AudioTrainingDB',
  DB_VERSION: 1,
  STORE_NAME: 'recordings',

  // WAV Export
  WAV_EXPORT_CONFIG: {
    sampleRate: 44100,
    bitDepth: 16,
    channels: 1 // mono
  },

  // Visual Quality Colors
  QUALITY_COLORS: {
    high: '#22c55e',    // >90%
    medium: '#eab308',  // 70-90%
    low: '#ef4444'      // <70%
  },

  // Audio
  SAMPLE_RATE: 44100,
  FFT_SIZE: 2048
};

// Глобальный доступ для модулей без ES6 import
window.CONFIG = CONFIG;
