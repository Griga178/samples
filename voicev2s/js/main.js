class App {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
    this.isInitializing = false;
    this.components = {};
    this.ui = {};
    this.selectedStorageId = null;

    this.presets = null;
  }

  async init() {
    if (this.initialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      window.audioContext = this.audioContext;

      this.components.generator = new Generator(this.audioContext);
      this.components.microphone = new Microphone(this.audioContext);
      this.components.analyzer = new Analyzer(this.audioContext);
      this.components.player = new Player(this.audioContext);
      this.components.recorder = new Recorder(this.audioContext);
      this.components.storage = new Storage();
      this.components.audioCatcher = new AudioCatcher(
        this.audioContext,
        this.components.microphone,
        this.components.storage
      );

      await this.components.storage.init();
      this.components.player.enable();

      this.presets = new GeneratorPresets();
      this._renderPresetsList();

      this._setupUI();
      this._setupEventListeners();
      this._renderStorageList();

      this.initialized = true;
      this.isInitializing = false;
      this._hideInitMessage();
      console.log('✅ Audio Training System initialized');
    } catch (error) {
      this.isInitializing = false;
      console.error('❌ Initialization error:', error);
      this._showError('Ошибка инициализации: ' + error.message);
    }
  }

  _setupUI() {
    this.ui = {
      // Generator
      genFrequency: document.getElementById('gen-frequency'),
      genWaveform: document.getElementById('gen-waveform'),
      genAmplitude: document.getElementById('gen-amplitude'),
      genAmplitudeValue: document.getElementById('gen-amplitude-value'),
      addHarmonic: document.getElementById('add-harmonic'),
      harmonicsList: document.getElementById('harmonics-list'),
      applyGenerator: document.getElementById('apply-generator'),
      toggleGenerator: document.getElementById('toggle-generator'),

      // Generator presets
      presetName: document.getElementById('preset-name'),
      savePreset: document.getElementById('save-preset'),
      presetsList: document.getElementById('presets-list'),

      // Microphone & Recorder
      toggleMicrophone: document.getElementById('toggle-microphone'),
      toggleRecorder: document.getElementById('toggle-recorder'),
      initMessage: document.getElementById('init-message'),

      // Analyzer
      rmsValue: document.getElementById('rms-value'),
      pitchValue: document.getElementById('pitch-value'),
      centsDiff: document.getElementById('cents-diff'),
      zcrValue: document.getElementById('zcr-value'),

      // Mic Filters
      micLowpass: document.getElementById('mic-lowpass'),
      micLowpassValue: document.getElementById('mic-lowpass-value'),
      micHighpass: document.getElementById('mic-highpass'),
      micHighpassValue: document.getElementById('mic-highpass-value'),
      micNoiseGate: document.getElementById('mic-noise-gate'),
      micNoiseGateValue: document.getElementById('mic-noise-gate-value'),
      micCompressorThreshold: document.getElementById('mic-compressor-threshold'),
      micCompressorThresholdValue: document.getElementById('mic-compressor-threshold-value'),

      // Storage & AudioCatcher
      storageList: document.getElementById('storage-list'),
      enableCatcher: document.getElementById('enable-catcher'),
      addSelectedToCatcher: document.getElementById('add-selected-to-catcher'),
      catcherTemplates: document.getElementById('catcher-templates')
    };
  }

  _setupEventListeners() {
    const initHandler = async (e) => {
      if (this.initialized || e.target.closest('a')) return;
      await this.init();
      document.removeEventListener('click', initHandler);
      document.removeEventListener('keydown', initHandler);
    };
    document.addEventListener('click', initHandler);
    document.addEventListener('keydown', initHandler);

    // Generator controls
    this.ui.genAmplitude.addEventListener('input', (e) => {
      this.ui.genAmplitudeValue.textContent = e.target.value;
    });
    this.ui.addHarmonic.addEventListener('click', () => this._addHarmonicUI());
    this.ui.applyGenerator.addEventListener('click', () => this._applyGeneratorSettings());
    this.ui.toggleGenerator?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleGenerator();
    });

    // Presets
    this.ui.savePreset?.addEventListener('click', () => this._savePreset());
    this.ui.importPreset?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      await this.presets.import(file);
      this._renderPresetsList();
      console.log('✅ Preset imported');
    } catch (err) {
      console.error('❌ Import failed:', err);
      alert('Ошибка импорта: ' + err.message);
    }
    e.target.value = ''; // Сброс для повторного импорта
  }
});

    // Делегирование событий для динамических кнопок пресетов
    this.ui.presetsList?.addEventListener('click', (e) => {
    const item = e.target.closest('.preset-item');
    if (!item) return;
    const id = item.dataset.id;

    if (e.target.classList.contains('btn-apply')) {
      this._applyPreset(id);
    } else if (e.target.classList.contains('btn-delete')) {
      this._deletePreset(id);
    } else if (e.target.classList.contains('btn-export')) {
      this._exportPreset(id);
    } else if (e.target.classList.contains('btn-rename')) {
      this._promptRenamePreset(id);
    }
  });

    // Microphone & Recorder
    this.ui.toggleMicrophone.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleMicrophone();
    });
    this.ui.toggleRecorder.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleRecorder();
    });

    // Mic filters
    this.ui.micLowpass.addEventListener('input', (e) => {
      this.ui.micLowpassValue.textContent = e.target.value;
      this.components.microphone.setFilters({ lowpass: parseInt(e.target.value) });
    });
    this.ui.micHighpass.addEventListener('input', (e) => {
      this.ui.micHighpassValue.textContent = e.target.value;
      this.components.microphone.setFilters({ highpass: parseInt(e.target.value) });
    });
    this.ui.micNoiseGate.addEventListener('input', (e) => {
      this.ui.micNoiseGateValue.textContent = e.target.value;
      this.components.microphone.setFilters({ noiseGate: parseInt(e.target.value) });
    });
    this.ui.micCompressorThreshold.addEventListener('input', (e) => {
      this.ui.micCompressorThresholdValue.textContent = e.target.value;
      this.components.microphone.setFilters({
        compressor: { ...CONFIG.MIC_FILTERS_DEFAULT.compressor, threshold: parseInt(e.target.value) }
      });
    });

    // AudioCatcher
    this.ui.enableCatcher.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleCatcher();
    });
    this.ui.addSelectedToCatcher.addEventListener('click', (e) => {
      e.stopPropagation();
      this._addSelectedToCatcher();
    });

    // Component events
    this.components.analyzer.on('data', (data) => this._updateAnalyzerUI(data));
    this.components.recorder.on('recordingStopped', async (data) => {
      if (!data || !data.audioData) {
        console.warn('⚠️ No audio data received from recorder');
        return;
      }
      try {
        await this.components.storage.addRecording(data.audioData);
        this._renderStorageList();
      } catch (error) {
        console.error('❌ Failed to save recording:', error);
      }
    });
    this.components.audioCatcher.on('match', (data) => this._highlightCatcherItem(data.templateId, data.quality));
    this.components.audioCatcher.on('matchClear', (data) => this._clearCatcherItem(data.templateId));
  }
  // Новые методы для работы с пресетами:
  applyPreset(id) {
  const preset = this.presets.get(id);
  if (!preset) {
    console.warn('⚠️ Preset not found:', id);
    return;
  }

  // Применяем настройки к генератору
  this.components.generator.updateOptions(preset.options);

  // 🔥 Обновляем UI генератора
  this._updateGeneratorUI(preset.options);

  console.log('✅ Preset applied:', preset.name);
}

