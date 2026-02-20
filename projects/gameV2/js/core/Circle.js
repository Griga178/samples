/**
 * Класс для представления круга-цели в игре
 */
class Circle {
    constructor(name, index, coord, radius, distance, color) {
        this.name = name;
        this.index = index;
        this.coord = coord;
        this.radius = radius;
        this.distance = distance;
        this.color = color;
        this.previousCircle = null;
        this.nextCircle = null;
        this.timeDeparture = null;
        this.timeArrival = null;
    }

    /**
     * Проверяет, находится ли точка внутри круга
     */
    isPointInside(point) {
        const dx = point.x - this.coord.x;
        const dy = point.y - this.coord.y;
        return (dx * dx + dy * dy <= this.radius * this.radius);
    }

    /**
     * Рисует круг на канвасе
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.coord.x, this.coord.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // Рисуем текст внутри круга
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.name, this.coord.x, this.coord.y);
    }

    /**
     * Изменяет цвет круга
     */
    setColor(color) {
        this.color = color;
    }

    /**
     * Проверяет пересечение с другим кругом
     */
    intersects(otherCircle) {
        const dx = otherCircle.coord.x - this.coord.x;
        const dy = otherCircle.coord.y - this.coord.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 2 * this.radius;
    }
}
