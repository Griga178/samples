class GeneratorPresets {
  constructor(storageKey = 'generator_presets') {
    this.storageKey = storageKey;
    this.presets = [];
    this._load();
  }

  _load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.presets = data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load presets:', e);
      this.presets = [];
    }
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.presets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  }

  add(name, options) {
    const preset = {
      id: crypto.randomUUID?.() || Date.now().toString(36),
      name: name || `Preset ${this.presets.length + 1}`,
      timestamp: Date.now(),
      options: JSON.parse(JSON.stringify(options))
    };
    this.presets.push(preset);
    this._save();
    return preset;
  }

  remove(id) {
    const index = this.presets.findIndex(p => p.id === id);
    if (index !== -1) {
      const removed = this.presets.splice(index, 1)[0];
      this._save();
      return removed;
    }
    return null;
  }

  get(id) {
    return this.presets.find(p => p.id === id) || null;
  }

  getAll() {
    return [...this.presets];
  }

  apply(id, generator) {
    const preset = this.get(id);
    if (preset && generator) {
      generator.updateOptions(preset.options);
      return true;
    }
    return false;
  }

  updateName(id, newName) {
    const preset = this.get(id);
    if (preset) {
      preset.name = newName;
      this._save();
      return true;
    }
    return false;
  }

  export(id) {
    const preset = this.get(id);
    if (preset) {
      const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${preset.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    }
    return false;
  }

  import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const preset = JSON.parse(e.target.result);
          if (preset.options && preset.options.harmonics) {
            preset.id = crypto.randomUUID?.() || Date.now().toString(36);
            preset.timestamp = Date.now();
            this.presets.push(preset);
            this._save();
            resolve(preset);
          } else {
            reject(new Error('Invalid preset format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }
}

window.GeneratorPresets = GeneratorPresets;
