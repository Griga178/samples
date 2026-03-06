class Microphone extends EventEmitter {
  constructor(audioContext) {
    super();
    this.audioContext = audioContext;
    this.stream = null;
    this.source = null;
    this.filters = {};
    this.isActive = false;
    this.config = { ...CONFIG.MIC_FILTERS_DEFAULT };
  }

  async start() {
    if (this.isActive) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this._createFilters();
      this.isActive = true;
      this.emit('stateChange', true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      this.emit('error', error);
    }
  }

  stop() {
    if (!this.isActive) return;

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    this._disconnectFilters();
    this.isActive = false;
    this.emit('stateChange', false);
  }

  _createFilters() {
    this._disconnectFilters();

    // Highpass filter
    this.highpass = this.audioContext.createBiquadFilter();
    this.highpass.type = 'highpass';
    this.highpass.frequency.value = this.config.highpass;

    // Lowpass filter
    this.lowpass = this.audioContext.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.value = this.config.lowpass;

    // Compressor
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = this.config.compressor.threshold;
    this.compressor.ratio.value = this.config.compressor.ratio;
    this.compressor.attack.value = this.config.compressor.attack;
    this.compressor.release.value = this.config.compressor.release;

    // Connect chain
    this.source.connect(this.highpass);
    this.highpass.connect(this.lowpass);
    this.lowpass.connect(this.compressor);
  }

  _disconnectFilters() {
    if (this.highpass) { this.highpass.disconnect(); this.highpass = null; }
    if (this.lowpass) { this.lowpass.disconnect(); this.lowpass = null; }
    if (this.compressor) { this.compressor.disconnect(); this.compressor = null; }
  }

  setFilters(config) {
    this.config = { ...this.config, ...config };

    if (this.highpass) this.highpass.frequency.value = this.config.highpass;
    if (this.lowpass) this.lowpass.frequency.value = this.config.lowpass;
    if (this.compressor) {
      this.compressor.threshold.value = this.config.compressor.threshold;
      this.compressor.ratio.value = this.config.compressor.ratio;
      this.compressor.attack.value = this.config.compressor.attack;
      this.compressor.release.value = this.config.compressor.release;
    }

    this.emit('filtersUpdated', this.config);
  }

  getOutput() {
    if (this.isActive && this.compressor) {
      return this.compressor;
    }
    return this.source;
  }

  getState() {
    return {
      isActive: this.isActive,
      config: this.config
    };
  }
}

window.Microphone = Microphone;