_updateGeneratorUI(options) {
  if (!options || !options.harmonics) return;

  // Основная гармоника
  const main = options.harmonics[0];
  if (main) {
    if (this.ui.genFrequency) this.ui.genFrequency.value = main.frequency;
    if (this.ui.genWaveform) this.ui.genWaveform.value = main.type;
    if (this.ui.genAmplitude) this.ui.genAmplitude.value = main.amplitude;
    if (this.ui.genAmplitudeValue) this.ui.genAmplitudeValue.textContent = main.amplitude;
  }

  // Дополнительные гармоники
  if (this.ui.harmonicsList) {
    this.ui.harmonicsList.innerHTML = '';
    for (let i = 1; i < options.harmonics.length; i++) {
      const h = options.harmonics[i];
      const div = document.createElement('div');
      div.className = 'generated-harmonic-item';
      div.innerHTML = `
        <select class="harmonic-type">
          <option value="sine" ${h.type === 'sine' ? 'selected' : ''}>Sine</option>
          <option value="square" ${h.type === 'square' ? 'selected' : ''}>Square</option>
          <option value="sawtooth" ${h.type === 'sawtooth' ? 'selected' : ''}>Sawtooth</option>
          <option value="triangle" ${h.type === 'triangle' ? 'selected' : ''}>Triangle</option>
        </select>
        <input type="number" class="harmonic-freq" placeholder="Freq" value="${h.frequency}">
        <input type="number" class="harmonic-amp" placeholder="Amp" value="${h.amplitude}" step="0.1" max="1">
        <button class="btn-delete remove-harmonic">✕</button>
      `;
      div.querySelector('.remove-harmonic').addEventListener('click', () => div.remove());
      this.ui.harmonicsList.appendChild(div);
    }
  }

  console.log('🎨 Generator UI updated');
}

