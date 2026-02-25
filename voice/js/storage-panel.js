// ===== Инициализация панели =====
class StoragePanel {
    constructor(containerId, storage) {
        this.container = document.getElementById(containerId);
        this.storage = storage;
        this.activeId = null;
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
    }

    render() {
        const listEl = this.container.querySelector('#recordList');
        const records = this.storage.getAllRecords();
        if (records.length === 0) {
            listEl.innerHTML = '<div class="empty-message">Нет записей</div>';
            return;
        }

        listEl.innerHTML = records.map(record => `
            <div class="record-item ${this.activeId === record.id ? 'active' : ''}" data-id="${record.id}">
                <span class="record-info" title="${record.filename}">${record.filename}</span>
                <div class="record-actions">
                    <button class="play" data-id="${record.id}">▶️ Play</button>
                    <button class="download" data-id="${record.id}">⬇️ Download</button>
                    <button class="delete" data-id="${record.id}">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    attachEvents() {
        const listEl = this.container.querySelector('#recordList');

        // Делегирование событий
        listEl.addEventListener('click', (e) => {
            const recordItem = e.target.closest('.record-item');
            if (!recordItem) return;

            const id = parseInt(recordItem.dataset.id);

            // Если клик по кнопке
            if (e.target.classList.contains('play')) {
                e.stopPropagation();
                this.playRecord(id);
            } else if (e.target.classList.contains('download')) {
                e.stopPropagation();
                this.downloadRecord(id);
            } else if (e.target.classList.contains('delete')) {
                e.stopPropagation();
                this.deleteRecord(id);
            } else {
                // Клик по самому элементу (не по кнопке)
                this.setActive(id);
            }
        });
    }

    setActive(id) {
        this.activeId = id;
        this.render();
    }

    playRecord(id) {
        const blob = this.storage.getBlob(id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.play();
            // Освобождаем URL после воспроизведения
            audio.onended = () => URL.revokeObjectURL(url);
        } else {
            alert('Blob не найден');
        }
    }

    downloadRecord(id) {
        const blob = this.storage.getBlob(id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.storage.getAllRecords().find(r => r.id === id).filename || `record_${id}.webm`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            alert('Blob не найден');
        }
    }

    deleteRecord(id) {
        if (this.storage.deleteRecord(id)) {
            if (this.activeId === id) this.activeId = null;
            this.render();
        }
    }
}
