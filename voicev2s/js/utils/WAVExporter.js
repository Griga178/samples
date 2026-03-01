// Экспорт аудио в WAV формат
class WAVExporter {
    static export(audioBuffer, config = CONFIG.WAV_EXPORT_CONFIG) {
    const numChannels = config.channels || audioBuffer.numberOfChannels;
    const sampleRate = config.sampleRate || audioBuffer.sampleRate;
    const bitDepth = config.bitDepth || 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const data = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      data.push(audioBuffer.getChannelData(i));
    }

    const numSamples = audioBuffer.length;
    const fileSize = 44 + numSamples * blockAlign;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, numSamples * blockAlign, true);

    // Write samples
    this.floatTo16BitPCM(view, 44, data, numChannels, numSamples, bitDepth);

    // ✅ Возвращаем Blob
    return new Blob([view], { type: 'audio/wav' });
  }

  static writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  static floatTo16BitPCM(view, offset, data, numChannels, numSamples, bitDepth) {
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, data[channel][i]));
        const intSample = bitDepth === 16
          ? sample < 0 ? sample * 0x8000 : sample * 0x7FFF
          : sample * 255;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
  }

  static download(blob, filename = 'recording.wav') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.WAVExporter = WAVExporter;
