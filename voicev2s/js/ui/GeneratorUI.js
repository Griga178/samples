/**
 * GeneratorUI — связывает интерфейс с классом Generator
 * Предполагается, что в HTML есть элементы:
 *   #toggleBtn, #status, #nameDisplay,
 *   #presetName, #setNameBtn, #addHarmonicBtn, #harmonicsList
 * И карточки гармоник строятся динамически.
 */
class GeneratorUI {
  constructor(options = {}) {
    // Селекторы элементов (можно переопределить при необходимости)
    this.selectors = {
      toggleBtn: '#toggleBtn',
      status: '#status',
      nameDisplay: '#nameDisplay',
      presetName: '#presetName',
      setNameBtn: '#setNameBtn',
      addHarmonicBtn: '#addHarmonicBtn',
      harmonicsContainer: '#harmonicsList',
      ...options.selectors
    };

    // Найденные DOM-элементы
    this.elements = {};

    this.audioContext = null;
    this.generator = null;

    // Привязка методов для обработчиков
    this.toggle = this.toggle.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.setName = this.setName.bind(this);
    this.addHarmonic = this.addHarmonic.bind(this);
    this.renderHarmonics = this.renderHarmonics.bind(this);
    this.onStateChange = this.onStateChange.bind(this);
    this.onOptionsUpdated = this.onOptionsUpdated.bind(this);
    this.onNameChanged = this.onNameChanged.bind(this);
  }

  /** Инициализация: поиск элементов, создание аудиоконтекста и генератора, подписка на события */
  init() {
    this._findElements();
    this._createAudioContext();
    this._createGenerator();
    this._attachListeners();
    this._subscribeToGeneratorEvents();
    this.renderHarmonics();
  }

  _findElements() {
    for (const [key, selector] of Object.entries(this.selectors)) {
      const el = document.querySelector(selector);
      if (!el) {
        console.warn(`GeneratorUI: элемент с селектором "${selector}" не найден.`);
      }
      this.elements[key] = el;
    }
  }

  _createAudioContext() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  _createGenerator() {
    this.generator = new Generator(this.audioContext);
    const output = this.generator.getOutput();
    if (output) {
      output.connect(this.audioContext.destination);
    }
  }

  _attachListeners() {
    const { toggleBtn, setNameBtn, addHarmonicBtn } = this.elements;
    if (toggleBtn) toggleBtn.addEventListener('click', this.toggle);
    if (setNameBtn) setNameBtn.addEventListener('click', this.setName);
    if (addHarmonicBtn) addHarmonicBtn.addEventListener('click', this.addHarmonic);
  }

  // Универсальная подписка на события генератора (поддерживает on/off и addEventListener/removeEventListener)
  _on(emitter, event, callback) {
    if (typeof emitter.on === 'function') {
      emitter.on(event, callback);
    } else if (typeof emitter.addEventListener === 'function') {
      emitter.addEventListener(event, callback);
    } else {
      console.warn('GeneratorUI: не удалось подписаться на событие', event);
    }
  }

  _off(emitter, event, callback) {
    if (typeof emitter.off === 'function') {
      emitter.off(event, callback);
    } else if (typeof emitter.removeEventListener === 'function') {
      emitter.removeEventListener(event, callback);
    }
  }

  _subscribeToGeneratorEvents() {
    if (!this.generator) return;
    this._on(this.generator, 'stateChange', this.onStateChange);
    this._on(this.generator, 'optionsUpdated', this.onOptionsUpdated);
    this._on(this.generator, 'nameChanged', this.onNameChanged);
  }

  // Обработчики событий генератора
  onStateChange(active) {
    // active может быть булевым значением или объектом события (если используется EventTarget)
    const isActive = typeof active === 'boolean' ? active : active.detail;
    const { toggleBtn, status } = this.elements;
    if (status) status.innerHTML = isActive ? '🟢 Генерирует' : '⚪ Остановлен';
    if (toggleBtn) {
      // Меняем текст и иконку кнопки
      toggleBtn.innerHTML = isActive ? '⏹️ Стоп' : '▶️ Старт';
      // Можно также управлять классом для стилей, если нужно
    }
  }

  onOptionsUpdated() {
    this.renderHarmonics();
  }

  onNameChanged(name) {
    const nameValue = typeof name === 'string' ? name : name.detail;
    const { nameDisplay } = this.elements;
    if (nameDisplay) nameDisplay.textContent = `Имя: ${nameValue || '—'}`;
  }

