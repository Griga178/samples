/**
 * Класс для работы с таблицей результатов
 */
class ResultsTable {
    constructor(tableId = 'scoreTable') {
        this.table = document.getElementById(tableId);
        this.tbody = this.table ? this.table.querySelector('tbody') : null;
        this.rowCount = 0;
    }

    /**
     * Добавляет строку в таблицу
     */
    addRow(data) {
        if (!this.tbody) return;

        this.rowCount++;

        const row = document.createElement('tr');

        // Номер
        const numCell = document.createElement('td');
        numCell.textContent = this.rowCount;
        row.appendChild(numCell);

        // Время
        const timeCell = document.createElement('td');
        timeCell.textContent = data.time || '0.00с';
        row.appendChild(timeCell);

        // Плавность
        const smoothnessCell = document.createElement('td');
        smoothnessCell.textContent = data.smoothness || '0%';
        row.appendChild(smoothnessCell);

        // Точность
        const accuracyCell = document.createElement('td');
        accuracyCell.textContent = data.accuracy || '0%';
        row.appendChild(accuracyCell);

        // Отклонение
        const deviationCell = document.createElement('td');
        deviationCell.textContent = data.deviation || '0px';
        row.appendChild(deviationCell);

        this.tbody.appendChild(row);
        this.highlightRow(row);
    }

    /**
     * Подсвечивает строку
     */
    highlightRow(row) {
        row.style.backgroundColor = 'rgba(6, 182, 212, 0.3)';
        setTimeout(() => {
            row.style.backgroundColor = '';
        }, 1500);
    }

    /**
     * Очищает таблицу
     */
    clear() {
        if (this.tbody) {
            this.tbody.innerHTML = '';
        }
        this.rowCount = 0;
    }

    /**
     * Обновляет таблицу данными
     */
    update(dataArray) {
        this.clear();
        dataArray.forEach(data => this.addRow(data));
    }

    /**
     * Возвращает все строки
     */
    getRows() {
        return this.tbody ? Array.from(this.tbody.querySelectorAll('tr')) : [];
    }
}
