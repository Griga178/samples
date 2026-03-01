class Player extends EventEmitter {
  constructor(audioContext) {
    super();
    this.audioContext = audioContext;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1;
    this.gainNode.connect(this.audioContext.destination);
    this.isActive = true;
    this.sources = [];
  }

  connect(source) {
    if (source && !this.sources.includes(source)) {
      source.connect(this.gainNode);
      this.sources.push(source);
    }
  }

  disconnect(source) {
    if (source) {
      try {
        source.disconnect(this.gainNode);
        this.sources = this.sources.filter(s => s !== source);
      } catch(e) {}
    }
  }

  disconnectAll() {
    this.sources.forEach(source => {
      try { source.disconnect(this.gainNode); } catch(e) {}
    });
    this.sources = [];
  }

  setVolume(value) {
    this.gainNode.gain.setTargetAtTime(
      Math.max(0, Math.min(1, value)),
      this.audioContext.currentTime,
      0.05
    );
  }

  enable() {
    if (this.isActive) return;
    this.gainNode.gain.setTargetAtTime(1, this.audioContext.currentTime, 0.1);
    this.isActive = true;
    this.emit('stateChange', true);
  }

  disable() {
    if (!this.isActive) return;
    this.gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
    this.isActive = false;
    this.emit('stateChange', false);
  }

  getInput() {
    return this.gainNode;
  }

  getState() {
    return {
      isActive: this.isActive,
      volume: this.gainNode.gain.value,
      connectedSources: this.sources.length
    };
  }
}

window.Player = Player;
