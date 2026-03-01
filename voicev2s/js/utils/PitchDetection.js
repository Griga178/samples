// Алгоритмы определения высоты тона
class PitchDetection {
  // YIN Algorithm
  static yin(float32Array, sampleRate, threshold = 0.1) {
    const bufferSize = float32Array.length;
    const maxPeriod = Math.floor(bufferSize / 2);
    const minPeriod = 8;

    const yinBuffer = new Float32Array(maxPeriod);
    const differenceFunction = this.differenceFunction(float32Array, bufferSize, maxPeriod);

    let cumulativeMeanNormalizedDifference = this.cumulativeMeanNormalizedDifference(
      differenceFunction,
      maxPeriod
    );

    let pitchPeriod = -1;
    for (let i = minPeriod; i < maxPeriod; i++) {
      if (cumulativeMeanNormalizedDifference[i] < threshold) {
        pitchPeriod = i;
        break;
      }
    }

    if (pitchPeriod === -1) {
      // Parabolic interpolation for better accuracy
      pitchPeriod = this.parabolicInterpolation(cumulativeMeanNormalizedDifference, minPeriod, maxPeriod);
    }

    return pitchPeriod > 0 ? sampleRate / pitchPeriod : -1;
  }

  static differenceFunction(float32Array, bufferSize, maxPeriod) {
    const difference = new Float32Array(maxPeriod);
    for (let tau = 0; tau < maxPeriod; tau++) {
      difference[tau] = 0;
      for (let i = 0; i < bufferSize - tau; i++) {
        const delta = float32Array[i] - float32Array[i + tau];
        difference[tau] += delta * delta;
      }
    }
    return difference;
  }

  static cumulativeMeanNormalizedDifference(differenceFunction, maxPeriod) {
    const cmnd = new Float32Array(maxPeriod);
    cmnd[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < maxPeriod; tau++) {
      runningSum += differenceFunction[tau];
      cmnd[tau] = differenceFunction[tau] * tau / runningSum;
    }
    return cmnd;
  }

  static parabolicInterpolation(array, minPeriod, maxPeriod) {
    let bestIndex = minPeriod;
    let minValue = array[minPeriod];

    for (let i = minPeriod + 1; i < maxPeriod; i++) {
      if (array[i] < minValue) {
        minValue = array[i];
        bestIndex = i;
      }
    }

    if (bestIndex > minPeriod && bestIndex < maxPeriod - 1) {
      const a = array[bestIndex - 1];
      const b = array[bestIndex];
      const c = array[bestIndex + 1];
      const correction = (a - c) / (2 * (a - 2 * b + c));
      return bestIndex + correction;
    }

    return bestIndex;
  }

  // Autocorrelation
  static autocorrelation(float32Array, sampleRate) {
    const bufferSize = float32Array.length;
    const maxPeriod = Math.floor(bufferSize / 2);
    const minPeriod = 8;

    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;
    const correlations = new Array(maxPeriod).fill(0);

    for (let offset = minPeriod; offset < maxPeriod; offset++) {
      let correlation = 0;
      for (let i = 0; i < bufferSize - offset; i++) {
        correlation += float32Array[i] * float32Array[i + offset];
      }
      correlations[offset] = correlation;

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
        foundGoodCorrelation = true;
      }
    }

    if (foundGoodCorrelation && bestOffset > 0) {
      // Parabolic interpolation
      const shift = (correlations[bestOffset - 1] - correlations[bestOffset + 1]) /
                    (2 * (correlations[bestOffset - 1] - 2 * correlations[bestOffset] + correlations[bestOffset + 1]));
      return sampleRate / (bestOffset + shift);
    }

    return -1;
  }

  // Convert Hz to cents
  static hzToCents(hz1, hz2) {
    if (hz1 <= 0 || hz2 <= 0) return 0;
    return 1200 * Math.log2(hz2 / hz1);
  }

  // Convert cents to Hz
  static centsToHz(hz, cents) {
    return hz * Math.pow(2, cents / 1200);
  }
}

window.PitchDetection = PitchDetection;
