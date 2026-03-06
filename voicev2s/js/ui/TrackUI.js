class TrackUI {
  constructor(uiManager, soundTrack, presets) {
    this.ui = uiManager;
    this.soundTrack = soundTrack;
    this.presets = presets;
    this.elements = {};
  }

  init() {
    this.elements = {
      presetSelect: this.ui.get('track-preset-select'),
      duration: this.ui.get('track-duration'),
      amplitude: this.ui.get('track-amplitude'),
      addElement: this.ui.get('add-track-element'),
      list: this.ui.get('track-list'),
      play: this.ui.get('play-track'),
      stop: this.ui.get('stop-track'),
      save: this.ui.get('save-track'),
      durationTotal: this.ui.get('track-duration-total')
    };

    this._setupListeners();
    this._bindEvents();
    return this;
  }

  _setupListeners() {
    this.elements.addElement?.addEventListener('click', () => this._addElement());
    this.elements.play?.addEventListener('click', () => this.soundTrack.play());
    this.elements.stop?.addEventListener('click', () => this.soundTrack.stop());
    this.elements.save?.addEventListener('click', () => this.soundTrack.export());

    this.elements.list?.addEventListener('click', (e) => {
      const item = e.target.closest('.track-item');
      if (!item) return;
      const id = item.dataset.id;
      if (e.target.classList.contains('btn-delete')) {
        this.soundTrack.removeElement(id);
      }
    });

    this.elements.duration?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.elements.duration.value = Math.max(0.1, Math.min(30, parseFloat(this.elements.duration.value) + delta)).toFixed(1);
    });

    this.elements.amplitude?.addEventListener('input', (e) => {
      e.target.title = `${Math.round(e.target.value * 100)}%`;
    });
  }

  _bindEvents() {
    this.soundTrack.on('trackChanged', () => this.render());
    this.soundTrack.on('playStateChange', (isPlaying) => {
      if (this.elements.play) {
        this.elements.play.textContent = isPlaying ? '⏹ Playing' : '▶ Play';
        this.elements.play.disabled = isPlaying;
      }
    });
  }

  _addElement() {
    const presetId = this.elements.presetSelect?.value;
    const duration = parseFloat(this.elements.duration?.value) || 1.0;
    const amplitude = parseFloat(this.elements.amplitude?.value) || 0.5;

    if (!presetId) {
      alert('Выберите пресет');
      return;
    }

    if (!this.soundTrack.addElement(presetId, duration, amplitude)) {
      alert('Превышен лимит (30 сек / 30 элементов)');
      return;
    }

    this.render();
  }

  render() {
    const state = this.soundTrack.getState();
    this.ui.clear('track-list');

    if (state.elements.length === 0) {
      this.elements.list.innerHTML = '<span class="no-data">Дорожка пуста</span>';
    } else {
      state.elements.forEach((el, index) => {
        const preset = this.presets.get(el.presetId);
        const div = document.createElement('div');
        div.className = 'track-item';
        div.dataset.id = el.id;
        div.innerHTML = `
          <span class="index">${index + 1}</span>
          <span class="name">${preset?.name || 'Unknown'}</span>
          <span class="duration">${el.duration.toFixed(1)}s</span>
          <span class="amplitude">${(el.amplitude * 100).toFixed(0)}%</span>
          <button class="btn-delete">✕</button>
        `;
        this.elements.list.appendChild(div);
      });
    }

    if (this.elements.durationTotal) {
      this.elements.durationTotal.textContent = state.totalDuration.toFixed(1) + 's';
    }

    this._updatePresetSelect();
  }

  _updatePresetSelect() {
    if (!this.elements.presetSelect) return;
    const presets = this.presets.getAll();
    this.elements.presetSelect.innerHTML = presets.map(p =>
      `<option value="${p.id}">${p.name}</option>`
    ).join('');
  }

  clear() {
    this.soundTrack.clear();
    this.render();
  }
}

window.TrackUI = TrackUI;
