const defaultColors = {
  interfaceContainerBackground: "#F0F0F0",
  interfaceGameContainerBackground: "#FFFFFF",
  interfaceGameMenuBackground: "#F0F0F0",
  interfaceGameMenuBackground: "#F0F0F0",
};
class Game{
  constructor(canvas, clr){
    this.canvas = canvas

    this.circles = [];
    this.places = [];

    this.motions = []; // перемещение между 2 кругами
    this.tracking = []; // все motions за игру
    this.stops = []

    this.init(clr)
    };
  init(clr) {
    this.ctx = this.canvas.getContext('2d');
    // / Фон для всего canvas
    this.bgWelcome = (clr && clr.back.welcome) || "#252525";
    this.bgGameStart = (clr && clr.back.gameStart) || "#bfbfbf";
    this.bgExit = (clr && clr.back.exit) || "#252525";
    this.bgExitText = (clr && clr.back.exitText) || "#fff";

    this.ctx.fillStyle = this.bgWelcome;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.startCoord = {x: 400, y: 300}
    this.circlesAmount = 6
    this.radius = 25
    this.distance = 150

    this.ptClrInit = (clr && clr.crcl.initial) || "rgba(0, 0, 255, 0.1)";
    this.ptСlrStartPrep = (clr && clr.crcl.hover) || "#FF5733";
    this.ptСlrStartReady = (clr && clr.crcl.readyToStart) || "#28A745";
    this.ptСlrinMotion = (clr && clr.crcl.inMotion) || "rgba(0, 0, 0, 0.4)";
    this.crclСlrFinish = (clr && clr.crcl.finish) || "#0056B3";

    this.analyzer = new Analyzer(this)
    this.Menu = new Menu(this)
  };
  saveSettings(circlesAmount, radius, distance) {
      this.circlesAmount = circlesAmount;
      this.radius = radius;
      this.distance = distance;
      console.log('Настройки сохранены:', this);
  }
  generateCircles(amount, radius, distance){
    const circles = [];
    // Добавляем первый элемент с именем "start"
    circles.push({ name: "start", index: 0,
      coord: this.startCoord, color: this.ptClrInit,
      radius: radius, distance: null });
    // Добавляем промежуточные элементы "step1", "step2", ..., "step{amount-2}"
    for (let i = 1; i < amount - 1; i++) {
        circles.push({ name: `step ${i}`, index: i,
          coord: null, color: this.ptClrInit,
          radius: radius, distance: distance });
    }
    // Добавляем последний элемент с именем "finish"
    circles.push({name: "finish", index: amount - 1,
        coord: null, color: this.ptClrInit,
        radius: radius, distance: distance });
    return circles;

  };
  getRandomPosition(circle){
    // Нерешённая проблема: при переизбытке кругов, они начинают частично
    // накладываться друг на друга, а потом и вовсе генерироваться в 2 местах.
    // решение: ограничить количество, радиус кругов и их дистанцию.

    // список возможных координат круга
    const points = [];
    // координаты предыдущего круга
    let circleX;
    let circleY;
    const previousCircle = circle.previousCircle
    // стартовая позиция
    if (previousCircle === null) {
        circleX = 100;
        circleY = 100;
    } else {
      circleX = previousCircle.coord.x;
      circleY = previousCircle.coord.y;
    }
    // Генерируем X точек на  расстоянии distance
    // от центра окружности circle
    const borderPoints = 280
    for (let i = 0; i < borderPoints; i++) {
        const angle = (i * Math.PI * 2) / borderPoints; // Разбиваем круг на X частей
        const x = circleX + circle.distance * Math.cos(angle);
        const y = circleY + circle.distance * Math.sin(angle);
        points.push({ x, y });
    }
    // Убираем точки, которые выходят за пределы контейнера
    const borderPadding = this.radius * 1.01
    const validPoints = points.filter(point => {
        return (
            point.x >= borderPadding && point.x <= this.canvas.width - borderPadding &&
            point.y >= borderPadding && point.y <= this.canvas.height - borderPadding
        );
    });

    // Проверяем каждую точку из validPoints на пересечение с this.circles
    let notInterValidPoints = []
    for (const point of validPoints) {
        let intersects = false;

        for (const coord of this.places) {
            if (this.circlesIntersect(coord, point, this.radius)) {
              // нашли пересечение
                intersects = true;
                break;
            }
        }
        if (!intersects) {
          // добавляем круги, не пересекающиеся с др. кругами
            notInterValidPoints.push(point);
        }
    }
    // Если validPoints остается пустым, ищем точку с наименьшей площадью пересечения
    if (notInterValidPoints.length === 0) {
        let minIntersectionArea = Infinity;
        let selectedPoint = null;

        for (const point of validPoints) {

            let intersectionArea = 0;

            for (const coord of this.places) {
              const dx = coord.x - point.x;
              const dy = coord.y - point.y;
              const distanceCircle = Math.sqrt(dx * dx + dy * dy);
              const rSquared = Math.pow(this.radius, 2);
              const part1 = rSquared * Math.acos(distanceCircle / (2 * this.radius));
              const part2 = (rSquared * distanceCircle) / 2 * Math.sqrt(1 - Math.pow(distanceCircle / (2 * this.radius), 2));
              intersectionArea =  part1 - part2;

              }
              if (intersectionArea < minIntersectionArea) {
                  minIntersectionArea = intersectionArea;
                  selectedPoint = point;
            }
        }
        if (selectedPoint) {
            notInterValidPoints.push(selectedPoint);
        }
      }
    // Случайно выбираем одну точку из валидных
    if (notInterValidPoints.length > 0) {
        const randomIndex = Math.floor(Math.random() * notInterValidPoints.length);
        let blockX = notInterValidPoints[randomIndex]['x']
        let blockY = notInterValidPoints[randomIndex]['y']
        return {x: blockX , y: blockY}
    } else {
        console.log('Задан слишком большой радиус')
        return {x: this.radius , y: this.radius}; // Если нет валидных точек
    }
  };
  circlesIntersect(circle1, circle2, r){
      const dx = circle2.x - circle1.x;
      const dy = circle2.y - circle1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 2 * r; // Пересекаются, если расстояние меньше двукратного радиуса
  };
  drawCircle(circle){
    this.ctx.beginPath();
    this.ctx.arc(circle.coord.x, circle.coord.y, circle.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = circle.color;
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.closePath();
    // Рисуем текст внутри круга
    this.ctx.fillStyle = "#fff"; // Цвет текста
    this.ctx.font = "bold 14px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(circle.name, circle.coord.x, circle.coord.y);
  };

  startGame(param){
    this.ctx.fillStyle = this.bgGameStart;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.removeEventListener('mousemove', this.detectMouseInCircleBound);
    this.canvas.removeEventListener('mousemove', this.watchMouseWhileInCircleBound);
    this.canvas.removeEventListener('mousemove', this.trackMouseUntilTargetBound);

    this.motions = []
    this.tracking = []
    this.stops = []

    this.circles = []
    this.places = []
    this.circles = this.generateCircles(this.circlesAmount, this.radius, this.distance)
    // старт игры
    // отрисовка кругов
    this.circles.forEach((circle, index) => {
        // устанавливаем рандомные координаты
        let previousCircle = index > 0 ? this.circles[index - 1] : null;
        let nextCircle = (index < this.circles.length - 1) ? this.circles[index + 1] : null;
        circle.previousCircle = previousCircle
        circle.nextCircle = nextCircle

        if (circle.coord === null) {
            circle.coord = this.getRandomPosition(circle);
        }
        // добавляем существующие координаты для избежания пересечения
        this.places.push(circle.coord);
        // отрисовка кругов
        this.drawCircle(circle);
    });
    // установка начальных events
    this.setReady(this.circles[0])
    // Добавление заголовков в таблицу
    // this.analyzer.appendHeadRow()

  };
  exitGame(){
    this.ctx.fillStyle = this.bgExit;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle =   this.bgExitText
    this.ctx.font = "bold 18px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("Конец игры", this.canvas.width / 2, this.canvas.height / 2);
  };

  setReady(circle){
    circle.color = this.ptСlrStartPrep;
    this.drawCircle(circle);
    this.detectMouseInCircleBound = this.detectMouseInCircle.bind(this, circle);
    this.canvas.addEventListener('mousemove', this.detectMouseInCircleBound);
  };
  onStart(circle) {
    circle.color = this.ptСlrStartReady;
    this.drawCircle(circle);
    this.watchMouseWhileInCircleBound = this.watchMouseWhileInCircle.bind(this, circle);
    this.canvas.addEventListener('mousemove', this.watchMouseWhileInCircleBound);
  };
  inMotion(circle) {
    circle.color = this.ptСlrinMotion;
    circle.timeDeparture = new Date();
    this.trackMouseUntilTargetBound = this.trackMouseUntilTarget.bind(this, circle);
    this.canvas.addEventListener('mousemove', this.trackMouseUntilTargetBound);
  };
  endMotion(circle) {
    circle.timeArrival = new Date();
    // УЧЕТ ТОЧКИ ОКОНЧАНИЯ МАРШРУТА -почти
    this.tracking.push([...this.motions])
    this.analyzer.appendRow(this.motions)

    // рисуем траекторию движения
    for (let i = 0; i < this.motions.length; i++) {
      drawPt(this.ctx, this.motions[i], 'brown', 2);
    }
    // проверяем на остановки
    this.checkStop()
    // рисуем остановки
    for (let i = 0; i < this.stops.length; i++) {
      drawPt(this.ctx, this.stops[i], 'yellow', 5);
    }

    this.motions = []
    this.stops = []

    if (circle.nextCircle) {
        this.setReady(circle);
    } else {
        this.finish(circle);
    }
  }
  finish(circle) {
    circle.color = this.crclСlrFinish
    this.drawCircle(circle);
    this.tracking.map(moving => {
        const totalDistance = this.analyzer.analyzeMovement(moving);
        // console.log(totalDistance);
        // сохранить результаты игры TOTAL SCORE
    });
  }

  checkStop() {
    for (let i = 1; i < this.motions.length; i++) {
      const mouseCoords = this.motions[i]
      const lastCoords = this.motions[i - 1];
      // Проверяем, изменились ли координаты
      const sameCoords = lastCoords.x === mouseCoords.x && lastCoords.y === mouseCoords.y;
      const timeDiff = mouseCoords.time - lastCoords.time;
      const maxTimeDiff = 1 // мс

      if (sameCoords && timeDiff > maxTimeDiff) {
          this.stops.push(mouseCoords)
      }
    }
  }
  isStopped(mouseCoords){
    // console.log("stop", mouseCoords)
    // drawPt(this.ctx, mouseCoords, 'red', 3) // devUtils.js
  }

  trackMouseUntilTarget (circle) {
    // console.log('track')
    const mousePos = this.getMousePos(event);
    const mouseCoords = {
      step: circle, time: new Date(),
      x: mousePos.x, y: mousePos.y
      }
    // запись всех движений мыши
    this.motions.push(mouseCoords)
    if (this.isInsideCircle(mousePos, circle.nextCircle)) {
      this.drawCircle(circle.nextCircle);
      this.canvas.removeEventListener('mousemove', this.trackMouseUntilTargetBound);
      this.endMotion(circle.nextCircle)
    }
  }
  detectMouseInCircle (circle) {
    // мышь зашла на круг старта
    const mousePos = this.getMousePos(event);
    if (this.isInsideCircle(mousePos, circle)) {
        circle.nextCircle.color = this.ptСlrStartPrep;
        this.drawCircle(circle);
        this.drawCircle(circle.nextCircle);
        this.canvas.removeEventListener('mousemove', this.detectMouseInCircleBound);
        this.onStart(circle)
    }
  };
  watchMouseWhileInCircle (circle) {
      const mousePos = this.getMousePos(event);
      if (!this.isInsideCircle(mousePos, circle)) {
        circle.color = this.ptСlrinMotion
        this.drawCircle(circle);
        this.canvas.removeEventListener('mousemove', this.watchMouseWhileInCircleBound);
        this.inMotion(circle);
      }
  };
  getMousePos (event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
  };
  isInsideCircle(mousePos, circle) {
      const dx = mousePos.x - circle.coord.x;
      const dy = mousePos.y - circle.coord.y;
      return (dx * dx + dy * dy <= circle.radius * circle.radius);
    }
};

class Menu {
  constructor(game) {
    this.game = game
    this.init()
  };
  init() {
    this.startButton = document.getElementById('startButton');
    this.settingsButton = document.getElementById('settingsButton');
    this.saveButton = document.getElementById('saveButton');
    this.settingsWindow = document.getElementById('settingsWindow');
    this.saveButton = document.getElementById('saveButton');
    this.closeSettingsButton = document.getElementById('closeSettingsButton');

    this.restartButton = document.getElementById('restartButton');
    this.exitButton = document.getElementById('exitButton');

    this.startButton.onclick = () => {
      this.game.startGame();
      this.initGameButtons()
    };
    this.settingsButton.onclick = () => {
      settingsWindow.style.display = 'block';
    };
    this.saveButton.addEventListener('click', () => {
      const circlesAmount = parseInt(document.getElementById('circlesAmount').value) || 3;
      const radius = parseFloat(document.getElementById('radius').value) || 25;
      const distance = parseFloat(document.getElementById('distance').value) || 50;
      game.saveSettings(circlesAmount, radius, distance);
      this.closeSettingsButton.onclick()
    });
    this.closeSettingsButton.onclick = () => {
      settingsWindow.style.display = 'none';
    };
    this.populateSettings()
  };
  // Функция для установки значений в поля ввода
  populateSettings() {
      document.getElementById('circlesAmount').value = this.game.circlesAmount;
      document.getElementById('radius').value = this.game.radius;
      document.getElementById('distance').value = this.game.distance;
  }