  toggle() {
    if (!this.generator) return;
    if (this.generator.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }

  // Методы управленияа
  async start() {
    if (!this.generator) return;
    // Возобновляем контекст (требуется после жеста пользователя)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.generator.start();
    this.generator.connectToDestination();
  }

  stop() {
    if (this.generator) this.generator.stop();
  }

  setName() {
    const { presetName } = this.elements;
    if (!presetName) return;
    const newName = presetName.value.trim() || 'Безымянный';
    this.generator.setName(newName);
  }

  addHarmonic() {
    if (!this.generator) return;

    const harmonics = this.generator.options.harmonics || [];
    let baseFreq = 80;           // значение по умолчанию, если нет гармоник
    let baseType = 'sine';
    let baseAmp = 0.5;

    if (harmonics.length > 0) {
      const zero = harmonics[0];
      baseFreq = zero.frequency;
      baseType = zero.type;
      baseAmp = zero.amplitude;
    }

    const newIndex = harmonics.length; // индекс новой гармоники до добавления
    const newFreq = baseFreq * (newIndex + 1); // нулевая гармоника: индекс 0, частота baseFreq*1

    const newHarmonic = {
      type: baseType,
      frequency: newFreq,
      amplitude: baseAmp
    };

    const newHarmonics = [...harmonics, newHarmonic];
    this.generator.updateOptions({ harmonics: newHarmonics });
  }

  removeHarmonic(index) {
    if (!this.generator) return;
    this.generator.removeHarmonic(index);
  }

  updateHarmonicParam(index, key, value) {
    if (!this.generator) return;
    const harmonics = [...this.generator.options.harmonics];
    if (!harmonics[index]) return;
    harmonics[index] = { ...harmonics[index], [key]: value };
    this.generator.updateOptions({ harmonics });
  }

  // Отрисовка списка гармоник
  renderHarmonics() {
    const container = this.elements.harmonicsContainer;
    if (!container || !this.generator) return;

    const harmonics = this.generator.options.harmonics || [];
    container.innerHTML = '';

    harmonics.forEach((h, idx) => {
      const card = document.createElement('div');
      card.className = 'harmonic-item';

      // Основной контент
      const content = document.createElement('div');
      content.className = 'harmonic-item__content';

      // Верхний ряд: номер, селект типа
      const headerRow = document.createElement('div');
      headerRow.className = 'harmonic-row harmonic-row--header';
      headerRow.innerHTML = `
        <span class="harmonic-number">№${idx + 1}</span>
        <select class="input-select-type harmonic-type-select" data-index="${idx}">
          <option value="sine" ${h.type === 'sine' ? 'selected' : ''}>Sine</option>
          <option value="sawtooth" ${h.type === 'sawtooth' ? 'selected' : ''}>Saw</option>
          <option value="square" ${h.type === 'square' ? 'selected' : ''}>Square</option>
          <option value="triangle" ${h.type === 'triangle' ? 'selected' : ''}>Triangle</option>
        </select>
      `;

      // Ряд частоты: label, input number, range
      const freqRow = document.createElement('div');
      freqRow.className = 'harmonic-row';
      freqRow.innerHTML = `
        <div class="label-group">
          <label>Freq</label>
          <input type="number" class="freq-number" data-index="${idx}" value="${h.frequency}" min="60" max="1500" step="1">
        </div>
        <input type="range" class="input-range-styled freq-range" data-index="${idx}" value="${h.frequency}" min="60" max="1500" step="1">
      `;

      // Ряд амплитуды: label, input number, range
      const ampRow = document.createElement('div');
      ampRow.className = 'harmonic-row';
      ampRow.innerHTML = `
        <div class="label-group">
          <label>Amp</label>
          <input type="number" class="amp-number" data-index="${idx}" value="${h.amplitude}" min="0" max="1" step="0.01">
        </div>
        <input type="range" class="input-range-styled amp-range" data-index="${idx}" value="${h.amplitude}" min="0" max="1" step="0.01">
      `;

      content.appendChild(headerRow);
      content.appendChild(freqRow);
      content.appendChild(ampRow);

      // Кнопка удаления
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-full';
      deleteBtn.setAttribute('title', 'Удалить гармонику');
      deleteBtn.setAttribute('data-index', idx);
      deleteBtn.innerHTML = '<span>×</span>';
      if (idx === 0) {
        deleteBtn.disabled = true; // Первую гармонику удалять нельзя
      }

      card.appendChild(content);
      card.appendChild(deleteBtn);
      container.appendChild(card);

      // Получаем ссылки на элементы внутри карточки
      const typeSelect = card.querySelector('.harmonic-type-select');
      const freqNumber = card.querySelector('.freq-number');
      const freqRange = card.querySelector('.freq-range');
      const ampNumber = card.querySelector('.amp-number');
      const ampRange = card.querySelector('.amp-range');

      // ----- Синхронизация UI (только отображение) -----
      const syncFreq = (value) => {
        freqNumber.value = value;
        freqRange.value = value;
      };

      const syncAmp = (value) => {
        ampNumber.value = value;
        ampRange.value = value;
      };

      freqNumber.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          freqRange.value = val; // синхронизация с ползунком
        }
      });

      freqRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          freqNumber.value = val; // синхронизация с цифровым полем
        }
      });

      ampNumber.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          ampRange.value = val;
        }
      });

      ampRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
          ampNumber.value = val;
        }
      });

      // ----- Применение изменений (только после завершения ввода) -----
      const applyFreq = () => {
        const val = parseFloat(freqNumber.value);
        if (!isNaN(val)) {
          this.updateHarmonicParam(idx, 'frequency', val);
        }
      };

      const applyAmp = () => {
        const val = parseFloat(ampNumber.value);
        if (!isNaN(val)) {
          this.updateHarmonicParam(idx, 'amplitude', val);
        }
      };

      freqNumber.addEventListener('change', applyFreq);
      freqRange.addEventListener('change', applyFreq);
      ampNumber.addEventListener('change', applyAmp);
      ampRange.addEventListener('change', applyAmp);

      // Тип меняется сразу (нет промежуточных значений), поэтому можно оставить change
      typeSelect.addEventListener('change', (e) => {
        this.updateHarmonicParam(idx, 'type', e.target.value);
      });

      // Удаление
      // const deleteBtn = card.querySelector('.btn-delete-full');
      deleteBtn.addEventListener('click', () => {
        this.removeHarmonic(idx);
      });
    });
  }

  /** Освобождение ресурсов (отписка, остановка, закрытие контекста) */
  destroy() {
    if (this.generator) {
      this._off(this.generator, 'stateChange', this.onStateChange);
      this._off(this.generator, 'optionsUpdated', this.onOptionsUpdated);
      this._off(this.generator, 'nameChanged', this.onNameChanged);
      this.generator.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    const { toggleBtn, setNameBtn, addHarmonicBtn } = this.elements;

    if (setNameBtn) setNameBtn.removeEventListener('click', this.setName);
    if (addHarmonicBtn) addHarmonicBtn.removeEventListener('click', this.addHarmonic);
  }
}
