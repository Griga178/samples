class AudioCatcher extends EventEmitter {
  constructor(audioContext, microphone, storage) {
    super();
    this.audioContext = audioContext;
    this.microphone = microphone;
    this.storage = storage;

    this.isMonitoring = false;
    this.templates = new Map();
    this.matchTimeouts = new Map();

    // Входной узел для подключения источника
    this.inputNode = this.audioContext.createGain();

    // Анализатор для входящего сигнала
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = CONFIG.FFT_SIZE || 4096;
    this.inputNode.connect(this.analyser);

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.timeDataArray = new Float32Array(this.analyser.fftSize);

    this.monitorInterval = null;
    this.matchThresholds = {
      YIN: 10,
      MCYIN: 8,
      Autocorrelation: 0.85,
      SpectralDistance: 0.2
    };
  }

  getInput() {
    return this.inputNode;
  }

  async addTemplate(storageId) {
    try {
      const audioBuffer = await this.storage.getAudioBuffer(storageId);
      if (!audioBuffer) return false;

      const template = {
        id: storageId,
        name: this.storage.getSoundName(storageId),
        buffer: audioBuffer,
        pitch: this._extractPitch(audioBuffer),
        spectrum: this._extractSpectrum(audioBuffer)
      };

      this.templates.set(storageId, template);
      this.emit('templateAdded', template);
      return true;
    } catch (error) {
      console.error('Failed to add template:', error);
      return false;
    }
  }

  removeTemplate(storageId) {
    if (this.matchTimeouts.has(storageId)) {
      clearTimeout(this.matchTimeouts.get(storageId));
      this.matchTimeouts.delete(storageId);
    }
    const removed = this.templates.delete(storageId);
    if (removed) {
      this.emit('templateRemoved', storageId);
    }
    return removed;
  }

  getTemplates() {
    return Array.from(this.templates.values());
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    const interval = 100;
    this.monitorInterval = setInterval(() => this._checkMatches(), interval);
    this.emit('monitoringStarted');
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.emit('monitoringStopped');
  }

  _checkMatches() {
    if (this.templates.size === 0) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    this.analyser.getFloatTimeDomainData(this.timeDataArray);

    const currentPitch = this._calculatePitch();
    const currentSpectrum = Array.from(this.dataArray);

    for (const [id, template] of this.templates) {
      const match = this._compare(template, currentPitch, currentSpectrum);

      if (match.isMatch) {
        this._triggerMatch(id, match.quality);
      } else {
        this._clearMatch(id);
      }
    }
  }

  _compare(template, currentPitch, currentSpectrum) {
    if (!currentPitch || !template.pitch) {
      return { isMatch: false, quality: null };
    }

    const pitchDiff = Math.abs(currentPitch - template.pitch);
    const centsDiff = 1200 * Math.log2(currentPitch / template.pitch);

    const pitchMatch = Math.abs(centsDiff) < this.matchThresholds.YIN;
    const spectralMatch = this._spectralDistance(currentSpectrum, template.spectrum) < this.matchThresholds.SpectralDistance;

    if (pitchMatch || spectralMatch) {
      const quality = pitchMatch ? 'high' : 'medium';
      return { isMatch: true, quality, pitchDiff: centsDiff };
    }

    return { isMatch: false, quality: null };
  }

  _triggerMatch(templateId, quality) {
    if (this.matchTimeouts.has(templateId)) return;

    this.emit('match', { templateId, quality });

    const timeout = setTimeout(() => {
      this.matchTimeouts.delete(templateId);
      this.emit('matchClear', { templateId });
    }, 500);

    this.matchTimeouts.set(templateId, timeout);
  }

  _clearMatch(templateId) {
    if (this.matchTimeouts.has(templateId)) {
      clearTimeout(this.matchTimeouts.get(templateId));
      this.matchTimeouts.delete(templateId);
      this.emit('matchClear', { templateId });
    }
  }

  _extractPitch(audioBuffer) {
    const channel = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    if (typeof PitchDetection !== 'undefined') {
      return PitchDetection.yin(channel, sampleRate);
    }
    return null;
  }

  _extractSpectrum(audioBuffer) {
    const channel = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    const buffer = new Float32Array(fftSize);
    buffer.set(channel.slice(0, fftSize));

    const spectrum = new Uint8Array(analyser.frequencyBinCount);
    return Array.from(spectrum);
  }

  _calculatePitch() {
    if (typeof PitchDetection !== 'undefined') {
      return PitchDetection.yin(this.timeDataArray, this.audioContext.sampleRate);
    }
    return null;
  }

  _spectralDistance(a, b) {
    if (a.length !== b.length) return 1;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.abs(a[i] - b[i]);
    }
    return sum / (a.length * 255);
  }

  getState() {
    return {
      isMonitoring: this.isMonitoring,
      templatesCount: this.templates.size
    };
  }
}

window.AudioCatcher = AudioCatcher;
