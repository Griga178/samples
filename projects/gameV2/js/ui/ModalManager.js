/**
 * Класс управления модальными окнами
 */
class ModalManager {
    constructor() {
        this.modals = {
            settings: document.getElementById('settingsModal'),
            rules: document.getElementById('rulesModal')
        };

        this.closeButtons = {
            settings: [
                document.getElementById('closeSettingsButton'),
                document.getElementById('closeModalButton')
            ],
            rules: [
                document.getElementById('closeRulesButton'),
                document.getElementById('closeRulesModalButton')
            ]
        };

        this.init();
    }

    /**
     * Инициализация
     */
    init() {
        this.setupModalListeners();
    }

    /**
     * Настройка обработчиков для модальных окон
     */
    setupModalListeners() {
        // Закрытие по клику на кнопки
        Object.entries(this.closeButtons).forEach(([modalName, buttons]) => {
            buttons.forEach(button => {
                if (button) {
                    button.addEventListener('click', () => this.close(modalName));
                }
            });
        });

        // Закрытие по клику вне окна
        Object.entries(this.modals).forEach(([modalName, modal]) => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.close(modalName);
                    }
                });
            }
        });

        // Закрытие по клавише Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });
    }

    /**
     * Открывает модальное окно
     */
    open(modalName) {
        const modal = this.modals[modalName];
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Анимация появления контента
            setTimeout(() => {
                const modalWindow = modal.querySelector('[id$="Window"]');
                if (modalWindow) {
                    const items = modalWindow.querySelectorAll('li, input, button');
                    items.forEach((item, index) => {
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(10px)';
                        setTimeout(() => {
                            item.style.transition = 'opacity 0.3s ease, transform 0.4s ease';
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 100 + index * 50);
                    });
                }
            }, 100);
        }
    }

    /**
     * Закрывает модальное окно
     */
    close(modalName) {
        const modal = this.modals[modalName];
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Закрывает все модальные окна
     */
    closeAll() {
        Object.values(this.modals).forEach(modal => {
            if (modal) {
                modal.style.display = 'none';
            }
        });
        document.body.style.overflow = 'auto';
    }

    /**
     * Проверяет, открыто ли модальное окно
     */
    isOpen(modalName) {
        const modal = this.modals[modalName];
        return modal && modal.style.display === 'flex';
    }
}
