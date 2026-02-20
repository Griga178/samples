// импорты в главном файле

/**
 * Основной класс игры
 */
class Game {
    constructor(canvas, colorScheme) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.colorScheme = colorScheme;
        // this.analyzer = new Analyzer()

        this.circles = [];
        this.places = [];
        this.motions = [];
        this.tracking = [];
        this.stops = [];

        this.settings = {
            circlesAmount: 6,
            radius: 25,
            distance: 150,
            startCoord: { x: 400, y: 300 }
        };

        this.isRunning = false;

        this.init();
    }

    /**
     * Инициализация игры
     */
    init() {
        // Устанавливаем цвета
        this.bgColors = {
            welcome: this.colorScheme.background.welcome || "#ccc",
            gameStart: this.colorScheme.background.gameStart || "#bfbfbf",
            exit: this.colorScheme.background.exit || "#252525",
            exitText: this.colorScheme.background.exitText || "#fff"
        };

        this.circleColors = {
            initial: this.colorScheme.circle.initial || "rgba(0, 0, 255, 0.1)",
            hover: this.colorScheme.circle.hover || "#FF5733",
            readyToStart: this.colorScheme.circle.readyToStart || "#28A745",
            inMotion: this.colorScheme.circle.inMotion || "grey",
            finish: this.colorScheme.circle.finish || "#0056B3",
            success: this.colorScheme.circle.success || "green",
            errorMiss: this.colorScheme.circle.errorMiss || "red",
            errorDeviation: this.colorScheme.circle.errorDeviation || "orange"
        };

        // Очищаем канвас
        CanvasHelper.clearCanvas(this.ctx, this.canvas.width, this.canvas.height, this.bgColors.welcome);

        // Привязываем контекст для обработчиков событий
        this.detectMouseInCircleBound = null;
        this.watchMouseWhileInCircleBound = null;
        this.trackMouseUntilTargetBound = null;
    }

    /**
     * Сохраняет настройки игры
     */
    saveSettings(circlesAmount, radius, distance) {
        this.settings.circlesAmount = parseInt(circlesAmount) || 6;
        this.settings.radius = parseFloat(radius) || 25;
        this.settings.distance = parseFloat(distance) || 150;

        console.log('Настройки сохранены:', this.settings);
    }

    /**
     * Генерирует круги для игры
     */
    generateCircles() {
        const circles = [];
        const { circlesAmount, radius, distance, startCoord } = this.settings;

        // Стартовый круг
        circles.push(new Circle(
            "start",
            0,
            { ...startCoord },
            radius,
            null,
            this.circleColors.initial
        ));

        // Промежуточные круги
        for (let i = 1; i < circlesAmount - 1; i++) {
            circles.push(new Circle(
                `step ${i}`,
                i,
                null,
                radius,
                distance,
                this.circleColors.initial
            ));
        }

        // Финальный круг
        circles.push(new Circle(
            "finish",
            circlesAmount - 1,
            null,
            radius,
            distance,
            this.circleColors.initial
        ));

        // Устанавливаем связи между кругами
        for (let i = 0; i < circles.length; i++) {
            if (i > 0) circles[i].previousCircle = circles[i - 1];
            if (i < circles.length - 1) circles[i].nextCircle = circles[i + 1];
        }

        return circles;
    }

    /**
     * Генерирует случайную позицию для круга
     */
    getRandomPosition(circle) {
        const points = [];
        const previousCircle = circle.previousCircle;

        // Координаты предыдущего круга
        const circleX = previousCircle ? previousCircle.coord.x : this.settings.startCoord.x;
        const circleY = previousCircle ? previousCircle.coord.y : this.settings.startCoord.y;

        // Генерируем точки на окружности
        const borderPoints = 280;
        for (let i = 0; i < borderPoints; i++) {
            const angle = (i * Math.PI * 2) / borderPoints;
            const x = circleX + circle.distance * Math.cos(angle);
            const y = circleY + circle.distance * Math.sin(angle);
            points.push({ x, y });
        }

        // Фильтруем точки, выходящие за границы
        const borderPadding = this.settings.radius * 1.01;
        const validPoints = points.filter(point => {
            return (
                point.x >= borderPadding &&
                point.x <= this.canvas.width - borderPadding &&
                point.y >= borderPadding &&
                point.y <= this.canvas.height - borderPadding
            );
        });

        // Фильтруем точки, пересекающиеся с другими кругами
        const nonIntersectingPoints = validPoints.filter(point => {
            return !this.places.some(place => {
                const dx = point.x - place.x;
                const dy = point.y - place.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < 2 * this.settings.radius;
            });
        });

        // Если нет непересекающихся точек, выбираем с минимальным пересечением
        if (nonIntersectingPoints.length === 0 && validPoints.length > 0) {
            return this.findMinIntersectionPoint(validPoints);
        }

        // Случайно выбираем точку
        if (nonIntersectingPoints.length > 0) {
            const randomIndex = Math.floor(Math.random() * nonIntersectingPoints.length);
            return { ...nonIntersectingPoints[randomIndex] };
        }

        // Резервный вариант
        return { x: this.settings.radius, y: this.settings.radius };
    }

    /**
     * Находит точку с минимальным пересечением
     */
    findMinIntersectionPoint(points) {
        let minIntersection = Infinity;
        let bestPoint = points[0];

        for (const point of points) {
            let intersectionArea = 0;

            for (const place of this.places) {
                const dx = place.x - point.x;
                const dy = place.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 2 * this.settings.radius) {
                    intersectionArea += (2 * this.settings.radius - distance);
                }
            }

            if (intersectionArea < minIntersection) {
                minIntersection = intersectionArea;
                bestPoint = point;
            }
        }

        return bestPoint;
    }

    /**
     * Запускает игру
     */
    startGame() {
      // Очищаем обычные строки из таблицы, оставляя только итоговые
      if (this.analyzer && typeof this.analyzer.clearRegularRows === 'function') {
          this.analyzer.clearRegularRows();
      }

      this.isRunning = true;

      // Очищаем данные
      this.motions = [];
      this.tracking = [];
      this.stops = [];
      this.circles = [];
      this.places = [];

      // Очищаем канвас
      CanvasHelper.clearCanvas(this.ctx, this.canvas.width, this.canvas.height, this.bgColors.gameStart);

      // Удаляем обработчики событий
      this.removeEventListeners();

      // Генерируем круги
      this.circles = this.generateCircles();

      // Отрисовываем круги
      this.circles.forEach(circle => {
          if (!circle.coord) {
              circle.coord = this.getRandomPosition(circle);
          }
          this.places.push({ ...circle.coord });
          circle.draw(this.ctx);
      });

      // Устанавливаем начальное состояние
      this.setReady(this.circles[0]);
  }

    /**
     * Завершает игру
     */
    exitGame() {
        this.isRunning = false;
        this.removeEventListeners();

        CanvasHelper.clearCanvas(this.ctx, this.canvas.width, this.canvas.height, this.bgColors.exit);

        this.ctx.fillStyle = this.bgColors.exitText;
        this.ctx.font = "bold 48px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText("Конец игры", this.canvas.width / 2, this.canvas.height / 2 - 40);

        this.ctx.font = "24px Arial";
        this.ctx.fillText("Спасибо за игру!", this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    /**
     * Устанавливает круг в состояние "готов к старту"
     */
    setReady(circle) {
        circle.setColor(this.circleColors.hover);
        circle.draw(this.ctx);

        this.detectMouseInCircleBound = (event) => this.detectMouseInCircle(event, circle);
        this.canvas.addEventListener('mousemove', this.detectMouseInCircleBound);
    }

    /**
     * Обнаруживает мышь на круге
     */
    detectMouseInCircle(event, circle) {
        const mousePos = CanvasHelper.getMousePosition(event, this.canvas);

        if (circle.isPointInside(mousePos)) {
            if (circle.nextCircle) {
                circle.nextCircle.setColor(this.circleColors.hover);
                circle.nextCircle.draw(this.ctx);
            }

            circle.setColor(this.circleColors.readyToStart);
            circle.draw(this.ctx);

            this.canvas.removeEventListener('mousemove', this.detectMouseInCircleBound);
            this.onStart(circle);
        }
    }

    /**
     * Начинает движение
     */
    onStart(circle) {
        this.watchMouseWhileInCircleBound = (event) => this.watchMouseWhileInCircle(event, circle);
        this.canvas.addEventListener('mousemove', this.watchMouseWhileInCircleBound);
    }

    /**
     * Отслеживает мышь внутри круга
     */
    watchMouseWhileInCircle(event, circle) {
        const mousePos = CanvasHelper.getMousePosition(event, this.canvas);

        if (!circle.isPointInside(mousePos)) {
            circle.setColor(this.circleColors.inMotion);
            circle.draw(this.ctx);

            this.canvas.removeEventListener('mousemove', this.watchMouseWhileInCircleBound);
            this.inMotion(circle);
        }
    }

    /**
     * Движение к следующему кругу
     */
    inMotion(circle) {
        circle.timeDeparture = new Date();
        this.trackMouseUntilTargetBound = (event) => this.trackMouseUntilTarget(event, circle);
        this.canvas.addEventListener('mousemove', this.trackMouseUntilTargetBound);
    }

    /**
     * Отслеживает движение до цели
     */
    trackMouseUntilTarget(event, circle) {
        const mousePos = CanvasHelper.getMousePosition(event, this.canvas);
        const mouseCoords = {
            step: circle,
            time: new Date(),
            x: mousePos.x,
            y: mousePos.y
        };

        this.motions.push(mouseCoords);

        if (circle.nextCircle && circle.nextCircle.isPointInside(mousePos)) {
            circle.nextCircle.draw(this.ctx);
            this.canvas.removeEventListener('mousemove', this.trackMouseUntilTargetBound);
            this.endMotion(circle.nextCircle);
        }
    }

    /**
     * Завершает движение к кругу
     */
    endMotion(circle) {
        circle.timeArrival = new Date();

        // Сохраняем траекторию
        this.tracking.push([...this.motions]);

        // Рисуем траекторию
        CanvasHelper.drawPath(this.ctx, this.motions);

        // Проверяем остановки
        this.checkStops();

        // Рисуем остановки
        CanvasHelper.drawStops(this.ctx, this.stops);

        // Заполнение таблицы
        this.analyzer.appendRow(this.motions)

        // Очищаем данные движения
        this.motions = [];
        this.stops = [];

        if (circle.nextCircle) {
            this.setReady(circle);
        } else {
            this.finish(circle);
        }
    }

    /**
     * Завершает игру (последний круг)
     */
     finish(circle) {
         circle.setColor(this.circleColors.finish);
         circle.draw(this.ctx);

         // Анализируем все траектории и добавляем итоговую строку
         this.tracking.forEach(moving => {
             console.log('Траектория:', moving.length, 'точек');
         });

         // Если есть подключенный анализатор, добавляем итоговую строку
         if (this.analyzer && typeof this.analyzer.appendSummaryRow === 'function') {
             this.analyzer.appendSummaryRow();
         }

         // Сохраняем результаты игры
         this.saveGameResults();
     }
     /**
      * Сохраняет результаты игры в localStorage
      */
     saveGameResults() {
         try {
             const gameResults = {
                 date: new Date().toISOString(),
                 settings: {
                     circlesAmount: this.settings.circlesAmount,
                     radius: this.settings.radius,
                     distance: this.settings.distance
                 },
                 results: this.tracking.map((track, index) => ({
                     step: index + 1,
                     points: track.length,
                     duration: track[track.length - 1].time - track[0].time
                 }))
             };

             // Получаем существующие результаты
             const savedResults = localStorage.getItem('gameHistory');
             const history = savedResults ? JSON.parse(savedResults) : [];

             // Добавляем новый результат
             history.unshift(gameResults);

             // Ограничиваем историю 20 последними играми
             if (history.length > 20) {
                 history.length = 20;
             }

             localStorage.setItem('gameHistory', JSON.stringify(history));
             console.log('Результаты игры сохранены');
         } catch (e) {
             console.error('Ошибка сохранения результатов:', e);
         }
     }

    /**
     * Проверяет остановки мыши
     */
    checkStops() {
        for (let i = 1; i < this.motions.length; i++) {
            const current = this.motions[i];
            const previous = this.motions[i - 1];

            const samePosition = current.x === previous.x && current.y === previous.y;
            const timeDiff = current.time - previous.time;

            if (samePosition && timeDiff > 1) {
                this.stops.push({ ...current });
            }
        }
    }

    /**
     * Удаляет все обработчики событий
     */
    removeEventListeners() {
        if (this.detectMouseInCircleBound) {
            this.canvas.removeEventListener('mousemove', this.detectMouseInCircleBound);
        }
        if (this.watchMouseWhileInCircleBound) {
            this.canvas.removeEventListener('mousemove', this.watchMouseWhileInCircleBound);
        }
        if (this.trackMouseUntilTargetBound) {
            this.canvas.removeEventListener('mousemove', this.trackMouseUntilTargetBound);
        }
    }

    /**
     * Перезапускает игру
     */
    restart() {
        this.exitGame();
        setTimeout(() => {
            this.startGame();
        }, 500);
    }
}