_promptRenamePreset(id) {
  const preset = this.presets.get(id);
  if (!preset) return;

  const newName = prompt('Новое название пресета:', preset.name);
  if (newName && newName.trim()) {
    this.presets.updateName(id, newName.trim());
    this._renderPresetsList();
  }
}

_exportPreset(id) {
  if (this.presets.export(id)) {
    console.log('✅ Preset exported');
  }
}

_deletePreset(id) {
  if (confirm('Удалить этот пресет?')) {
    if (this.presets.remove(id)) {
      this._renderPresetsList();
    }
  }
}

_renderPresetsList() {
  if (!this.ui.presetsList) return;

  const presets = this.presets.getAll();
  this.ui.presetsList.innerHTML = '';

  presets.forEach(preset => {
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.dataset.id = preset.id;

    const time = new Date(preset.timestamp).toLocaleString();
    div.innerHTML = `
      <span class="name">${preset.name}</span>
      <span class="time">${time}</span>
      <button class="btn-apply" title="Применить">▶</button>
      <button class="btn-rename" title="Переименовать">✎</button>
      <button class="btn-export" title="Скачать">⬇</button>
      <button class="btn-delete" title="Удалить">✕</button>
    `;

    this.ui.presetsList.appendChild(div);
  });
}
  _savePreset() {
    const name = this.ui.presetName?.value?.trim();
    const config = this.components.generator.getCurrentConfig();
    config.name = name || `Preset ${this.presets.getAll().length + 1}`;

    this.presets.add(config.name, config.options);
    this._renderPresetsList();

    if (this.ui.presetName) this.ui.presetName.value = '';
  }

  _redrawGeneratorUI(options) {
  if (!options || !options.harmonics || options.harmonics.length === 0) {
    console.warn('⚠️ Invalid preset options');
    return;
  }

  // === Основная гармоника (первая в массиве) ===
  const main = options.harmonics[0];

  if (this.ui.genFrequency) {
    this.ui.genFrequency.value = main.frequency || 440;
  }

  if (this.ui.genWaveform) {
    this.ui.genWaveform.value = main.type || 'sine';
  }

  if (this.ui.genAmplitude) {
    this.ui.genAmplitude.value = main.amplitude || 0.5;
  }

  if (this.ui.genAmplitudeValue) {
    this.ui.genAmplitudeValue.textContent = main.amplitude || 0.5;
  }

  // === Дополнительные гармоники ===
  if (this.ui.harmonicsList) {
    this.ui.harmonicsList.innerHTML = '';

    // Создаём элементы для гармоник начиная со второй (индекс 1)
    for (let i = 1; i < options.harmonics.length; i++) {
      const h = options.harmonics[i];
      this._createHarmonicItemUI(h.type, h.frequency, h.amplitude);
    }
  }

  console.log('🎨 Generator UI redrawn:', options.harmonics.length, 'harmonics');
}
_createHarmonicItemUI(type = 'sine', frequency = 440, amplitude = 0.3) {
  const div = document.createElement('div');
  div.className = 'generated-harmonic-item';
  div.innerHTML = `
    <select class="harmonic-type">
      <option value="sine" ${type === 'sine' ? 'selected' : ''}>Sine</option>
      <option value="square" ${type === 'square' ? 'selected' : ''}>Square</option>
      <option value="sawtooth" ${type === 'sawtooth' ? 'selected' : ''}>Sawtooth</option>
      <option value="triangle" ${type === 'triangle' ? 'selected' : ''}>Triangle</option>
    </select>
    <input type="number" class="harmonic-freq" placeholder="Freq" value="${frequency}">
    <input type="number" class="harmonic-amp" placeholder="Amp" value="${amplitude}" step="0.1" max="1" min="0">
    <button class="btn-delete remove-harmonic">✕</button>
  `;

  // Привязываем обработчик удаления
  div.querySelector('.remove-harmonic').addEventListener('click', () => {
    div.remove();
  });

  this.ui.harmonicsList.appendChild(div);

  return div;
}

