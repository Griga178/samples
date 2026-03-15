// 📄 js/core/Analyzer.js — минимальная версия
class Analyzer {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 4096;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.freqData = new Uint8Array(this.bufferLength);
    this.timeData = new Float32Array(this.analyser.fftSize);
    this.isRunning = false;
  }

  connect(source) {
    if (source) source.connect(this.analyser);
  }

  // ✅ Обязательно добавьте эти методы:
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  getHarmonics() {
    if (!this.isRunning) return [];
    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getFloatTimeDomainData(this.timeData);

    const sampleRate = this.audioContext.sampleRate;
    const binSize = sampleRate / this.analyser.fftSize;
    const harmonics = [];

    for (let i = 1; i < this.bufferLength - 1; i++) {
      const amp = this.freqData[i] / 255;
      if (amp > 0.1 && amp > this.freqData[i-1]/255 && amp > this.freqData[i+1]/255) {
        const frequency = i * binSize;
        if (frequency < 8000 && frequency > 60) {
          harmonics.push({
            frequency,
            amplitude: amp,
            phase: this._getPhase(i, frequency)
          });
        }
      }
    }
    return harmonics.sort((a, b) => b.amplitude - a.amplitude);
  }

  _getPhase(bin, frequency) {
    const period = Math.floor(this.audioContext.sampleRate / frequency);
    if (period < 10 || period > this.timeData.length - 2) return 0;
    for (let i = 0; i < period; i++) {
      if (this.timeData[i] <= 0 && this.timeData[i+1] > 0) {
        return (i / period) * Math.PI * 2;
      }
    }
    return 0;
  }
}

window.Analyzer = Analyzer; // ✅ Обязательно экспортируйте
