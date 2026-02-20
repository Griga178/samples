/**
 * Класс для анализа результатов игры
 */
 class Analyzer {
     constructor() {
         this.results = [];
         this.tableBody = null;
         this.bestAccuracy = 0;
         this.bestAccuracyElement = null;
         this.initTable();
         this.loadBestAccuracy();
     }

     /**
      * Инициализация таблицы результатов
      */
     initTable() {
         const table = document.getElementById('scoreTable');
         if (table) {
             this.tableBody = table.querySelector('tbody');
             if (!this.tableBody) {
                 this.tableBody = document.createElement('tbody');
                 table.appendChild(this.tableBody);
             }
         }

         // Находим элемент для отображения лучшего результата
         this.bestAccuracyElement = document.querySelector('.stat-value');
     }

     /**
      * Вычисляет расстояние, время и скорость между двумя точками
      */
     calculateMetrics(point1, point2) {
         const dx = point2.x - point1.x;
         const dy = point2.y - point1.y;
         const distance = Math.sqrt(dx * dx + dy * dy);
         const timeDiff = point2.time - point1.time;
         const speed = timeDiff > 0 ? distance / timeDiff : 0;

         return {
             distance,
             speed,
             timeDiff
         };
     }

     /**
      * Удаляет дубликаты точек с одинаковыми координатами и временем
      */
     reducePoints(points) {
         let i = 0;
         while (i < points.length - 1) {
             const point1 = points[i];
             const point2 = points[i + 1];

             const { timeDiff } = this.calculateMetrics(point1, point2);

             if (timeDiff === 0) {
                 points.splice(i + 1, 1);
                 i = 0;
             } else {
                 i++;
             }
         }
         return points;
     }

     /**
      * Анализирует движение и вычисляет метрики
      */
     analyzeMovement(movement) {
         if (movement.length < 2) {
             return null;
         }

         // Удаляем дубликаты
         movement = this.reducePoints(movement);

         // Общие метрики
         const total = this.calculateMetrics(movement[0], movement[movement.length - 1]);

         // Вычисляем плавность движения
         let smoothnessScore = 0;
         let totalDeviation = 0;
         let accuracyScore = 100;

         for (let i = 0; i < movement.length - 1; i++) {
             const instant = this.calculateMetrics(movement[i], movement[i + 1]);
             smoothnessScore += Math.abs(total.speed - instant.speed);

             // Вычисляем отклонение от прямой линии
             if (i > 0 && i < movement.length - 1) {
                 const deviation = this.calculateDeviation(
                     movement[0],
                     movement[movement.length - 1],
                     movement[i]
                 );
                 totalDeviation += deviation;
             }
         }

         // Вычисляем точность (чем меньше отклонение, тем выше точность)
         if (movement.length > 2) {
             const avgDeviation = totalDeviation / (movement.length - 2);
             accuracyScore = Math.max(0, 100 - (avgDeviation * 2));
         }

         return {
             time: total.timeDiff,
             averageSpeed: total.speed,
             smoothnessScore: smoothnessScore,
             accuracy: accuracyScore.toFixed(1),
             deviation: (totalDeviation / (movement.length - 2) || 0).toFixed(1)
         };
     }

     /**
      * Вычисляет отклонение точки от прямой линии
      */
     calculateDeviation(start, end, point) {
         // Формула расстояния от точки до прямой
         const dx = end.x - start.x;
         const dy = end.y - start.y;
         const distance = Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x);
         const lineLength = Math.sqrt(dx * dx + dy * dy);

         return lineLength > 0 ? distance / lineLength : 0;
     }

     /**
      * Добавляет результат в таблицу
      */
     appendRow(movement) {
         const analysis = this.analyzeMovement(movement);
         if (!analysis) return;

         const rowNumber = this.results.length + 1;
         this.results.push(analysis);

         // Создаем новую строку
         const newRow = document.createElement('tr');

         // Ячейка номера
         const numCell = document.createElement('td');
         numCell.textContent = rowNumber;
         newRow.appendChild(numCell);

         // Ячейка времени
         const timeCell = document.createElement('td');
         timeCell.textContent = `${(analysis.time / 1000).toFixed(2)}с`;
         newRow.appendChild(timeCell);

         // Ячейка плавности
         const smoothnessCell = document.createElement('td');
         // const smoothnessPercent = Math.max(0, 100 - (analysis.smoothnessScore / 1000));
         const smoothnessPercent = analysis.smoothnessScore
         smoothnessCell.textContent = `${smoothnessPercent.toFixed(0)}%`;
         newRow.appendChild(smoothnessCell);

         // Ячейка точности
         const accuracyCell = document.createElement('td');
         accuracyCell.textContent = `${analysis.accuracy}%`;
         newRow.appendChild(accuracyCell);

         // Ячейка отклонения
         const deviationCell = document.createElement('td');
         deviationCell.textContent = `${analysis.deviation}px`;
         newRow.appendChild(deviationCell);

         // Добавляем строку в таблицу
         if (this.tableBody) {
             this.tableBody.appendChild(newRow);
             this.highlightRow(newRow);
         }

         // Проверяем и обновляем рекорд по точности
         this.updateBestAccuracy(analysis.accuracy);
     }

     /**
      * Подсвечивает новую строку
      */
     highlightRow(row) {
         row.style.backgroundColor = 'rgba(6, 182, 212, 0.3)';
         setTimeout(() => {
             row.style.backgroundColor = '';
         }, 1500);
     }

     /**
      * Вычисляет общую статистику по всем результатам
      */
     calculateOverallStats() {
         if (this.results.length === 0) return null;

         let totalTime = 0;
         let totalSmoothness = 0;
         let totalAccuracy = 0;
         let totalDeviation = 0;

         this.results.forEach(result => {
             totalTime += result.time;
             totalSmoothness += Math.max(0, 100 - (result.smoothnessScore / 1000));
             totalAccuracy += parseFloat(result.accuracy);
             totalDeviation += parseFloat(result.deviation);
         });

         const count = this.results.length;

         return {
             avgTime: (totalTime / count),
             avgSmoothness: (totalSmoothness / count),
             avgAccuracy: (totalAccuracy / count),
             avgDeviation: (totalDeviation / count),
             totalSteps: count
         };
     }

     /**
      * Добавляет итоговую строку в таблицу
      */
     appendSummaryRow() {
       const stats = this.calculateOverallStats();
       if (!stats) return;

       // Создаем разделитель
       const separatorRow = document.createElement('tr');
       separatorRow.innerHTML = `<td colspan="5"><div style="height: 2px; background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.6), transparent); margin: 8px 0;"></div></td>`;
       if (this.tableBody) {
           this.tableBody.appendChild(separatorRow);
       }

       // Создаем итоговую строку
       const summaryRow = document.createElement('tr');
       summaryRow.className = 'summary-row';
       summaryRow.style.cssText = `
           background: linear-gradient(120deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15));
           font-weight: 700;
           box-shadow: inset 0 -3px 10px rgba(0, 0, 0, 0.1);
           position: sticky;
           bottom: 0;
           z-index: 10;
       `;

       // Ячейка "Итого"
       const totalCell = document.createElement('td');
       totalCell.innerHTML = `<span style="display: inline-block; background: linear-gradient(120deg, #10b981, #059669); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 800;">Σ ИТОГО</span>`;
       summaryRow.appendChild(totalCell);

       // Ячейка среднего времени
       const avgTimeCell = document.createElement('td');
       avgTimeCell.innerHTML = `<span style="color: #06b6d4; font-weight: 600;">${(stats.avgTime / 1000).toFixed(2)}с</span>`;
       summaryRow.appendChild(avgTimeCell);

       // Ячейка средней плавности
       const avgSmoothnessCell = document.createElement('td');
       avgSmoothnessCell.innerHTML = `<span style="color: #10b981; font-weight: 600;">${stats.avgSmoothness.toFixed(0)}%</span>`;
       summaryRow.appendChild(avgSmoothnessCell);

       // Ячейка средней точности
       const avgAccuracyCell = document.createElement('td');
       avgAccuracyCell.innerHTML = `<span style="color: #f59e0b; font-weight: 600;">${stats.avgAccuracy.toFixed(1)}%</span>`;
       summaryRow.appendChild(avgAccuracyCell);

       // Ячейка среднего отклонения
       const avgDeviationCell = document.createElement('td');
       avgDeviationCell.innerHTML = `<span style="color: #ef4444; font-weight: 600;">${stats.avgDeviation.toFixed(1)}px</span>`;
       summaryRow.appendChild(avgDeviationCell);

       // Добавляем итоговую строку в таблицу
       if (this.tableBody) {
           this.tableBody.appendChild(summaryRow);
       }

       // Показываем уведомление о завершении игры
       this.showGameCompleteNotification(stats);
     }

     /**
      * Показывает уведомление о завершении игры
      */
     showGameCompleteNotification(stats) {
         const notification = document.createElement('div');
         notification.style.cssText = `
             position: fixed;
             top: 20px;
             right: 20px;
             background: linear-gradient(120deg, #10b981, #059669);
             color: white;
             padding: 20px 30px;
             border-radius: 16px;
             box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
             z-index: 10000;
             transform: translateX(400px);
             opacity: 0;
             transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
         `;

         notification.innerHTML = `
             <div style="display: flex; align-items: center; gap: 12px;">
                 <span style="font-size: 28px;">🎉</span>
                 <div>
                     <div style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">Игра завершена!</div>
                     <div style="font-size: 14px; opacity: 0.9;">
                         ${stats.totalSteps} шагов | Точность: ${stats.avgAccuracy.toFixed(1)}%
                     </div>
                 </div>
             </div>
         `;

         document.body.appendChild(notification);

         // Анимация появления
         setTimeout(() => {
             notification.style.transform = 'translateX(0)';
             notification.style.opacity = '1';
         }, 100);

         // Автоматическое скрытие через 5 секунд
         setTimeout(() => {
             notification.style.transform = 'translateX(400px)';
             notification.style.opacity = '0';
             setTimeout(() => {
                 if (notification.parentNode) {
                     notification.parentNode.removeChild(notification);
                 }
             }, 500);
         }, 5000);
     }

     /**
      * Обновляет рекорд по точности
      */
     updateBestAccuracy(newAccuracy) {
         const accuracyValue = parseFloat(newAccuracy);

         if (accuracyValue > this.bestAccuracy) {
             this.bestAccuracy = accuracyValue;
             this.saveBestAccuracy();
             this.displayBestAccuracy();

             // Показываем уведомление о новом рекорде
             if (this.results.length > 1) {
                 this.showNewRecordNotification(accuracyValue);
             }
         }
     }

     /**
      * Показывает уведомление о новом рекорде
      */
     showNewRecordNotification(newAccuracy) {
         const notification = document.createElement('div');
         notification.style.cssText = `
             position: fixed;
             top: 20px;
             left: 50%;
             transform: translateX(-50%) translateY(-100px);
             background: linear-gradient(120deg, #f59e0b, #d97706);
             color: white;
             padding: 15px 30px;
             border-radius: 12px;
             box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
             z-index: 10000;
             opacity: 0;
             transition: all 0.4s ease;
             font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
             text-align: center;
             font-weight: 600;
             font-size: 16px;
         `;

         notification.innerHTML = `
             <span style="font-size: 24px; margin-right: 8px;">⭐</span>
             Новый рекорд по точности: ${newAccuracy.toFixed(1)}%
         `;

         document.body.appendChild(notification);

         // Анимация появления
         setTimeout(() => {
             notification.style.transform = 'translateX(-50%) translateY(0)';
             notification.style.opacity = '1';
         }, 100);

         // Автоматическое скрытие через 3 секунды
         setTimeout(() => {
             notification.style.transform = 'translateX(-50%) translateY(-100px)';
             notification.style.opacity = '0';
             setTimeout(() => {
                 if (notification.parentNode) {
                     notification.parentNode.removeChild(notification);
                 }
             }, 400);
         }, 3000);
     }

     /**
      * Отображает лучший результат на странице
      */
     displayBestAccuracy() {
         if (this.bestAccuracyElement) {
             this.bestAccuracyElement.textContent = `${this.bestAccuracy.toFixed(1)}%`;

             // Анимация обновления
             this.bestAccuracyElement.style.transform = 'scale(1.2)';
             this.bestAccuracyElement.style.color = '#f59e0b';
             setTimeout(() => {
                 this.bestAccuracyElement.style.transform = 'scale(1)';
                 this.bestAccuracyElement.style.color = '';
             }, 500);
         }
     }

     /**
      * Сохраняет лучший результат в localStorage
      */
     saveBestAccuracy() {
         try {
             localStorage.setItem('bestAccuracy', this.bestAccuracy.toString());
         } catch (e) {
             console.error('Ошибка сохранения рекорда:', e);
         }
     }

     /**
      * Загружает лучший результат из localStorage
      */
     loadBestAccuracy() {
         try {
             const saved = localStorage.getItem('bestAccuracy');
             if (saved) {
                 this.bestAccuracy = parseFloat(saved);
                 this.displayBestAccuracy();
             }
         } catch (e) {
             console.error('Ошибка загрузки рекорда:', e);
         }
     }

     /**
      * Очищает обычные строки, оставляя только итоговые
      */
     clearRegularRows() {
         if (!this.tableBody) return;

         // Сохраняем итоговые строки
         const summaryRows = [];
         const rows = this.tableBody.querySelectorAll('tr');

         rows.forEach(row => {
             if (row.querySelector('td[colspan]') ||
                 row.style.backgroundColor.includes('rgba(16, 185, 129') ||
                 row.textContent.includes('Σ Итого')) {
                 summaryRows.push(row.cloneNode(true));
             }
         });

         // Очищаем таблицу
         this.tableBody.innerHTML = '';

         // Восстанавливаем итоговые строки
         summaryRows.forEach(row => {
             this.tableBody.appendChild(row);
         });

         // Очищаем результаты
         this.results = [];
     }

     /**
      * Полностью очищает таблицу
      */
     clearTable() {
         if (this.tableBody) {
             this.tableBody.innerHTML = '';
         }
         this.results = [];
     }

     /**
      * Возвращает все результаты
      */
     getResults() {
         return this.results;
     }

     /**
      * Возвращает лучший результат
      */
     getBestResult() {
         if (this.results.length === 0) return null;

         return this.results.reduce((best, current) => {
             const currentScore = this.calculateScore(current);
             const bestScore = this.calculateScore(best);
             return currentScore > bestScore ? current : best;
         });
     }

     /**
      * Вычисляет общий балл на основе метрик
      */
     calculateScore(result) {
         const timeScore = 1000 / (result.time + 100); // чем быстрее, тем лучше
         const smoothnessScore = 100 - (result.smoothnessScore / 1000);
         const accuracyScore = parseFloat(result.accuracy);

         return (timeScore * 0.4) + (smoothnessScore * 0.3) + (accuracyScore * 0.3);
     }
 }
