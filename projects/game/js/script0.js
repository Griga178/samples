class Game{
  constructor(gameContainer){
    this.gameContainer = gameContainer
    this.canvasColor = "#252525";
    this.createCanvas()
    this.mainMenu = new MainMenu(this)
    this.distance = 250
    this.radius = 25
    this.startCoord = {x: 100, y: 100}
    this.circleColor = "rgba(0, 0, 255, 0.1)"
    this.circlesAmount = 50
    this.circles = []
    this.places = []
    };
  generateCircles(amount, radius, distance){
    const circles = [];
    // Добавляем первый элемент с именем "start"
    circles.push({ name: "start", index: 0,
      coord: this.startCoord, color: this.circleColor,
      radius: radius, distance: null });
    // Добавляем промежуточные элементы "step1", "step2", ..., "step{amount-2}"
    for (let i = 1; i < amount - 1; i++) {
        circles.push({ name: `step ${i}`, index: i,
          coord: null, color: this.circleColor,
          radius: radius, distance: distance });
    }
    // Добавляем последний элемент с именем "finish"
    circles.push({name: "finish", index: amount - 1,
        coord: null, color: this.circleColor,
        radius: radius, distance: distance });
    return circles;

  };
  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'gameCanvas';
    this.canvas.width = 800
    this.canvas.height = 600
    this.gameContainer.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d');
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

  drawExitBtn(){
    const buttonWidth = 22; // ширина квадрата
    const buttonHeight = 22; // высота квадрата
    const squareX = this.canvas.width - buttonWidth - 10; // позиция квадрата по X
    const squareY = 10; // позиция квадрата по Y
    this.ctx.fillStyle = 'blue'; // цвет квадрата
    this.ctx.fillRect(squareX, squareY, buttonWidth, buttonHeight);
  };
  startGame(param){
    this.ctx.fillStyle = '#f0f0f0'; // цвет фона
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.removeEventListener('mousemove', this.handleMouseMoveBound);
    this.canvas.removeEventListener('mousemove', this.handleMouseLeaveBound);
    this.canvas.removeEventListener('mousemove', this.handleMouseRunBound);
    if (param === 'restart') {
    } else{
      this.mainMenu = false
      this.gameMenu = new GameMenu(this);
    }
    this.circles = []
    this.places = []
    this.circles = this.generateCircles(this.circlesAmount, this.radius, this.distance)
    // старт игры
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
    // this.circles[0]
  };
  exitGame(){
    this.mainMenu = new MainMenu(this)
    this.gameMenu.remove()
  };

  setReady(circle){
    circle.color = 'blue';
    this.drawCircle(circle);
    this.handleMouseMoveBound = this.handleMouseMove.bind(this, circle);
    this.canvas.addEventListener('mousemove', this.handleMouseMoveBound);
  };
  onStart(circle) {
    circle.color = 'orange';
    this.drawCircle(circle);
    this.handleMouseLeaveBound = this.handleMouseLeave.bind(this, circle);
    this.canvas.addEventListener('mousemove', this.handleMouseLeaveBound);
  };
  go(circle) {
    circle.color = 'green';
    const currentTime = new Date();
    circle.timeDeparture = currentTime;
    this.handleMouseRunBound = this.handleMouseRun.bind(this, circle);
    this.canvas.addEventListener('mousemove', this.handleMouseRunBound);
  };
  finish(circle) {
    const currentTime = new Date();
    circle.timeArrival = currentTime;
    // УЧЕТ ТОЧКИ ОКОНЧАНИЯ МАРШРУТА
    if (circle.nextCircle) {
        this.setReady(circle);
    } else {
        this.endGame();
    }
  }
  endGame() {
    console.log(this.circles);
  }
  // обработка местоположения мыши
  handleMouseMove (circle) {
    const mousePos = this.getMousePos(event);
    if (this.isInsideCircle(mousePos, circle)) {
        circle.nextCircle.color = 'blue';
        this.drawCircle(circle);
        this.drawCircle(circle.nextCircle);
        this.canvas.removeEventListener('mousemove', this.handleMouseMoveBound);
        this.onStart(circle)
    }
  };
  handleMouseLeave (circle) {
      const mousePos = this.getMousePos(event);
      if (this.isOutsideCircle(mousePos, circle)) {
        circle.color = 'green';
        this.drawCircle(circle);
        this.canvas.removeEventListener('mousemove', this.handleMouseLeaveBound);
        this.go(circle);
      }
  };
  handleMouseRun(circle){
    const mousePos = this.getMousePos(event);
    if (this.isInsideCircle(mousePos, circle.nextCircle)) {
      circle.nextCircle.color = 'green';
      this.drawCircle(circle.nextCircle);
      this.finish(circle.nextCircle)
      this.canvas.removeEventListener('mousemove', this.handleMouseRunBound);
    }
  };
  getMousePos (event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
  };
  isOutsideCircle(mousePos, circle) {
    // Вычисляем расстояние от мыши до центра круга
    const distance = Math.sqrt(Math.pow(mousePos.x - circle.coord.x, 2) + Math.pow(mousePos.y - circle.coord.y, 2));
    // Проверяем, покинула ли мышь область круга
    return (distance > circle.radius)
  }
  isInsideCircle(mousePos, circle) {
      const dx = mousePos.x - circle.coord.x;
      const dy = mousePos.y - circle.coord.y;
      return (dx * dx + dy * dy <= circle.radius * circle.radius);
    }
};

