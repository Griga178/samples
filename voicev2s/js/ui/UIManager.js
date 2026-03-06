class UIManager {
  constructor() {
    this.cache = new Map();
  }

  get(id) {
    if (!this.cache.has(id)) {
      this.cache.set(id, document.getElementById(id));
    }
    return this.cache.get(id);
  }

  getAll(selector) {
    return document.querySelectorAll(selector);
  }

  on(id, event, handler) {
    const el = this.get(id);
    if (el) el.addEventListener(event, handler);
    return this;
  }

  set(id, prop, value) {
    const el = this.get(id);
    if (el) el[prop] = value;
    return this;
  }

  setText(id, text) {
    const el = this.get(id);
    if (el) el.textContent = text;
    return this;
  }

  setValue(id, value) {
    const el = this.get(id);
    if (el) el.value = value;
    return this;
  }

  show(id) {
    const el = this.get(id);
    if (el) el.classList.remove('hidden');
    return this;
  }

  hide(id) {
    const el = this.get(id);
    if (el) el.classList.add('hidden');
    return this;
  }

  clear(id) {
    const el = this.get(id);
    if (el) el.innerHTML = '';
    return this;
  }
}

window.UIManager = UIManager;
