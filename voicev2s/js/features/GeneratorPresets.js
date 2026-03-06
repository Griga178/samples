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
      this.presets = [];
    }
  }

  _save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.presets));
  }

  add(name, options, type = 'generator') {
    const preset = {
      id: crypto.randomUUID?.() || Date.now().toString(36),
      name: name || `${type === 'voice' ? 'voice' : 'preset'}_${Date.now().toString(36)}`,
      timestamp: Date.now(),
      type,
      options: JSON.parse(JSON.stringify(options))
    };
    this.presets.push(preset);
    this._save();
    return preset;
  }

  remove(id) {
    const index = this.presets.findIndex(p => p.id === id);
    if (index !== -1) {
      this.presets.splice(index, 1);
      this._save();
      return true;
    }
    return false;
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

  exportAll() {
    const blob = new Blob([JSON.stringify(this.presets, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presets_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            imported.forEach(p => {
              p.id = crypto.randomUUID?.() || Date.now().toString(36);
              this.presets.push(p);
            });
            this._save();
            resolve(imported.length);
          } else {
            reject(new Error('Invalid format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }
}

window.GeneratorPresets = GeneratorPresets;