class MainMenu {
    constructor(game) {
        this.canvas = game.canvas;
        this.ctx = game.ctx

        this.buttonWidthPercent = 40;   // ширина кнопки в %
        this.buttonHeightPercent = 10;   // высота кнопки в %
        this.textSizePercent = 5;        // размер текста в %
        this.buttonMarginPercent = 5;    // отступ между кнопками в %

        this.buttons = [];
        this.hoveredIndex = -1;
        this.pressedIndex = -1;

        this.listMainMenu = [
            { "name": "New Game", "func": () => {
                this.removeEventListeners()
                this.clearCanvas()
                game.startGame();
              }
            },
            { "name": "Load Game", "func": () => alert("Loading game!") },
            { "name": "Exit", "func": () => alert("Exiting!") }
        ];

        this.init();
        this.addEventListeners();
    }

    init() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        const buttonWidth = (this.buttonWidthPercent / 100) * canvasWidth;
        const buttonHeight = (this.buttonHeightPercent / 100) * canvasHeight;
        const buttonMargin = (this.buttonMarginPercent / 100) * canvasHeight;

        const totalHeight = this.listMainMenu.length * buttonHeight + (this.listMainMenu.length - 1) * buttonMargin;
        const startY = (canvasHeight - totalHeight) / 2;

        this.listMainMenu.forEach((item, index) => {
            const button = {
                x: (canvasWidth - buttonWidth) / 2,
                y: startY + index * (buttonHeight + buttonMargin),
                width: buttonWidth,
                height: buttonHeight,
                name: item.name,
                func: item.func,
                defaultColor: '#007BFF',
                hoverColor: '#0056b3',
                activeColor: '#003d80',
                borderRadius: 10 // радиус закругления уголков
            };
            this.buttons.push(button);
        });

        this.draw();
    }

    draw() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        // Фон для всего canvas
        this.ctx.fillStyle = '#f0f0f0'; // цвет фона
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        this.buttons.forEach((button, index) => {
            // Рисуем кнопку с закругленными углами
            this.ctx.fillStyle = (this.pressedIndex === index) ? button.activeColor :
                                 (this.hoveredIndex === index) ? button.hoverColor : button.defaultColor;
            this.roundRect(button.x, button.y, button.width, button.height, button.borderRadius);
            this.ctx.fill();

            // Рисуем текст на кнопке
            this.ctx.fillStyle = '#FFFFFF'; // цвет текста
            this.ctx.font = `${(this.textSizePercent / 100) * canvasHeight}px Arial`; // размер текста
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(button.name, button.x + button.width / 2, button.y + button.height / 2);
        });
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y+ radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    addEventListeners() {
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
    }
    clearCanvas() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    removeEventListeners() {
        // Удаляем все EventListener
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseMove(event) {
        const mousePos = this.getMousePos(event);
        this.hoveredIndex = this.buttons.findIndex(button =>
            mousePos.x >= button.x && mousePos.x <= button.x + button.width &&
            mousePos.y >= button.y && mousePos.y <= button.y + button.height
        );
        this.draw();
    }

    handleMouseDown(event) {
        const mousePos = this.getMousePos(event);
        const index = this.buttons.findIndex(button =>
            mousePos.x >= button.x && mousePos.x <= button.x + button.width &&
            mousePos.y >= button.y && mousePos.y <= button.y + button.height
        );
        if (index !== -1) {
            this.pressedIndex = index;
            this.draw();
        }
    }

    handleMouseUp(event) {
        const mousePos = this.getMousePos(event);
        if (this.pressedIndex !== -1) {
            const button = this.buttons[this.pressedIndex];
            if (mousePos.x >= button.x && mousePos.x <= button.x + button.width &&
                mousePos.y >= button.y && mousePos.y <= button.y + button.height) {
                button.func(); // вызываем функцию кнопки
            }
        }
        this.pressedIndex = -1;
    }

    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
}

