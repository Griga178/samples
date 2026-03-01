class AudioComparator {
  constructor() {
    this.thresholds = CONFIG.MATCH_THRESHOLDS;
  }

  compare(buffer1, buffer2, referenceFreq = null) {
    const data1 = buffer1.getChannelData(0);
    const data2 = buffer2.getChannelData(0);

    const results = {
      YIN: this._compareYIN(data1, data2, buffer1.sampleRate),
      Autocorrelation: this._compareAutocorrelation(data1, data2, buffer1.sampleRate),
      SpectralDistance: this._compareSpectral(data1, data2),
      similarity: 0,
      pitchDiff: 0,
      match: false,
      algorithmUsed: null
    };

    // Determine if any algorithm matches
    if (results.YIN.match) {
      results.match = true;
      results.algorithmUsed = 'YIN';
      results.similarity = results.YIN.similarity;
      results.pitchDiff = results.YIN.pitchDiff;
    } else if (results.Autocorrelation.match) {
      results.match = true;
      results.algorithmUsed = 'Autocorrelation';
      results.similarity = results.Autocorrelation.similarity;
    } else if (results.SpectralDistance.match) {
      results.match = true;
      results.algorithmUsed = 'SpectralDistance';
      results.similarity = results.SpectralDistance.similarity;
    }

    return results;
  }

  _compareYIN(data1, data2, sampleRate) {
    const freq1 = PitchDetection.yin(data1, sampleRate);
    const freq2 = PitchDetection.yin(data2, sampleRate);

    if (freq1 <= 0 || freq2 <= 0) {
      return { match: false, similarity: 0, pitchDiff: 0 };
    }

    const cents = PitchDetection.hzToCents(freq1, freq2);
    const similarity = Math.max(0, 1 - Math.abs(cents) / 100);
    const match = Math.abs(cents) <= this.thresholds.YIN;

    return { match, similarity, pitchDiff: cents };
  }

  _compareAutocorrelation(data1, data2, sampleRate) {
    const correlation = this._crossCorrelation(data1, data2);
    const match = correlation >= this.thresholds.Autocorrelation;
    return { match, similarity: correlation };
  }

  _compareSpectral(data1, data2) {
    const fftSize = 1024;
    const spectrum1 = this._getSpectrum(data1, fftSize);
    const spectrum2 = this._getSpectrum(data2, fftSize);

    const distance = this._spectralDistance(spectrum1, spectrum2);
    const similarity = Math.max(0, 1 - distance);
    const match = distance <= this.thresholds.SpectralDistance;

    return { match, similarity };
  }

  _crossCorrelation(signal1, signal2) {
    const length = Math.min(signal1.length, signal2.length);
    let sum = 0;
    let sum1 = 0;
    let sum2 = 0;

    for (let i = 0; i < length; i++) {
      sum += signal1[i] * signal2[i];
      sum1 += signal1[i] * signal1[i];
      sum2 += signal2[i] * signal2[i];
    }

    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : sum / denominator;
  }

  _getSpectrum(data, fftSize) {
    // Simple FFT approximation
    const spectrum = new Float32Array(fftSize / 2);
    for (let i = 0; i < fftSize / 2; i++) {
      spectrum[i] = Math.abs(data[i]) || 0;
    }
    return spectrum;
  }

  _spectralDistance(spectrum1, spectrum2) {
    const length = Math.min(spectrum1.length, spectrum2.length);
    let sum = 0;

    for (let i = 0; i < length; i++) {
      sum += Math.pow(spectrum1[i] - spectrum2[i], 2);
    }

    return Math.sqrt(sum / length);
  }

  getQualityLevel(similarity) {
    if (similarity >= 0.9) return 'high';
    if (similarity >= 0.7) return 'medium';
    return 'low';
  }
}

window.AudioComparator = AudioComparator;