  initGameButtons() {
    this.startButton.style.display = 'none';
    this.settingsWindow.style.display = 'none';
    this.restartButton.style.display = 'block';
    this.exitButton.style.display = 'block';
    this.restartButton.onclick = () => {
      this.game.startGame('restart')
    };

    this.exitButton.onclick = () => {
      this.game.exitGame()
      this.initMenuButtons()
    };

    // document.getElementById('gameMenu').appendChild(this.restartButton);
    // document.getElementById('gameMenu').appendChild(this.exitButton);
  };
  initMenuButtons() {
    this.restartButton.style.display = 'none';
    this.exitButton.style.display = 'none';
    this.startButton.style.display = 'block';
    this.settingsButton.style.display = 'block';
  };
};

class Analyzer {
  // работает с объектами типа:
  // point = {time: t, x: x, y: y}
  // moving = [point, ...]
  constructor() {
    this.results = []
    this.table = document.getElementById('scoreTable');

  };
  calcDistanceTimeSpeed(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeDiff = point2.time - point1.time;
    const speed = distance / timeDiff;
    return {distance: distance, speed: speed,
      timeDiff: timeDiff}
  };
  reducePoints(moving) {
    let i = 0;

    while (i < moving.length - 1) {
        const point1 = moving[i];
        const point2 = moving[i + 1];

        const { distance, timeDiff, speed } = this.calcDistanceTimeSpeed(point1, point2);

        if (timeDiff === 0) {
            // Удаляем второй элемент (point2)
            moving.splice(i + 1, 1);
            // Сбрасываем цикл, чтобы проверить вновь
            i = 0;
        } else {
            // Переходим к следующему элементу
            i++;
        }
    }
    return moving;
  }
  analyzeMovement(moving) {
    if (moving.length < 2) {
        return null; // Нельзя вычислить, если меньше двух пунктов
    }
    moving = this.reducePoints(moving)
    // Вычисляем общее расстояние, время, скорость
    const total = this.calcDistanceTimeSpeed(moving[0], moving[moving.length - 1]);

    let smoothnessScore = 0;

    for (let i = 0; i < moving.length - 1; i++) {
      let instant = this.calcDistanceTimeSpeed(moving[i], moving[i + 1]);

      // Вычисляем разницу между средней и мгновенной скоростью
      smoothnessScore += Math.abs(total.speed - instant.speed);
    }
    // Меньшее значение smoothnessScore дает более "плавное" движение
    return {
        averageSpeed: total.speed,
        time: total.timeDiff,
        smoothnessScore: smoothnessScore,
    };
  };
  appendHeadRow(){
    console.log("New  Game")
  };
  appendRow(moving) {
    const tableRow = this.analyzeMovement(moving)
    // Создаем новую строку и ячейки
    const newRow = document.createElement('tr');
    // Создаем ячейку номера
    const numCell = document.createElement('td');
    numCell.textContent = 0
    // Создаем ячейку времени
    const timeCell = document.createElement('td');
    timeCell.textContent = `${tableRow.time} ms`
    // Создаем ячейку для средней скорости
    // const speedCell = document.createElement('td');
    // speedCell.textContent = tableRow.averageSpeed.toFixed(2);
    // Создаем ячейку для оценки плавности
    const smoothnessCell = document.createElement('td');
    smoothnessCell.textContent = tableRow.smoothnessScore.toFixed(2);
    // Добавляем ячейки в новую строку
    newRow.appendChild(numCell);
    newRow.appendChild(timeCell);

    // newRow.appendChild(speedCell);
    newRow.appendChild(smoothnessCell);
    // Добавляем новую строку в таблицу
    this.table = document.getElementById("scoreTable");
    this.table.appendChild(newRow);
  };
  appendHeadRow
};