class GameMenu {
  constructor(game) {
    this.game = game
    // this.document = game.document
    this.gameContainer = game.gameContainer
    this.createCanvas()
    this.listGameMenu = [
        { "name": "Exit", "func": () => this.game.exitGame(), "src": "path"},
        { "name": "Restart", "func": () => this.game.startGame('restart'), "src": "path" },
    ];
    this.buttonWidth = 30;
    this.buttonHeight = 30;
    this.buttonSpacing = 20;
    this.hoveredButton = null;
    this.init();
  };
  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'gameMenu';
    this.canvas.width = 800
    this.canvas.height = 50
    this.gameContainer.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d');
    this.ctx.fillStyle = 'black'; // цвет фона
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  };

  init() {
      this.canvas.width = this.game.canvas.width
      this.canvas.height = this.buttonHeight + 20;
      this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
      this.canvas.addEventListener('click', (e) => this.onClick(e));
      this.drawButtons();
  };

  drawButtons() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = '#f0f0f0'; // цвет фона
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.listGameMenu.forEach((button, index) => {
        // const x = index * (this.buttonWidth + this.buttonSpacing);// начало слева
          const x = -50 + this.canvas.width - (index * (this.buttonWidth + this.buttonSpacing));// начало справа
          const y = 10;
          const isHovered = this.hoveredButton === index;
          this.drawButton(x, y, button.name, isHovered);
      });
  };

  drawButton(x, y, name, isActive) {
      const radius = 10;
      this.ctx.fillStyle = isActive ? '#aaa' : 'white';
      this.ctx.beginPath();
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + this.buttonWidth - radius, y);
      this.ctx.quadraticCurveTo(x + this.buttonWidth, y, x + this.buttonWidth, y + radius);
      this.ctx.lineTo(x + this.buttonWidth, y + this.buttonHeight - radius);
      this.ctx.quadraticCurveTo(x + this.buttonWidth, y + this.buttonHeight, x + this.buttonWidth - radius, y + this.buttonHeight);
      this.ctx.lineTo(x + radius, y + this.buttonHeight);
      this.ctx.quadraticCurveTo(x, y + this.buttonHeight, x, y + this.buttonHeight - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.fillText(name, x + 10, y + this.buttonHeight / 2 + 5);
  };

  onMouseMove(e) {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      this.hoveredButton = null;

      this.listGameMenu.forEach((_, index) => {
          // const x = index * (this.buttonWidth + this.buttonSpacing);
          const x = -50 + this.canvas.width - (index * (this.buttonWidth + this.buttonSpacing));
          if (mouseX >= x && mouseX <= x + this.buttonWidth && mouseY >= 10 && mouseY <= 10 + this.buttonHeight) {
              this.hoveredButton = index;
          }
      });

      this.drawButtons();
  };

  onClick(e) {
      if (this.hoveredButton !== null) {
          const button = this.listGameMenu[this.hoveredButton];
          if (button.func) {
              button.func();
          }
          this.drawButtons(); // Перерисовываем для обновления состояния
      }
  };
  remove(){
    // Проверим, существует ли canvas
    if (this.canvas) {
        this.canvas.parentNode.removeChild(this.canvas); // Удалим canvas из родительского элемента

    } else {
        console.log('gameMenu не найдено');
    }
  };
}
