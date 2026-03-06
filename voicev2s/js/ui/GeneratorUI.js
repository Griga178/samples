class GeneratorUI {
  constructor(uiManager, generator) {
    this.ui = uiManager;
    this.generator = generator;
    this.elements = {};
  }

  init() {
    this.elements = {
      name: this.ui.get('gen-name'),
      frequency: this.ui.get('gen-frequency'),
      waveform: this.ui.get('gen-waveform'),
      amplitude: this.ui.get('gen-amplitude'),
      amplitudeValue: this.ui.get('gen-amplitude-value'),
      harmonicsList: this.ui.get('harmonics-list'),
      addHarmonic: this.ui.get('add-harmonic'),
      apply: this.ui.get('apply-generator'),
      save: this.ui.get('save-preset'),
      reset: this.ui.get('reset-generator'),
      toggle: this.ui.get('toggle-generator')
    };

    this._setupListeners();
    return this;
  }

  _setupListeners() {
    this.elements.name?.addEventListener('input', (e) => {
      this.generator.setName(e.target.value);
    });

    this.elements.amplitude?.addEventListener('input', (e) => {
      this.ui.setText('gen-amplitude-value', e.target.value);
      this._updateRealtime();
    });

    this.elements.frequency?.addEventListener('input', () => this._updateRealtime());
    this.elements.waveform?.addEventListener('change', () => this._updateRealtime());

    this.elements.addHarmonic?.addEventListener('click', () => this._addHarmonic());
    this.elements.apply?.addEventListener('click', () => this._applySettings());
    this.elements.save?.addEventListener('click', () => this._savePreset());
    this.elements.reset?.addEventListener('click', () => this._reset());
    this.elements.toggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggle();
    });

    // Mouse wheel
    [this.elements.frequency, this.elements.amplitude].forEach(input => {
      input?.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        if (input === this.elements.frequency) {
          input.value = parseFloat(input.value) + (delta * 10);
        } else {
          input.value = Math.max(0, Math.min(1, parseFloat(input.value) + (delta * 0.05)));
        }
        this._updateRealtime();
      });
    });

    this.generator.on('optionsUpdated', (options) => this._syncUI(options));
  }

  _updateRealtime() {
    const harmonics = this._collectHarmonics();
    this.generator.updateOptions({ harmonics }, true);
  }

  _collectHarmonics() {
    const harmonics = [{
      type: this.elements.waveform.value,
      frequency: parseFloat(this.elements.frequency.value),
      amplitude: parseFloat(this.elements.amplitude.value)
    }];

    document.querySelectorAll('.generated-harmonic-item').forEach(item => {
      harmonics.push({
        type: item.querySelector('.harmonic-type').value,
        frequency: parseFloat(item.querySelector('.harmonic-freq').value),
        amplitude: parseFloat(item.querySelector('.harmonic-amp').value)
      });
    });

    return harmonics;
  }

  _addHarmonic() {
    const mainFreq = parseFloat(this.elements.frequency.value) || 440;
    const mainAmp = parseFloat(this.elements.amplitude.value) || 0.5;
    const mainType = this.elements.waveform.value || 'sine';
    const index = document.querySelectorAll('.generated-harmonic-item').length + 1;

    const div = document.createElement('div');
    div.className = 'generated-harmonic-item';
    div.innerHTML = `
      <select class="harmonic-type">
        <option value="sine" ${mainType === 'sine' ? 'selected' : ''}>Sine</option>
        <option value="square" ${mainType === 'square' ? 'selected' : ''}>Square</option>
        <option value="sawtooth" ${mainType === 'sawtooth' ? 'selected' : ''}>Sawtooth</option>
        <option value="triangle" ${mainType === 'triangle' ? 'selected' : ''}>Triangle</option>
      </select>
      <input type="number" class="harmonic-freq" value="${mainFreq * (index + 1)}">
      <input type="number" class="harmonic-amp" value="${mainAmp}" step="0.05" max="1" min="0">
      <button class="btn-delete remove-harmonic">✕</button>
    `;

    div.querySelector('.remove-harmonic').addEventListener('click', () => {
      div.remove();
      this._updateRealtime();
    });

    this.elements.harmonicsList.appendChild(div);
    this._updateRealtime();
  }

  _applySettings() {
    this._updateRealtime();
  }

  _reset() {
    this.generator.updateOptions({
      name: 'Default',
      harmonics: [{ type: 'sine', frequency: 440, amplitude: 0.5 }]
    });
    this.ui.setValue('gen-name', 'Default');
    this.ui.setValue('gen-frequency', 440);
    this.ui.setValue('gen-waveform', 'sine');
    this.ui.setValue('gen-amplitude', 0.5);
    this.ui.setText('gen-amplitude-value', '0.5');
    this.ui.clear('harmonics-list');
    this._updateRealtime();
  }

  _toggle() {
    const btn = this.elements.toggle;
    const state = btn.dataset.state;
    const playerInput = window.app.components.player?.getInput?.();

    if (state === 'off') {
      this.generator.start();
      const output = this.generator.getOutput();
      if (output && playerInput) {
        output.connect(playerInput);
        output.connect(window.app.components.analyzer.analyser);
      }
      btn.dataset.state = 'on';
      this.ui.setText('toggle-generator .status', 'ON');
    } else {
      const output = this.generator.getOutput();
      if (output) {
        try { output.disconnect(playerInput); } catch(e) {}
        try { output.disconnect(window.app.components.analyzer.analyser); } catch(e) {}
      }
      this.generator.stop();
      btn.dataset.state = 'off';
      this.ui.setText('toggle-generator .status', 'OFF');
    }
  }

  _savePreset() {
    const name = this.elements.name?.value?.trim();
    const harmonics = this._collectHarmonics();
    window.app.presets.add(name || `preset_${Date.now().toString(36)}`, { harmonics });
    window.app.uiModules.presets.render();
    if (this.elements.name) this.elements.name.value = '';
  }

  _syncUI(options) {
    if (!options?.harmonics?.length) return;
    const main = options.harmonics[0];
    this.ui.setValue('gen-frequency', main.frequency);
    this.ui.setValue('gen-waveform', main.type);
    this.ui.setValue('gen-amplitude', main.amplitude);
    this.ui.setText('gen-amplitude-value', main.amplitude);
  }

  renderHarmonics(harmonics) {
    this.ui.clear('harmonics-list');
    for (let i = 1; i < harmonics.length; i++) {
      const h = harmonics[i];
      this._createHarmonicItem(h.type, h.frequency, h.amplitude);
    }
  }

  _createHarmonicItem(type, frequency, amplitude) {
    const div = document.createElement('div');
    div.className = 'generated-harmonic-item';
    div.innerHTML = `
      <select class="harmonic-type">
        <option value="sine" ${type === 'sine' ? 'selected' : ''}>Sine</option>
        <option value="square" ${type === 'square' ? 'selected' : ''}>Square</option>
        <option value="sawtooth" ${type === 'sawtooth' ? 'selected' : ''}>Sawtooth</option>
        <option value="triangle" ${type === 'triangle' ? 'selected' : ''}>Triangle</option>
      </select>
      <input type="number" class="harmonic-freq" value="${frequency}">
      <input type="number" class="harmonic-amp" value="${amplitude}" step="0.05" max="1">
      <button class="btn-delete remove-harmonic">✕</button>
    `;
    div.querySelector('.remove-harmonic').addEventListener('click', () => {
      div.remove();
      this._updateRealtime();
    });
    this.elements.harmonicsList.appendChild(div);
  }
}

window.GeneratorUI = GeneratorUI;
