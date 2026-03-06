class Recorder extends EventEmitter {
  constructor(audioContext) {
    super();
    this.audioContext = audioContext;
    this.isRecording = false;
    this.chunks = [];
    this.mediaRecorder = null;
    this.streamDestination = null;

    // Входной узел для подключения источника
    this.inputNode = this.audioContext.createGain();
  }

  getInput() {
    return this.inputNode;
  }

  start() {
    if (this.isRecording) return;

    try {
      this.streamDestination = this.audioContext.createMediaStreamDestination();
      this.inputNode.connect(this.streamDestination);

      const mimeTypes = [
        'audio/webm;codecs=pcm',
        'audio/webm',
        'audio/ogg;codecs=opus'
      ];

      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        throw new Error('No supported MIME type for MediaRecorder');
      }

      this.mediaRecorder = new MediaRecorder(this.streamDestination.stream, { mimeType });
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onerror = (e) => {
        console.error('❌ MediaRecorder error:', e.error);
        this.emit('error', e.error);
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.emit('stateChange', true);
      this.emit('recordingStarted');

    } catch (error) {
      console.error('❌ Recorder start error:', error);
      this.emit('error', error);
    }
  }

  async stop() {
    if (!this.isRecording) return null;

    return new Promise((resolve, reject) => {
      this.mediaRecorder.onstop = async () => {
        try {
          if (this.chunks.length === 0) {
            this.isRecording = false;
            this.emit('stateChange', false);
            this.emit('recordingStopped', { audioData: null });
            resolve({ audioData: null });
            return;
          }

          const blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType });
          const audioData = await blob.arrayBuffer();
          this.chunks = [];

          this.isRecording = false;
          this.emit('stateChange', false);
          this.emit('recordingStopped', { audioData });

          resolve({ audioData });

        } catch (error) {
          console.error('❌ Error in Recorder.onstop:', error);
          this.isRecording = false;
          this.emit('error', error);
          reject(error);
        }
      };

      this.mediaRecorder.stop();

      if (this.streamDestination) {
        try {
          this.inputNode.disconnect(this.streamDestination);
        } catch (e) {}
        this.streamDestination = null;
      }
    });
  }

  toggle() {
    return this.isRecording ? this.stop() : (this.start(), null);
  }

  getState() {
    return {
      isRecording: this.isRecording,
      chunksCount: this.chunks.length
    };
  }
}

window.Recorder = Recorder;
