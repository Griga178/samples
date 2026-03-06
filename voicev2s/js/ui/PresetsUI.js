class PresetsUI {
  constructor(uiManager, presets) {
    this.ui = uiManager;
    this.presets = presets;
    this.elements = {};
  }

  init() {
    this.elements = {
      list: this.ui.get('presets-list'),
      export: this.ui.get('export-presets'),
      import: this.ui.get('import-preset')
    };

    this._setupListeners();
    return this;
  }

  _setupListeners() {
    this.elements.export?.addEventListener('click', () => this.presets.exportAll());
    this.elements.import?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await this.presets.import(file);
          this.render();
        } catch (err) {
          alert('Ошибка импорта: ' + err.message);
        }
        e.target.value = '';
      }
    });

    this.elements.list?.addEventListener('click', (e) => {
      const item = e.target.closest('.preset-item');
      if (!item) return;
      const id = item.dataset.id;

      if (e.target.classList.contains('btn-apply')) window.app._applyPreset(id);
      else if (e.target.classList.contains('btn-delete')) this._delete(id);
      else if (e.target.classList.contains('btn-rename')) this._rename(id);
    });
  }

  render() {
    const presets = this.presets.getAll();
    this.ui.clear('presets-list');

    presets.forEach(preset => {
      const div = document.createElement('div');
      div.className = 'preset-item';
      div.dataset.id = preset.id;
      div.innerHTML = `
        <span class="name">${preset.name}</span>
        <span class="type">${preset.type || 'generator'}</span>
        <button class="btn-apply">▶</button>
        <button class="btn-rename">✎</button>
        <button class="btn-delete">✕</button>
      `;
      this.elements.list.appendChild(div);
    });

    // Обновляем dropdown для трека
    const trackSelect = this.ui.get('track-preset-select');
    if (trackSelect) {
      trackSelect.innerHTML = presets.map(p =>
        `<option value="${p.id}">${p.name}</option>`
      ).join('');
    }
  }

  _delete(id) {
    if (confirm('Удалить пресет?')) {
      this.presets.remove(id);
      this.render();
    }
  }

  _rename(id) {
    const preset = this.presets.get(id);
    if (!preset) return;
    const newName = prompt('Новое название:', preset.name);
    if (newName?.trim()) {
      this.presets.updateName(id, newName.trim());
      this.render();
    }
  }
}

window.PresetsUI = PresetsUI;
