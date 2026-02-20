import { INTERFACE_COLORS } from '../../config/gameConfig.js';

/**
 * Класс для управления стилями интерфейса
 */
class StyleManager {
    constructor() {
        this.colorScheme = INTERFACE_COLORS;
        this.styleElements = [];
    }

    /**
     * Применяет цветовую схему к элементам
     */
    applyColorScheme() {
        const styles = [
            {
                selector: '.container',
                styles: {
                    backgroundColor: this.colorScheme.containerBg
                }
            },
            {
                selector: '#settingsWindow',
                styles: {
                    backgroundColor: this.colorScheme.containerBg
                }
            },
            {
                selector: '#gameContainer',
                styles: {
                    backgroundColor: this.colorScheme.divBorderColor
                }
            },
            {
                selector: '#gameMenu',
                styles: {
                    backgroundColor: this.colorScheme.divBg,
                    borderTopColor: this.colorScheme.divBorderColor
                }
            },
            {
                selector: '#scoreBoard',
                styles: {
                    backgroundColor: this.colorScheme.divBg,
                    borderLeftColor: this.colorScheme.divBorderColor
                }
            },
            {
                selector: 'table',
                styles: {
                    backgroundColor: this.colorScheme.tableBg,
                    color: this.colorScheme.tableText
                }
            },
            {
                selector: 'th',
                styles: {
                    backgroundColor: this.colorScheme.tableHeaderBg,
                    color: this.colorScheme.tableHeaderText
                }
            },
            {
                selector: '.button',
                styles: {
                    backgroundColor: this.colorScheme.btnBg,
                    color: this.colorScheme.btnText
                }
            }
        ];

        styles.forEach(style => {
            const elements = document.querySelectorAll(style.selector);
            elements.forEach(element => {
                Object.entries(style.styles).forEach(([property, value]) => {
                    element.style[property] = value;
                });
            });
        });
    }

    /**
     * Создает и вставляет кастомные стили
     */
    injectCustomStyles(cssString) {
        const style = document.createElement('style');
        style.textContent = cssString;
        document.head.appendChild(style);
        this.styleElements.push(style);
        return style;
    }

    /**
     * Удаляет все вставленные стили
     */
    clearCustomStyles() {
        this.styleElements.forEach(style => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        });
        this.styleElements = [];
    }

    /**
     * Обновляет цветовую схему
     */
    updateColorScheme(newScheme) {
        this.colorScheme = { ...this.colorScheme, ...newScheme };
        this.applyColorScheme();
    }

    /**
     * Возвращает текущую цветовую схему
     */
    getColorScheme() {
        return this.colorScheme;
    }
}

// Экспортируем синглтон
const styleManager = new StyleManager();

// Автоматически применяем стили при загрузке
document.addEventListener('DOMContentLoaded', () => {
    styleManager.applyColorScheme();
});