// === Обновлённый _applyGeneratorSettings ===
// Теперь читает настройки из перерисованного UI
_applyGeneratorSettings() {
  const harmonics = [{
    type: this.ui.genWaveform.value,
    frequency: parseFloat(this.ui.genFrequency.value),
    amplitude: parseFloat(this.ui.genAmplitude.value)
  }];

  document.querySelectorAll('.generated-harmonic-item').forEach(item => {
    harmonics.push({
      type: item.querySelector('.harmonic-type').value,
      frequency: parseFloat(item.querySelector('.harmonic-freq').value),
      amplitude: parseFloat(item.querySelector('.harmonic-amp').value)
    });
  });

  this.components.generator.updateOptions({ harmonics });
  console.log('⚙️ Generator settings applied:', harmonics);
}

// === Обновлённый _addHarmonicUI ===
_addHarmonicUI() {
  this._createHarmonicItemUI('sine', 440, 0.3);
}

// === Сохранение пресета — читает актуальные настройки из UI ===
_savePreset() {
  const name = this.ui.presetName?.value?.trim();

  // Собираем текущие настройки из UI
  const harmonics = [{
    type: this.ui.genWaveform.value,
    frequency: parseFloat(this.ui.genFrequency.value),
    amplitude: parseFloat(this.ui.genAmplitude.value)
  }];

  document.querySelectorAll('.generated-harmonic-item').forEach(item => {
    harmonics.push({
      type: item.querySelector('.harmonic-type').value,
      frequency: parseFloat(item.querySelector('.harmonic-freq').value),
      amplitude: parseFloat(item.querySelector('.harmonic-amp').value)
    });
  });

  const config = {
    name: name || `Preset ${this.presets.getAll().length + 1}`,
    timestamp: Date.now(),
    options: { harmonics }
  };

  this.presets.add(config.name, config.options);
  this._renderPresetsList();

  if (this.ui.presetName) this.ui.presetName.value = '';

  console.log('💾 Preset saved:', config.name);
}

  _applyPreset(id) {
  const preset = this.presets.get(id);
  if (!preset) {
    console.warn('⚠️ Preset not found:', id);
    return;
  }

  // Применяем настройки к генератору
  this.components.generator.updateOptions(preset.options);

  // 🔥 Перерисовываем UI генератора
  this._redrawGeneratorUI(preset.options);

  console.log('✅ Preset applied:', preset.name);
}

  _deletePreset(id) {
    if (this.presets.remove(id)) {
      this._renderPresetsList();
    }
  }

  _renderPresetsList() {
    if (!this.ui.presetsList) return;

    const presets = this.presets.getAll();
    this.ui.presetsList.innerHTML = '';

    presets.forEach(preset => {
      const div = document.createElement('div');
      div.className = 'preset-item';
      div.dataset.id = preset.id;

      const time = new Date(preset.timestamp).toLocaleTimeString();
      div.innerHTML = `
        <span class="name">${preset.name}</span>
        <span class="time">${time}</span>
        <button class="btn-apply">Apply</button>
        <button class="btn-delete">✕</button>
      `;

      this.ui.presetsList.appendChild(div);
    });
  }

  _toggleGenerator() {
  const btn = this.ui.toggleGenerator;
  if (!btn) return;

  const state = btn.dataset.state;
  const playerInput = this.components.player.getInput();

  if (state === 'off') {
    this.components.generator.start();

    // ← Получаем выход ПОСЛЕ запуска, когда gainNode уже создан
    const genOutput = this.components.generator.getOutput();

    if (genOutput && playerInput) {
      genOutput.connect(playerInput);
      genOutput.connect(this.components.analyzer.analyser);
    }
    btn.dataset.state = 'on';
    btn.querySelector('.status').textContent = 'ON';

  } else {
    const genOutput = this.components.generator.getOutput();
    if (genOutput) {
      try { genOutput.disconnect(this.components.player.getInput()); } catch(e) {}
      try { genOutput.disconnect(this.components.analyzer.analyser); } catch(e) {}
    }
    this.components.generator.stop();
    btn.dataset.state = 'off';
    btn.querySelector('.status').textContent = 'OFF';
  }
}

  async _toggleMicrophone() {
    const btn = this.ui.toggleMicrophone;
    const state = btn.dataset.state;

    if (state === 'off') {
      await this.components.microphone.start();
      const micOutput = this.components.microphone.getOutput();
      if (micOutput) {
        micOutput.connect(this.components.analyzer.analyser);
        micOutput.connect(this.components.player.getInput());
        micOutput.connect(this.components.recorder.getInput());
        micOutput.connect(this.components.audioCatcher.getInput());
      }
      this.components.analyzer.start();
      this.components.audioCatcher.startMonitoring();
      btn.dataset.state = 'on';
      btn.querySelector('.status').textContent = 'ON';
    } else {
      this.components.microphone.stop();
      this.components.analyzer.stop();
      this.components.audioCatcher.stopMonitoring();
      btn.dataset.state = 'off';
      btn.querySelector('.status').textContent = 'OFF';
    }
  }

  async _toggleRecorder() {
    const btn = this.ui.toggleRecorder;
    const state = btn.dataset.state;
    if (state === 'off') {
      this.components.recorder.start();
      btn.dataset.state = 'on';
      btn.querySelector('.status').textContent = 'ON';
    } else {
      await this.components.recorder.stop();
      btn.dataset.state = 'off';
      btn.querySelector('.status').textContent = 'OFF';
    }
  }

  _updateAnalyzerUI(data) {
    updateMetrics(data);
    drawSpectrum(data.spectrum);
    drawHarmonics(data.averageHarmonics);
    updateHarmonicsList(data.harmonics, 'current-harmonics');
    updateHarmonicsList(data.averageHarmonics, 'average-harmonics');
  }

  async _renderStorageList() {
    document.querySelectorAll('#storage-block audio[src^="blob:"]').forEach(audio => {
      URL.revokeObjectURL(audio.src);
    });
    const sounds = await this.components.storage.getAll();
    this.ui.storageList.innerHTML = '';

    for (const sound of sounds) {
      const div = document.createElement('div');
      div.className = 'storage-item';
      div.dataset.id = sound.id;

      const audio = document.createElement('audio');
      audio.controls = true;

      if (sound.type === 'static') {
        audio.src = sound.src;
      } else {
        try {
          const audioBuffer = await this.components.storage.getAudioBuffer(sound.id);
          if (audioBuffer) {
            const wavBlob = WAVExporter.export(audioBuffer);
            audio.src = URL.createObjectURL(wavBlob);
            audio.onremove = () => URL.revokeObjectURL(audio.src);
          } else {
            audio.disabled = true;
          }
        } catch (error) {
          console.error('Failed to load audio:', error);
          audio.disabled = true;
        }
      }
      audio.dataset.name = sound.name;
      div.appendChild(audio);

      if (!sound.readonly) {
        const selectBtn = document.createElement('button');
        selectBtn.className = 'btn-select';
        selectBtn.textContent = '✓';
        selectBtn.title = 'Добавить в эталоны';
        selectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._selectStorageItem(sound.id);
        });
        div.appendChild(selectBtn);

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn-download';
        downloadBtn.textContent = '⬇';
        downloadBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.components.storage.download(sound.id);
        });
        div.appendChild(downloadBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = '🗑';
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (audio.src?.startsWith('blob:')) URL.revokeObjectURL(audio.src);
          await this.components.storage.delete(sound.id);
          this._renderStorageList();
          this._renderCatcherTemplates();
        });
        div.appendChild(deleteBtn);
      }
      this.ui.storageList.appendChild(div);
    }
  }

  _selectStorageItem(id) {
    document.querySelectorAll('.storage-item').forEach(item => {
      item.style.borderColor = item.dataset.id === id ? 'var(--primary-color)' : 'transparent';
    });
    this.selectedStorageId = id;
  }

  async _addSelectedToCatcher() {
    if (!this.selectedStorageId) {
      alert('Please select a sound first');
      return;
    }
    const success = await this.components.audioCatcher.addTemplate(this.selectedStorageId);
    if (success) this._renderCatcherTemplates();
  }

  _toggleCatcher() {
    const btn = this.ui.enableCatcher;
    const state = this.components.audioCatcher.isMonitoring;
    if (!state) {
      this.components.audioCatcher.startMonitoring();
      btn.textContent = 'Отключить Распознавание';
      btn.classList.add('btn-secondary');
    } else {
      this.components.audioCatcher.stopMonitoring();
      btn.textContent = 'Включить Распознавание';
      btn.classList.remove('btn-secondary');
    }
  }

  async _renderCatcherTemplates() {
    const templates = this.components.audioCatcher.getTemplates();
    this.ui.catcherTemplates.innerHTML = '';
    templates.forEach(template => {
      const div = document.createElement('div');
      div.className = 'catcher-item';
      div.dataset.id = template.id;
      div.innerHTML = `<span>${template.name}</span><button class="btn-delete">✕</button>`;
      div.querySelector('.btn-delete').addEventListener('click', () => {
        this.components.audioCatcher.removeTemplate(template.id);
        this._renderCatcherTemplates();
      });
      this.ui.catcherTemplates.appendChild(div);
    });
  }

  _highlightCatcherItem(templateId, quality) {
    const item = document.querySelector(`.catcher-item[data-id="${templateId}"]`);
    if (item) {
      item.classList.remove('active-high', 'active-medium', 'active-low');
      item.classList.add(`active-${quality}`);
    }
  }

  _clearCatcherItem(templateId) {
    const item = document.querySelector(`.catcher-item[data-id="${templateId}"]`);
    if (item) {
      item.classList.remove('active-high', 'active-medium', 'active-low');
    }
  }

  _hideInitMessage() {
    this.ui.initMessage?.classList.add('hidden');
  }

  _showError(message) {
    if (this.ui.initMessage) {
      this.ui.initMessage.textContent = message;
      this.ui.initMessage.style.background = 'var(--danger-color)';
    }
  }
}

