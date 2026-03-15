class Generator extends EventEmitter {
  constructor(audioContext) {
    super();
    this.audioContext = audioContext;
    this.oscillators = [];
    this.gainNode = null;
    this.destinationNode = null;
    this.isActive = false;
    this.isConnectedToDestination = false;
    this.options = {
      name: '',
      harmonics: [
        { type: 'sine', frequency: 220, amplitude: 0.5 }
      ]
    };
  }

  start() {
    if (this.isActive) return;
    this._createNodes();

    if (this.isConnectedToDestination && this.destinationNode) {
      this.gainNode.connect(this.destinationNode);
    }

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

  connectToDestination() {
    if (!this.isActive || !this.gainNode) {
      this.isConnectedToDestination = true;
      return false;
    }

    this.destinationNode = this.audioContext.destination;
    this.gainNode.connect(this.destinationNode);
    this.isConnectedToDestination = true;
    this.emit('outputConnected');
    return true;
  }

  disconnectFromDestination() {
    if (!this.isConnectedToDestination || !this.gainNode) {
      return false;
    }

    try {
      this.gainNode.disconnect(this.destinationNode);
    } catch(e) {}

    this.destinationNode = null;
    this.isConnectedToDestination = false;
    this.emit('outputDisconnected');
    return true;
  }

  toggleDestination() {
    if (this.isConnectedToDestination) {
      this.disconnectFromDestination();
      return false;
    } else {
      this.connectToDestination();
      return true;
    }
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
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
    return {
      isActive: this.isActive,
      isConnectedToDestination: this.isConnectedToDestination,
      options: this.options
    };
  }

  getCurrentConfig() {
    return {
      name: this.options.name || '',
      timestamp: Date.now(),
      options: JSON.parse(JSON.stringify(this.options))
    };
  }

  setName(name) {
    this.options.name = name;
    this.emit('nameChanged', name);
  }

  removeHarmonic(index) {
    if (index < 0 || index >= this.options.harmonics.length) return;
    if (this.options.harmonics.length <= 1) return;
    this.options.harmonics.splice(index, 1);
    this.updateOptions({ harmonics: this.options.harmonics });
  }

  addHarmonic(harmonic) {
    this.options.harmonics.push(harmonic);
    this.updateOptions({ harmonics: this.options.harmonics });
  }

  clearHarmonics(newHarmonic) {
    this.options.harmonics = newHarmonic ? [newHarmonic] : [
      { type: 'sine', frequency: 220, amplitude: 0.5 }
    ];
    this.updateOptions({ harmonics: this.options.harmonics });
  }
}

window.Generator = Generator;
