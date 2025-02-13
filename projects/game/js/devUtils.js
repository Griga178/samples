
function drawPt(ctx, mouseCoords, color, r) {
  color = color || 'red';
  const radius = r || 5;
  // Устанавливаем цвет
  ctx.fillStyle = color;
  // Рисуем точку (круг) радиусом 5 пикселей
  ctx.beginPath();
  ctx.arc(mouseCoords.x, mouseCoords.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}
