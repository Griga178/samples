// 📄 js/ui/AnalyzerUI.js
class AnalyzerUI {
  constructor(analyzer, canvasId, listId) {  // ← 3 параметра!
    this.analyzer = analyzer;
    this.canvas = document.getElementById(canvasId);   // ← прямое получение
    this.list = document.getElementById(listId);
    this.ctx = this.canvas?.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx?.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  render(harmonics = []) {
    this._drawChart(harmonics);
    this._drawList(harmonics);
  }

  _drawChart(harmonics) {
    if (!this.ctx) {
      console.warn('AnalyzerUI: ctx is null');
      return;
    }
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, 0, width, height);

    if (!harmonics?.length) {
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.fillText('Нет гармоник', 10, height / 2);
      return;
    }

    const maxFreq = 4000;
    const baseY = height - 20;

    harmonics.slice(0, 12).forEach((h, i) => {
      const x = (h.frequency / maxFreq) * width;
      const barH = Math.min(h.amplitude * (height - 40), height - 40);
      const hue = (i * 30) % 360;

      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(x - 4, baseY - barH, 8, barH);

      if (barH > 30) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(h.frequency) + 'Hz', x, baseY - barH - 5);
      }
    });

    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(width, baseY);
    ctx.stroke();
  }

  _drawList(harmonics) {
    if (!this.list) return;
    if (!harmonics?.length) {
      this.list.innerHTML = '<div style="color:#999">—</div>';
      return;
    }
    this.list.innerHTML = harmonics.slice(0, 10).map((h, i) =>
      `<div class="h-item">
        <span class="h-dot" style="background:hsl(${i*30},70%,50%)"></span>
        <strong>${Math.round(h.frequency)} Hz</strong>
        <span>×${h.amplitude.toFixed(2)}</span>
        <span>φ${(h.phase*180/Math.PI).toFixed(0)}°</span>
      </div>`
    ).join('');
  }

  clear() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.list) this.list.innerHTML = '<div style="color:#999">—</div>';
  }
}

window.AnalyzerUI = AnalyzerUI;