// ============================================================================
// Глобальные функции UI
// ============================================================================

function updateMetrics(data) {
  document.getElementById('rms-value').textContent = data.rms.toFixed(3);
  document.getElementById('rms-bar').style.width = (data.rms * 100) + '%';
  if (data.pitch) {
    document.getElementById('pitch-value').textContent = Math.round(data.pitch) + ' Hz';
    document.getElementById('note-name').textContent = freqToNote(data.pitch);
  } else {
    document.getElementById('pitch-value').textContent = '-- Hz';
    document.getElementById('note-name').textContent = '--';
  }
  document.getElementById('zcr-value').textContent = data.zcr.toFixed(3);
}

function drawSpectrum(spectrum) {
  const width = spectrumCanvas.width;
  const height = spectrumCanvas.height;
  spectrumCtx.clearRect(0, 0, width, height);
  spectrumCtx.fillStyle = '#0f3460';
  spectrumCtx.fillRect(0, 0, width, height);
  const barWidth = width / spectrum.length;
  let x = 0;
  for (let i = 0; i < spectrum.length; i++) {
    const barHeight = (spectrum[i] / 255) * height;
    const gradient = spectrumCtx.createLinearGradient(0, height, 0, height - barHeight);
    gradient.addColorStop(0, '#00d9ff');
    gradient.addColorStop(1, '#00ff88');
    spectrumCtx.fillStyle = gradient;
    spectrumCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
    x += barWidth;
  }
}

