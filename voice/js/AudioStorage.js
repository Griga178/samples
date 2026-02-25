/**
 * Класс для хранения записей звука в памяти.
 * Загружает файлы из указанного списка при инициализации.
 */
class AudioStorage {
    /**
     * Создаёт экземпляр хранилища и загружает записи из указанных файлов.
     * @param {string[]} fileNames - Массив имён файлов (например, ['rec1.webm', 'rec2.webm'])
     * @returns {<AudioStorage>} - экземпляр
    */
    constructor(fileNames) {
        this.records = [];        // Массив объектов { id: number, blob: Blob, filename: string }
        this.lastId = 0;
        this.basePath = 'records/';
        this.loadFileRecords(fileNames)
    }

    /**
     * Загружает файлы по списку и добавляет их в хранилище.
     * @param {string[]} fileNames
     * @param {string} basePath
     */
    async loadFileRecords(fileNames) {

        for (const filename of fileNames) {
            const id = ++this.lastId;
            this.records.push({
                id: id,
                filename: this.basePath + filename,
                blob: null  // Blob будет создан при необходимости
            });
        }
    }

    /**
     * Добавляет новую запись в хранилище.
     * @param {Blob} blob - Аудио-данные
     * @param {string} [filename] - Имя файла (опционально)
     * @returns {number} - ID новой записи
     */
    addRecord(blob, filename = null) {
        if (!(blob instanceof Blob)) {
            throw new Error('addRecord ожидает Blob');
        }
        const id = ++this.lastId;
        this.records.push({
            id: id,
            blob: blob,
            filename: filename || `record_${id}.webm`
        });
        return id;
    }

    /**
     * Возвращает запись по ID.
     * @param {number} id
     * @returns {Object|null} - Объект { id, blob, filename } или null
     */
    getRecord(id) {
        return this.records.find(record => record.id === id) || null;
    }

    /**
     * Возвращает Blob записи по ID.
     * @param {number} id
     * @returns {Promise<Blob|null>}
     */
    async getBlob(id) {
        const record = this.getRecord(id);
        if (!record) return null;

        // Если blob уже загружен, возвращаем его
        if (record.blob) return record.blob;

        // Если есть filename, пробуем загрузить файл
        if (record.filename) {
            try {
                const response = await fetch(record.filename);
                if (!response.ok) throw new Error('Файл не найден');
                record.blob = await response.blob();
                return record.blob;
            } catch (error) {
                console.error(`Ошибка загрузки файла ${record.filename}:`, error);
                return null;
            }
        }

        return null;
    }

    /**
     * Возвращает все записи.
     * @returns {Array}
     */
    getAllRecords() {
        return [...this.records];
    }

    /**
     * Возвращает количество записей.
     * @returns {number}
     */
    get count() {
        return this.records.length;
    }

    /**
     * Удаляет запись по ID.
     * @param {number} id
     * @returns {boolean} - true, если запись была удалена
     */
    deleteRecord(id) {
        const index = this.records.findIndex(record => record.id === id);
        if (index !== -1) {
            this.records.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Очищает все записи из памяти.
     */
    clearAll() {
        this.records = [];
        this.lastId = 0;
    }
}
