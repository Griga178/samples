class Microphone {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.micStream = null;
    this.micSource = null;
    this.isActive = false;
  }

  async initAudio(constraints = {}) {
    const defaults = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: { ...defaults, ...constraints } });
    this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
    return this.micSource;
  }

  async enable(constraints) {
    if (this.isActive && this.micSource) return this.micSource;
    await this.initAudio(constraints);
    this.isActive = true;
    return this.micSource;
  }

  disable() {
    if (!this.isActive) return;
    if (this.micStream) this.micStream.getTracks().forEach(t => t.stop());
    if (this.micSource) { try { this.micSource.disconnect(); } catch(e) {} }
    this.micStream = null;
    this.micSource = null;
    this.isActive = false;
  }
}

window.Microphone = Microphone;
