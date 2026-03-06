class SoundTrack extends EventEmitter {
  constructor(audioContext, presets) {
    super();
    this.audioContext = audioContext;
    this.presets = presets;
    this.elements = [];
    this.isPlaying = false;
    this.currentSource = null;
    this.maxElements = 30;
    this.maxDuration = 30;
  }

  addElement(presetId, duration = 1.0, amplitude = 0.5) {
    if (this.elements.length >= this.maxElements) {
      console.warn('Max elements reached');
      return false;
    }

    const totalDuration = this.getTotalDuration();
    if (totalDuration + duration > this.maxDuration) {
      console.warn('Max duration reached');
      return false;
    }

    const element = {
      id: crypto.randomUUID?.() || Date.now().toString(36),
      presetId,
      duration: Math.max(0.1, Math.min(duration, this.maxDuration)),
      amplitude: Math.max(0, Math.min(amplitude, 1))
    };

    this.elements.push(element);
    this.emit('trackChanged', this.elements);
    return true;
  }

  removeElement(id) {
    const index = this.elements.findIndex(e => e.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1);
      this.emit('trackChanged', this.elements);
      return true;
    }
    return false;
  }

  updateElement(id, updates) {
    const element = this.elements.find(e => e.id === id);
    if (element) {
      if (updates.duration) {
        const newTotal = this.getTotalDuration() - element.duration + updates.duration;
        if (newTotal > this.maxDuration) return false;
        element.duration = updates.duration;
      }
      if (updates.amplitude) element.amplitude = updates.amplitude;
      if (updates.presetId) element.presetId = updates.presetId;
      this.emit('trackChanged', this.elements);
      return true;
    }
    return false;
  }

  getTotalDuration() {
    return this.elements.reduce((sum, e) => sum + e.duration, 0);
  }

  async play() {
    if (this.isPlaying || this.elements.length === 0) return false;

    this.isPlaying = true;
    this.emit('playStateChange', true);

    try {
      const buffer = await this._renderToBuffer();
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();

      this.currentSource = source;
      source.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        this.emit('playStateChange', false);
      };

      return true;
    } catch (err) {
      console.error('Playback error:', err);
      this.isPlaying = false;
      this.emit('playStateChange', false);
      return false;
    }
  }

  stop() {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch(e) {}
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.emit('playStateChange', false);
  }

  async _renderToBuffer() {
    const sampleRate = this.audioContext.sampleRate;
    const totalSamples = Math.ceil(this.getTotalDuration() * sampleRate);
    const audioBuffer = this.audioContext.createBuffer(1, totalSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    let offset = 0;

    for (const element of this.elements) {
      const preset = this.presets.get(element.presetId);
      if (!preset) continue;

      const elementSamples = Math.ceil(element.duration * sampleRate);

      for (let i = 0; i < elementSamples && offset + i < totalSamples; i++) {
        const time = (offset + i) / sampleRate;
        let sample = 0;

        for (const h of preset.options.harmonics) {
          sample += h.amplitude * element.amplitude *
                    Math.sin(2 * Math.PI * h.frequency * time);
        }

        channelData[offset + i] += sample;
      }

      offset += elementSamples;
    }

    return audioBuffer;
  }

  clear() {
    this.elements = [];
    this.emit('trackChanged', this.elements);
  }

  export() {
    const data = {
      name: 'track_' + Date.now().toString(36),
      timestamp: Date.now(),
      elements: JSON.parse(JSON.stringify(this.elements)),
      totalDuration: this.getTotalDuration()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.name}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return data;
  }

  import(data) {
    if (data.elements && Array.isArray(data.elements)) {
      this.elements = data.elements;
      this.emit('trackChanged', this.elements);
      return true;
    }
    return false;
  }

  getState() {
    return {
      elements: this.elements,
      isPlaying: this.isPlaying,
      totalDuration: this.getTotalDuration()
    };
  }
}

window.SoundTrack = SoundTrack;
