class Generator extends EventEmitter {
  constructor(audioContext) {
    super();
    this.audioContext = audioContext;
    this.oscillators = [];
    this.gainNode = null;
    this.isActive = false;
    this.options = {
      harmonics: [{ type: 'sine', frequency: 220, amplitude: 0.5 }]
    };
  }

  start() {
    if (this.isActive) return;
    this._createNodes();
    this.isActive = true;
    this.emit('stateChange', true);
  }

  stop() {
    if (!this.isActive) return;
    this.oscillators.forEach(osc => {
      try { osc.stop(); osc.disconnect(); } catch(e) {}
    });
    this.oscillators = [];
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isActive = false;
    this.emit('stateChange', false);
  }

  updateOptions(options) {
    this.options = { ...this.options, ...options };
    if (this.isActive) {
      this.stop();
      this.start();
    }
    this.emit('optionsUpdated', this.options);
  }

  _createNodes() {
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;

    this.options.harmonics.forEach(harmonic => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = harmonic.type;
      oscillator.frequency.value = harmonic.frequency;
      const harmonicGain = this.audioContext.createGain();
      harmonicGain.gain.value = harmonic.amplitude;
      oscillator.connect(harmonicGain);
      harmonicGain.connect(this.gainNode);
      oscillator.start();
      this.oscillators.push(oscillator);
    });
  }

  getOutput() {
    return this.gainNode;
  }

  getState() {
    return { isActive: this.isActive, options: this.options };
  }

  getCurrentConfig() {
    return {
      name: '',
      timestamp: Date.now(),
      options: JSON.parse(JSON.stringify(this.options))
    };
  }
}

window.Generator = Generator;
