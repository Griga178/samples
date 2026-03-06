class Storage extends EventEmitter {
  constructor() {
    super();
    this.db = null;
    this.staticSounds = [];
    this.dynamicSounds = [];
    this.initialized = false;
  }

  async init() {
    await this._initIndexedDB();
    await this._parseStaticSounds();
    await this._loadDynamicSounds();
    this.initialized = true;
    this.emit('initialized');
    console.log('✅ Storage initialized');
  }

  _initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
          const store = db.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  async _parseStaticSounds() {
    const audioElements = document.querySelectorAll('#storage-block audio');
    this.staticSounds = [];

    audioElements.forEach((audio, index) => {
      this.staticSounds.push({
        id: `static_${index}`,
        name: audio.dataset.name || `Sound ${index + 1}`,
        src: audio.src,
        readonly: true,
        type: 'static'
      });
    });

    console.log(`📂 Loaded ${this.staticSounds.length} static sounds`);
    this.emit('staticSoundsLoaded', this.staticSounds);
  }

  async _loadDynamicSounds() {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(CONFIG.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        this.dynamicSounds = records.map(record => ({
          id: record.id,
          name: record.name,
          audioData: record.audioData, // ✅ ArrayBuffer (не AudioBuffer!)
          createdAt: record.createdAt,
          readonly: false,
          type: 'dynamic'
        }));
        console.log(`📂 Loaded ${this.dynamicSounds.length} dynamic sounds`);
        resolve();
      };

      request.onerror = () => {
        console.warn('Could not load dynamic sounds');
        resolve();
      };
    });
  }

  // ✅ ТОЛЬКО ArrayBuffer, НЕ AudioBuffer и НЕ Blob
  async addRecording(audioData, name = null) {
  // ✅ Проверка: audioData должен быть ArrayBuffer
  if (!audioData || !(audioData instanceof ArrayBuffer)) {
    console.warn('⚠️ addRecording: invalid audioData', audioData);
    // Пробуем обработать как fallback
    if (audioData && audioData.byteLength !== undefined) {
      // Это может быть TypedArray
      audioData = audioData.buffer || audioData;
    } else {
      console.error('❌ Cannot save: audioData is not an ArrayBuffer');
      return null;
    }
  }

  if (!this.db) {
    console.error('❌ Storage: Database not initialized');
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(CONFIG.STORE_NAME);

    const record = {
      name: name || `Recording ${Date.now()}`,
      audioData: audioData,
      createdAt: Date.now(),
      readonly: false,
      type: 'dynamic'
    };

    console.log('💾 Saving recording:', record.name, 'Size:', audioData.byteLength, 'bytes');

    const request = store.add(record);

    request.onsuccess = () => {
      record.id = request.result;

      this.dynamicSounds.push({
        id: record.id,
        name: record.name,
        audioData: audioData,
        createdAt: record.createdAt,
        readonly: false,
        type: 'dynamic'
      });

      console.log('✅ Recording saved with ID:', record.id);
      this.emit('recordingAdded', record);
      resolve(record);
    };

    request.onerror = (e) => {
      console.error('❌ Failed to save recording:', e.target.error);
      reject(e.target.error);
    };
  });
}

  async getAll() {
    return [...this.staticSounds, ...this.dynamicSounds];
  }

  // ✅ Создаём AudioBuffer из ArrayBuffer только когда нужно
  async getAudioBuffer(id) {
    const sound = [...this.staticSounds, ...this.dynamicSounds].find(s => s.id === id);
    if (!sound) {
      console.warn('Sound not found:', id);
      return null;
    }

    if (sound.type === 'static') {
      try {
        const response = await fetch(sound.src);
        const arrayBuffer = await response.arrayBuffer();
        return await window.audioContext.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error('Failed to load static sound:', error);
        return null;
      }
    } else {
      // ✅ Декодируем ArrayBuffer в AudioBuffer
      try {
        return await window.audioContext.decodeAudioData(sound.audioData.slice(0));
      } catch (error) {
        console.error('Failed to decode recording:', error);
        return null;
      }
    }
  }
  // ✅ Получаем Blob для воспроизведения в <audio>
  async getAudioBlob(id) {
    const sound = [...this.staticSounds, ...this.dynamicSounds].find(s => s.id === id);
    if (!sound) return null;

    if (sound.type === 'static') {
      // Для статических звуков возвращаем null (используем прямой src)
      return null;
    } else {
      try {
        const audioBuffer = await this.getAudioBuffer(id);
        if (audioBuffer) {
          return WAVExporter.export(audioBuffer);
        }
        return null;
      } catch (error) {
        console.error('Failed to create blob for playback:', error);
        return null;
      }
    }
  }

  async delete(id) {
    const index = this.dynamicSounds.findIndex(s => s.id === id);
    if (index === -1) {
      console.warn('Recording not found for deletion:', id);
      return false;
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction([CONFIG.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(CONFIG.STORE_NAME);
      store.delete(id);

      transaction.oncomplete = () => {
        this.dynamicSounds.splice(index, 1);
        console.log('🗑️ Recording deleted:', id);
        this.emit('recordingDeleted', id);
        resolve(true);
      };

      transaction.onerror = () => {
        console.error('Failed to delete recording');
        resolve(false);
      };
    });
  }

  async download(id) {
    const sound = this.dynamicSounds.find(s => s.id === id);
    if (!sound || !sound.audioData) {
      console.warn('No audio data for download:', id);
      return;
    }

    try {
      const audioBuffer = await this.getAudioBuffer(id);
      if (audioBuffer) {
        const wavBlob = WAVExporter.export(audioBuffer);
        WAVExporter.download(wavBlob, `${sound.name}.wav`);
        console.log('⬇️ Downloaded:', sound.name);
      }
    } catch (error) {
      console.error('Failed to download:', error);
    }
  }

  getState() {
    return {
      staticCount: this.staticSounds.length,
      dynamicCount: this.dynamicSounds.length,
      initialized: this.initialized
    };
  }
}

window.Storage = Storage;
