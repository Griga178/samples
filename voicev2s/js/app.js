class App {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
    this.isInitializing = false;
    this.components = {};
    this.presets = null;
    this.soundTrack = null;
    this.uiManager = null;
    this.uiModules = {};
  }

  async init() {
    if (this.initialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      window.audioContext = this.audioContext;

      // Core components
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

      // Features
      this.presets = new GeneratorPresets();
      this.soundTrack = new SoundTrack(this.audioContext, this.presets);

      // UI Manager
      this.uiManager = new UIManager();
      this.uiModules = {
        generator: new GeneratorUI(this.uiManager, this.components.generator).init(),
        presets: new PresetsUI(this.uiManager, this.presets).init(),
        track: new TrackUI(this.uiManager, this.soundTrack, this.presets).init(),
        microphone: new MicrophoneUI(this.uiManager, this.components.microphone, this.components.analyzer).init()
      };

      await this.components.storage.init();
      this.components.player.enable();

      this.uiModules.presets.render();
      this.uiModules.track.render();

      this.initialized = true;
      this.isInitializing = false;
      console.log('✅ Audio Training System initialized');
    } catch (error) {
      this.isInitializing = false;
      console.error('❌ Initialization error:', error);
    }
  }

  _applyPreset(id) {
    const preset = this.presets.get(id);
    if (!preset) return;
    this.components.generator.updateOptions(preset.options);
    this.uiModules.generator.renderHarmonics(preset.options.harmonics);
    this.uiManager.setValue('gen-name', preset.name);
  }
}

window.app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