function drawHarmonics(harmonics) {
  const width = harmonicsCanvas.width;
  const height = harmonicsCanvas.height;
  harmonicsCtx.clearRect(0, 0, width, height);
  harmonicsCtx.fillStyle = '#0f3460';
  harmonicsCtx.fillRect(0, 0, width, height);
  if (harmonics.length === 0) return;
  const maxFreq = 4000;
  const lineHeight = height / harmonics.length;
  harmonics.forEach((h, index) => {
    const x = (h.frequency / maxFreq) * width;
    const y = index * lineHeight + lineHeight / 2;
    harmonicsCtx.strokeStyle = `rgba(0, 217, 255, ${h.amplitude})`;
    harmonicsCtx.lineWidth = 2 + (h.amplitude * 3);
    harmonicsCtx.beginPath();
    harmonicsCtx.moveTo(x, 0);
    harmonicsCtx.lineTo(x, height);
    harmonicsCtx.stroke();
    harmonicsCtx.fillStyle = '#ff6b6b';
    harmonicsCtx.beginPath();
    harmonicsCtx.arc(x, y, 5, 0, Math.PI * 2);
    harmonicsCtx.fill();
    harmonicsCtx.fillStyle = '#eee';
    harmonicsCtx.font = '12px Arial';
    harmonicsCtx.fillText(`H${h.order}: ${Math.round(h.frequency)}Hz`, x + 8, y);
  });
}

