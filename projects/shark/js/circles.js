// для учета скорости мыши
let lastX = 0;
let lastY = 0;
let lastTime = Date.now();
let mouseSpeed = 0

document.addEventListener('mousemove', (event) => {
  let currentX = event.clientX;
  let currentY = event.clientY;
  let currentTime = Date.now();

  let distance = Math.sqrt((currentX - lastX) ** 2 + (currentY - lastY) ** 2);
  let timeElapsed = (currentTime - lastTime) / 1000; // переводим в секунды

  if (timeElapsed > 0) {
      mouseSpeed = distance / timeElapsed; // скорость в пикселях в секунду
      // console.log(`Скорость мыши: ${mouseSpeed.toFixed(2)} пикселей в секунду`);
  }
  lastX = currentX;
  lastY = currentY;
  lastTime = currentTime;
});

  const svgContainer = document.getElementById('svg-container');

  function removeElement(element) {
      element.remove(); // Удаляет элемент из DOM
  }
  function createRandomSvg() {

      const svgItem = document.createElement('div');
      svgItem.classList.add('svg-item');
      // рандомный выбор из списка фигур
      svgItem.innerHTML = `<img src="img/elipse.svg" alt="кружок" onclick="removeElement(this)">`
      const sides = Math.floor(Math.random() * 200) + 50; // стороны от 100 до 300
      svgItem.style.width = `${sides}px`;
      svgItem.style.height = `${sides}px`;

      // рандомое определение места в контейнере
      const initialX = Math.random() * (svgContainer.clientWidth - 50);
      const initialY = Math.random() * (svgContainer.clientHeight - 50);
      svgItem.style.left = `${initialX}px`;
      svgItem.style.top = `${initialY}px`;

      let velocityX = 0;
      let velocityY = 0;
      let rotateAngel = 0;
      let rotation = 0

      svgItem.addEventListener('mouseover', (event) => {
          const rect = svgItem.getBoundingClientRect();
          const svgX = rect.left + rect.width / 2;
          const svgY = rect.top + rect.height / 2;
          const mouseX = event.clientX;
          const mouseY = event.clientY;

          const deltaX = svgX - mouseX;
          const deltaY = svgY - mouseY;
          const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2); // расстояние
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI); // угол в градусах

          if (distance !== 0) {
              velocityX = (deltaX / distance) * mouseSpeed / 200;
              velocityY = (deltaY / distance) * mouseSpeed / 200;
              rotateAngel = angle / 100

          }
      });

      function update() {
          const rect = svgItem.getBoundingClientRect();
          let left = parseFloat(svgItem.style.left) + velocityX;
          let top = parseFloat(svgItem.style.top) + velocityY;

          let isMoving = false;

          if (left <= 0 || left >= svgContainer.clientWidth - 50) {
              velocityX *= -1;
              left = Math.max(0, Math.min(left, svgContainer.clientWidth - 50));
              isMoving = true;
          }
          if (top <= 0 || top >= svgContainer.clientHeight - 50) {
              velocityY *= -1;
              top = Math.max(0, Math.min(top, svgContainer.clientHeight - 50));
              isMoving = true;
          }

          svgItem.style.left = `${left}px`;
          svgItem.style.top = `${top}px`;

          // Вращение только при движении
          if (velocityX > 0.01 || velocityY > 0.01) {
              rotation += rotateAngel; // Увеличиваем угол вращения при движении
              svgItem.style.transform = `rotate(${rotation}deg)`;
          }

          // Замедление инерции перемещения svgItem
          velocityX *= 0.98;
          velocityY *= 0.98;

          requestAnimationFrame(update);
      }

      svgContainer.appendChild(svgItem); // Добавляем элемент в контейнер
      update();
  }

  for (let i = 0; i < 10; i++) {
      createRandomSvg();
  }
