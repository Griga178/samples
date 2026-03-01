class Analyzer extends EventEmitter {
  constructor(audioContext) {
    super();
    this.audioContext = audioContext;
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = CONFIG.FFT_SIZE || 4096;
    this.analyser.smoothingTimeConstant = 0.8;

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.timeDataArray = new Float32Array(this.analyser.fftSize);

    this.isRunning = false;
    this.updateInterval = null;
    this.lastData = null;

    // Harmonics
    this.detectedHarmonics = [];
    this.averageHarmonics = [];
    this.harmonicsHistory = [];
    this.fundamentalFrequency = null;
    this.harmonicsConfig = {
      threshold: CONFIG.HARMONICS_THRESHOLD || 0.3,
      averageWindow: CONFIG.HARMONICS_AVERAGE_WINDOW || 50,
      minFrequency: 80,
      maxFrequency: 4000,
      minAmplitude: 0.1
    };
  }

  connect(source) {
    if (source) {
      source.connect(this.analyser);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const interval = 1000 / (CONFIG.ANALYZER_UPDATE_RATE || 30);
    this.updateInterval = setInterval(() => this._analyze(), interval);
    this.emit('stateChange', true);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.emit('stateChange', false);
  }

  _analyze() {
    this.analyser.getByteFrequencyData(this.dataArray);
    this.analyser.getFloatTimeDomainData(this.timeDataArray);

    const rms = this._calculateRMS();
    const pitch = this._calculatePitch();
    const zcr = this._calculateZCR();
    const spectrum = Array.from(this.dataArray);

    this.detectedHarmonics = this._detectHarmonics(spectrum, pitch);
    this._updateAverageHarmonics(this.detectedHarmonics);
    this.fundamentalFrequency = pitch;

    this.lastData = {
      rms,
      pitch,
      zcr,
      spectrum,
      harmonics: this.detectedHarmonics,
      averageHarmonics: this.averageHarmonics,
      fundamentalFrequency: this.fundamentalFrequency,
      timestamp: Date.now()
    };

    this.emit('data', this.lastData);
    if (this.detectedHarmonics.length > 0) {
      this.emit('harmonicsDetected', this.detectedHarmonics);
    }
  }

  _detectHarmonics(spectrum, fundamentalPitch) {
    const harmonics = [];
    if (!fundamentalPitch || fundamentalPitch < this.harmonicsConfig.minFrequency) {
      return harmonics;
    }

    const sampleRate = this.audioContext.sampleRate;
    const binSize = sampleRate / this.analyser.fftSize;
    const fundamentalBin = Math.round(fundamentalPitch / binSize);
    const fundamentalAmplitude = spectrum[fundamentalBin] / 255;

    if (fundamentalAmplitude >= this.harmonicsConfig.minAmplitude) {
      harmonics.push({
        frequency: fundamentalPitch,
        amplitude: fundamentalAmplitude,
        order: 1,
        bin: fundamentalBin
      });
    }

    const maxHarmonics = 8;
    for (let order = 2; order <= maxHarmonics; order++) {
      const harmonicFreq = fundamentalPitch * order;
      if (harmonicFreq > this.harmonicsConfig.maxFrequency) break;

      const harmonicBin = Math.round(harmonicFreq / binSize);
      if (harmonicBin >= this.bufferLength) break;

      let peakAmplitude = 0;
      let peakBin = harmonicBin;

      for (let offset = -2; offset <= 2; offset++) {
        const checkBin = harmonicBin + offset;
        if (checkBin >= 0 && checkBin < this.bufferLength) {
          const amplitude = spectrum[checkBin] / 255;
          if (amplitude > peakAmplitude) {
            peakAmplitude = amplitude;
            peakBin = checkBin;
          }
        }
      }

      if (peakAmplitude >= this.harmonicsConfig.threshold) {
        harmonics.push({
          frequency: peakBin * binSize,
          amplitude: peakAmplitude,
          order: order,
          bin: peakBin
        });
      }
    }
    return harmonics;
  }

  _updateAverageHarmonics(currentHarmonics) {
    this.harmonicsHistory.push(JSON.parse(JSON.stringify(currentHarmonics)));
    if (this.harmonicsHistory.length > this.harmonicsConfig.averageWindow) {
      this.harmonicsHistory.shift();
    }
    this.averageHarmonics = this._calculateAverageHarmonics();
  }

  _calculateAverageHarmonics() {
    if (this.harmonicsHistory.length === 0) return [];
    const grouped = {};

    this.harmonicsHistory.forEach(frame => {
      frame.forEach(h => {
        if (!grouped[h.order]) {
          grouped[h.order] = { frequencies: [], amplitudes: [], bins: [] };
        }
        grouped[h.order].frequencies.push(h.frequency);
        grouped[h.order].amplitudes.push(h.amplitude);
        grouped[h.order].bins.push(h.bin);
      });
    });

    const averages = [];
    Object.keys(grouped).forEach(order => {
      const g = grouped[order];
      averages.push({
        frequency: this._median(g.frequencies),
        amplitude: this._average(g.amplitudes),
        order: parseInt(order),
        bin: Math.round(this._average(g.bins)),
        stability: 1 - (this._stdDev(g.frequencies) / g.frequencies[0])
      });
    });
    return averages.sort((a, b) => a.order - b.order);
  }

  _calculateRMS() {
    let sum = 0;
    for (let i = 0; i < this.timeDataArray.length; i++) {
      sum += this.timeDataArray[i] * this.timeDataArray[i];
    }
    return Math.sqrt(sum / this.timeDataArray.length);
  }

  _calculatePitch() {
    // Requires external PitchDetection library implementation
    if (typeof PitchDetection !== 'undefined') {
      return PitchDetection.yin(this.timeDataArray, this.audioContext.sampleRate);
    }
    return null;
  }

  _calculateZCR() {
    let zcr = 0;
    for (let i = 1; i < this.timeDataArray.length; i++) {
      if ((this.timeDataArray[i] >= 0 && this.timeDataArray[i-1] < 0) ||
          (this.timeDataArray[i] < 0 && this.timeDataArray[i-1] >= 0)) {
        zcr++;
      }
    }
    return zcr / this.timeDataArray.length;
  }

  _average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  _median(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  _stdDev(arr) {
    const avg = this._average(arr);
    const squareDiffs = arr.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this._average(squareDiffs));
  }

  getLastData() {
    return this.lastData;
  }

  getState() {
    return {
      isRunning: this.isRunning,
      lastData: this.lastData,
      averageHarmonics: this.averageHarmonics
    };
  }

  setHarmonicsConfig(config) {
    this.harmonicsConfig = { ...this.harmonicsConfig, ...config };
  }

  resetHarmonicsHistory() {
    this.harmonicsHistory = [];
    this.averageHarmonics = [];
    this.detectedHarmonics = [];
  }
}

window.Analyzer = Analyzer;
