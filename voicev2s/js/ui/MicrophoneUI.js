class MicrophoneUI {
  constructor(uiManager, microphone, analyzer) {
    this.ui = uiManager;
    this.microphone = microphone;
    this.analyzer = analyzer;
    this.elements = {};
  }

  init() {
    this.elements = {
      toggle: this.ui.get('toggle-microphone'),
      recorder: this.ui.get('toggle-recorder'),
      captureVoice: this.ui.get('capture-voice'),
      lowpass: this.ui.get('mic-lowpass'),
      lowpassValue: this.ui.get('mic-lowpass-value'),
      highpass: this.ui.get('mic-highpass'),
      highpassValue: this.ui.get('mic-highpass-value'),
      noiseGate: this.ui.get('mic-noise-gate'),
      noiseGateValue: this.ui.get('mic-noise-gate-value'),
      compressorThreshold: this.ui.get('mic-compressor-threshold'),
      compressorThresholdValue: this.ui.get('mic-compressor-threshold-value')
    };

    this._setupListeners();
    return this;
  }

  _setupListeners() {
    this.elements.toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleMicrophone();
    });

    this.elements.recorder?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleRecorder();
    });

    this.elements.captureVoice?.addEventListener('click', () => this._captureVoice());

    this.elements.lowpass?.addEventListener('input', (e) => {
      this.ui.setText('mic-lowpass-value', e.target.value);
      this.microphone.setFilters({ lowpass: parseInt(e.target.value) });
    });

    this.elements.highpass?.addEventListener('input', (e) => {
      this.ui.setText('mic-highpass-value', e.target.value);
      this.microphone.setFilters({ highpass: parseInt(e.target.value) });
    });

    this.elements.noiseGate?.addEventListener('input', (e) => {
      this.ui.setText('mic-noise-gate-value', e.target.value);
      this.microphone.setFilters({ noiseGate: parseInt(e.target.value) });
    });

    this.elements.compressorThreshold?.addEventListener('input', (e) => {
      this.ui.setText('mic-compressor-threshold-value', e.target.value);
      this.microphone.setFilters({
        compressor: { ...CONFIG.MIC_FILTERS_DEFAULT.compressor, threshold: parseInt(e.target.value) }
      });
    });

    this.microphone.on('stateChange', (isActive) => this._syncToggleState(isActive));
  }

  async _toggleMicrophone() {
    const btn = this.elements.toggle;
    const state = btn.dataset.state;

    if (state === 'off') {
      try {
        await this.microphone.start();
        const micOutput = this.microphone.getOutput();
        if (micOutput) {
          micOutput.connect(window.app.components.analyzer.analyser);
          micOutput.connect(window.app.components.player.getInput());
          micOutput.connect(window.app.components.recorder.getInput());
          micOutput.connect(window.app.components.audioCatcher.getInput());
        }
        window.app.components.analyzer.start();
        window.app.components.audioCatcher.startMonitoring();
        btn.dataset.state = 'on';
        this.ui.setText('toggle-microphone .status', 'ON');
        btn.classList.add('active');
      } catch (err) {
        console.error('Microphone start error:', err);
        alert('Ошибка микрофона: ' + err.message);
      }
    } else {
      this.microphone.stop();
      window.app.components.analyzer.stop();
      window.app.components.audioCatcher.stopMonitoring();
      btn.dataset.state = 'off';
      this.ui.setText('toggle-microphone .status', 'OFF');
      btn.classList.remove('active');
    }
  }

  async _toggleRecorder() {
    const btn = this.elements.recorder;
    const state = btn.dataset.state;

    if (state === 'off') {
      window.app.components.recorder.start();
      btn.dataset.state = 'on';
      this.ui.setText('toggle-recorder .status', 'ON');
      btn.classList.add('recording');
    } else {
      await window.app.components.recorder.stop();
      btn.dataset.state = 'off';
      this.ui.setText('toggle-recorder .status', 'OFF');
      btn.classList.remove('recording');
    }
  }

  async _captureVoice() {
    if (!this.analyzer) {
      console.warn('Analyzer not available');
      return;
    }

    const config = await this.analyzer.captureVoice();
    if (config && config.harmonics.length > 0) {
      window.app.presets.add(config.name, config, 'voice');
      window.app.uiModules.presets.render();
      console.log('🎤 Voice captured:', config.name);
      alert(`Голос захвачен: ${config.harmonics.length} гармоник`);
    } else {
      alert('Не удалось захватить голос (слишком тихо или шумно)');
    }
  }

  _syncToggleState(isActive) {
    if (this.elements.toggle) {
      this.elements.toggle.dataset.state = isActive ? 'on' : 'off';
      this.ui.setText('toggle-microphone .status', isActive ? 'ON' : 'OFF');
    }
  }

  setFilterValues(filters) {
    if (filters.lowpass && this.elements.lowpass) {
      this.elements.lowpass.value = filters.lowpass;
      this.ui.setText('mic-lowpass-value', filters.lowpass);
    }
    if (filters.highpass && this.elements.highpass) {
      this.elements.highpass.value = filters.highpass;
      this.ui.setText('mic-highpass-value', filters.highpass);
    }
    if (filters.noiseGate && this.elements.noiseGate) {
      this.elements.noiseGate.value = filters.noiseGate;
      this.ui.setText('mic-noise-gate-value', filters.noiseGate);
    }
    if (filters.compressor?.threshold && this.elements.compressorThreshold) {
      this.elements.compressorThreshold.value = filters.compressor.threshold;
      this.ui.setText('mic-compressor-threshold-value', filters.compressor.threshold);
    }
  }
}

window.MicrophoneUI = MicrophoneUI;