function updateHarmonicsList(harmonics, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';
  if (harmonics.length === 0) {
    container.innerHTML = '<span class="no-data">Нет данных</span>';
    return;
  }
  harmonics.forEach(h => {
    const item = document.createElement('div');
    item.className = 'harmonic-item detected';
    item.innerHTML = `
      <span class="order">H${h.order}</span>
      <span class="freq">${Math.round(h.frequency)} Hz</span>
      <span class="amp">${(h.amplitude * 100).toFixed(0)}%</span>
      ${h.stability ? `<span class="stab">${(h.stability * 100).toFixed(0)}%</span>` : ''}
    `;
    container.appendChild(item);
  });
}

function freqToNote(freq) {
  if (!freq) return '--';
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const h = Math.round(12 * Math.log2(freq / C0));
  const octave = Math.floor(h / 12);
  const note = notes[h % 12];
  return `${note}${octave}`;
}

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================================

const app = new App();
const spectrumCanvas = document.getElementById('spectrum-canvas');
const harmonicsCanvas = document.getElementById('harmonics-canvas');
const spectrumCtx = spectrumCanvas.getContext('2d');
const harmonicsCtx = harmonicsCanvas.getContext('2d');

document.addEventListener('DOMContentLoaded', () => {
  if (!window.AudioContext && !window.webkitAudioContext) {
    const msg = document.getElementById('init-message');
    if (msg) {
      msg.textContent = '❌ Ваш браузер не поддерживает Web Audio API';
      msg.style.background = '#ef4444';
      msg.classList.remove('hidden');
    }
    return;
  }
  app.init();
});

window.app = app;
