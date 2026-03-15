/**
 * @class PitchDetection
 * @description Набор алгоритмов для определения основной частоты (pitch) аудиосигнала.
 *
 * @example
 * // Определение частоты из временного буфера
 * const float32Array = analyzer.timeDataArray; // [-1, 1], длина 2048-4096
 * const sampleRate = audioContext.sampleRate;  // обычно 44100 или 48000
 *
 * const pitchYIN = PitchDetection.yin(float32Array, sampleRate, 0.1);
 *
 * if (pitchYIN > 0) {
 *   console.log(`Частота: ${Math.round(pitchYIN)} Hz`);
 * }
 *
 */
class PitchDetection {

  /**
   * @method yin
   * @static
   * @param {Float32Array} float32Array - Временной сигнал в диапазоне [-1, 1]
   * @param {number} sampleRate - Частота дискретизации (Гц), обычно 44100
   * @param {number} [threshold=0.1] - Порог уверенности (0.01-0.2), меньше = строже
   * @returns {number} Частота в Гц или -1 если не определена
   *
   * @description Алгоритм YIN для точного определения основной частоты.
   *              Оптимален для монофонических сигналов (голос, один инструмент).
   *              Сложность: O(n²), рекомендуется bufferSize 2048-4096.
   *
   * @throws {TypeError} Если float32Array не является массивом чисел
   *
   * @example
   * const pitch = PitchDetection.yin(
   *   analyzer.timeDataArray,
   *   audioContext.sampleRate,
   *   0.15 // чуть мягче порог для шумной среды
   * );
   */
  static yin(float32Array, sampleRate, threshold = 0.1) {
    // Валидация входных данных
    if (!float32Array || float32Array.length < 256) {
      return -1;
    }

    const bufferSize = float32Array.length;
    const maxPeriod = Math.floor(bufferSize / 2);
    const minPeriod = 8; // ~5.5кГц при 44.1кГц — верхний предел для голоса

    // Проверка на тишину (оптимизация: не считаем если сигнал слабый)
    let signalPower = 0;
    for (let i = 0; i < bufferSize; i++) {
      signalPower += float32Array[i] * float32Array[i];
    }
    if (signalPower / bufferSize < 0.0001) {
      return -1; // Слишком тихо для детектирования
    }

    const differenceFunction = this._differenceFunction(float32Array, bufferSize, maxPeriod);
    const cmnd = this._cumulativeMeanNormalizedDifference(differenceFunction, maxPeriod);

    // Поиск первого минимума ниже порога
    let pitchPeriod = -1;
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      if (cmnd[tau] < threshold) {
        pitchPeriod = tau;
        break;
      }
    }

    // Если не нашли — интерполяция лучшего минимума
    if (pitchPeriod === -1) {
      pitchPeriod = this._parabolicInterpolation(cmnd, minPeriod, maxPeriod);
    }

    return pitchPeriod > 0 ? sampleRate / pitchPeriod : -1;
  }

  /**
   * @method _differenceFunction
   * @private
   * @static
   * @param {Float32Array} float32Array
   * @param {number} bufferSize
   * @param {number} maxPeriod
   * @returns {Float32Array} Массив разностей для каждого лага
   */
  static _differenceFunction(float32Array, bufferSize, maxPeriod) {
    const difference = new Float32Array(maxPeriod);

    for (let tau = 0; tau < maxPeriod; tau++) {
      let sum = 0;
      // Оптимизация: локальная переменная для ускорения доступа
      for (let i = 0; i < bufferSize - tau; i++) {
        const delta = float32Array[i] - float32Array[i + tau];
        sum += delta * delta;
      }
      difference[tau] = sum;
    }
    return difference;
  }

  /**
   * @method _cumulativeMeanNormalizedDifference
   * @private
   * @static
   * @param {Float32Array} differenceFunction
   * @param {number} maxPeriod
   * @returns {Float32Array} Нормализованная кумулятивная разность
   */
  static _cumulativeMeanNormalizedDifference(differenceFunction, maxPeriod) {
    const cmnd = new Float32Array(maxPeriod);
    cmnd[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < maxPeriod; tau++) {
      runningSum += differenceFunction[tau];
      // Защита от деления на ноль
      cmnd[tau] = runningSum === 0 ? 0 : (differenceFunction[tau] * tau) / runningSum;
    }
    return cmnd;
  }

  /**
   * @method _parabolicInterpolation
   * @private
   * @static
   * @param {Float32Array} array
   * @param {number} minPeriod
   * @param {number} maxPeriod
   * @returns {number} Уточнённый период с суб-сэмпл точностью
   */
  static _parabolicInterpolation(array, minPeriod, maxPeriod) {
    let bestIndex = minPeriod;
    let minValue = array[minPeriod];

    // Поиск глобального минимума в диапазоне
    for (let i = minPeriod + 1; i < maxPeriod; i++) {
      if (array[i] < minValue) {
        minValue = array[i];
        bestIndex = i;
      }
    }

    // Параболическая интерполяция для суб-сэмпл точности
    if (bestIndex > minPeriod && bestIndex < maxPeriod - 1) {
      const a = array[bestIndex - 1];
      const b = array[bestIndex];
      const c = array[bestIndex + 1];
      const denominator = 2 * (a - 2 * b + c);

      // Защита от деления на ноль (плоский минимум)
      if (Math.abs(denominator) > 0.0001) {
        const correction = (a - c) / denominator;
        return bestIndex + correction;
      }
    }

    return bestIndex;
  }

}



window.PitchDetection = PitchDetection;
