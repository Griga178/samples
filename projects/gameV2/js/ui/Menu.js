/**
 * Класс управления меню игры
 */
class Menu {
    constructor(game, modalManager) {
        this.game = game;
        this.modalManager = modalManager;
        this.init();
    }

    /**
     * Инициализация меню
     */
    init() {
        // Кнопки
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.exitButton = document.getElementById('exitButton');

        // Модальное окно настроек
        this.settingsModal = document.getElementById('settingsModal');
        this.saveButton = document.getElementById('saveButton');
        this.closeSettingsButton = document.getElementById('closeSettingsButton');

        // Поля ввода
        this.circlesAmountInput = document.getElementById('circlesAmount');
        this.radiusInput = document.getElementById('radius');
        this.distanceInput = document.getElementById('distance');

        // Обработчики событий
        this.setupEventListeners();

        // Заполняем поля настроек
        this.populateSettings();
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Кнопка "Начать"
        if (this.startButton) {
            this.startButton.addEventListener('click', () => {
                this.game.startGame();
                this.showGameButtons();
            });
        }

        // Кнопка "Обновить"
        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => {
                this.game.restart();
            });
        }

        // Кнопка "Настройки"
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => {
                this.modalManager.open('settings');
            });
        }

        // Кнопка "Выход"
        if (this.exitButton) {
            this.exitButton.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите выйти из игры?')) {
                    this.game.exitGame();
                    this.showMenuButtons();
                }
            });
        }

        // Кнопка "Сохранить" в настройках
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => {
                const circlesAmount = parseInt(this.circlesAmountInput.value) || 6;
                const radius = parseFloat(this.radiusInput.value) || 25;
                const distance = parseFloat(this.distanceInput.value) || 150;

                this.game.saveSettings(circlesAmount, radius, distance);
                this.modalManager.close('settings');

                alert(`Настройки сохранены!\nКоличество: ${circlesAmount}\nРадиус: ${radius}px\nДистанция: ${distance}px`);
            });
        }

        // Кнопка "Отмена" в настройках
        if (this.closeSettingsButton) {
            this.closeSettingsButton.addEventListener('click', () => {
                this.modalManager.close('settings');
            });
        }
    }

    /**
     * Заполняет поля настроек текущими значениями
     */
    populateSettings() {
        if (this.circlesAmountInput) {
            this.circlesAmountInput.value = this.game.settings.circlesAmount;
        }
        if (this.radiusInput) {
            this.radiusInput.value = this.game.settings.radius;
        }
        if (this.distanceInput) {
            this.distanceInput.value = this.game.settings.distance;
        }
    }

    /**
     * Показывает кнопки для игры
     */
    showGameButtons() {
        if (this.startButton) this.startButton.style.display = 'none';
        if (this.settingsButton) this.settingsButton.style.display = 'none';
        if (this.restartButton) this.restartButton.style.display = 'block';
        if (this.exitButton) this.exitButton.style.display = 'block';
    }

    /**
     * Показывает кнопки меню
     */
     showMenuButtons() {
         if (this.restartButton) this.restartButton.style.display = 'none';
         if (this.exitButton) this.exitButton.style.display = 'none';
         if (this.startButton) this.startButton.style.display = 'block';
         if (this.settingsButton) this.settingsButton.style.display = 'block';

         // Обновляем отображение настроек
         this.updateSettingsDisplay();
     }

    /**
     * Обновляет отображение настроек
     */
    updateSettingsDisplay() {
        this.populateSettings();
    }
}
