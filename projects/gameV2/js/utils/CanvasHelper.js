/**
 * Вспомогательные функции для работы с canvas
 */
class CanvasHelper {
    /**
     * Рисует точку на канвасе
     */
    static drawPoint(ctx, coords, color = 'red', radius = 5) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    /**
     * Очищает канвас и заполняет фоном
     */
    static clearCanvas(ctx, width, height, backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * Получает координаты мыши относительно канваса
     */
    static getMousePosition(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Рисует траекторию движения
     */
    static drawPath(ctx, points, color = 'brown', radius = 2) {
        points.forEach(point => {
            this.drawPoint(ctx, point, color, radius);
        });
    }

    /**
     * Рисует остановки
     */
    static drawStops(ctx, stops, color = 'yellow', radius = 5) {
        stops.forEach(stop => {
            this.drawPoint(ctx, stop, color, radius);
        });
    }

    /**
     * Создает градиент
     */
    static createGradient(ctx, x0, y0, x1, y1, colors) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        colors.forEach(([stop, color]) => {
            gradient.addColorStop(stop, color);
        });
        return gradient;
    }
}
