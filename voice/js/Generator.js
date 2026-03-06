class Generator extends EventEmitter {
  constructor(audioContext) {
    super();
    this.audioContext = audioContext;
    this.oscillators = [];
    this.gainNodes = [];
    this.masterGain = null;
    this.isActive = false;
    this.options = {
      name: 'Default',
      harmonics: [{ type: 'sine', frequency: 440, amplitude: 0.5 }]
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
    this.gainNodes.forEach(gain => {
      try { gain.disconnect(); } catch(e) {}
    });
    this.gainNodes = [];
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    this.isActive = false;
    this.emit('stateChange', false);
  }

  _createNodes() {
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1;

    this.options.harmonics.forEach((h, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = h.type;
      osc.frequency.setValueAtTime(h.frequency, this.audioContext.currentTime);
      gain.gain.setValueAtTime(h.amplitude, this.audioContext.currentTime);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();

      this.oscillators.push(osc);
      this.gainNodes.push(gain);
    });
  }

  // 🔥 Обновление на лету без пересоздания
  updateOptions(options, realtime = true) {
    const oldCount = this.options.harmonics.length;
    const newCount = options.harmonics?.length || 0;

    this.options = { ...this.options, ...options };

    if (this.isActive && realtime) {
      // Обновляем существующие узлы
      const count = Math.min(oldCount, newCount);
      for (let i = 0; i < count; i++) {
        const h = options.harmonics[i];
        this.oscillators[i].type = h.type;
        this.oscillators[i].frequency.setTargetAtTime(
          h.frequency,
          this.audioContext.currentTime,
          0.05
        );
        this.gainNodes[i].gain.setTargetAtTime(
          h.amplitude,
          this.audioContext.currentTime,
          0.05
        );
      }

      // Добавляем новые
      for (let i = oldCount; i < newCount; i++) {
        const h = options.harmonics[i];
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = h.type;
        osc.frequency.value = h.frequency;
        gain.gain.value = h.amplitude;
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        this.oscillators.push(osc);
        this.gainNodes.push(gain);
      }

      // Удаляем лишние
      for (let i = newCount; i < oldCount; i++) {
        try {
          this.oscillators[i].stop();
          this.oscillators[i].disconnect();
          this.gainNodes[i].disconnect();
        } catch(e) {}
      }
      this.oscillators = this.oscillators.slice(0, newCount);
      this.gainNodes = this.gainNodes.slice(0, newCount);
    }

    this.emit('optionsUpdated', this.options);
  }

  removeHarmonic(index) {
    if (index <= 0 || index >= this.options.harmonics.length) return;
    this.options.harmonics.splice(index, 1);
    this.updateOptions({ harmonics: this.options.harmonics });
  }

  getOutput() {
    return this.masterGain;
  }

  getState() {
    return { isActive: this.isActive, options: this.options };
  }

  getCurrentConfig() {
    return {
      name: this.options.name,
      timestamp: Date.now(),
      type: 'generator',
      options: JSON.parse(JSON.stringify(this.options))
    };
  }

  setName(name) {
    this.options.name = name;
    this.emit('nameChanged', name);
  }
}

window.Generator = Generator;
