// ========================================
// ТЕМА КОНФИГУРАЦИЯ
// ========================================

const ThemeConfig = {
    // Текущая активная тема
    currentTheme: 'toggle-2',
    
    // Определения тем
    themes: {
        'toggle-1': {
            id: 'toggle-1',
            name: 'orange',
            border: 'orange',
            accent: 'orange',
            accentRgb: '255, 165, 0',
            hover: 'rgba(255, 165, 0, 0.15)',
            hoverStrong: 'rgba(255, 165, 0, 0.25)',
            textOnAccent: '#000',
            shadow: 'rgba(255, 165, 0, 0.4)',
            gradientStart: 'rgba(255, 165, 0, 0.2)',
            gradientEnd: 'rgba(255, 165, 0, 0.05)'
        },
        'toggle-2': {
            id: 'toggle-2',
            name: 'green',
            border: 'rgb(163, 230, 53)',
            accent: 'rgb(163, 230, 53)',
            accentRgb: '163, 230, 53',
            hover: 'rgba(163, 230, 53, 0.15)',
            hoverStrong: 'rgba(163, 230, 53, 0.25)',
            textOnAccent: '#000',
            shadow: 'rgba(163, 230, 53, 0.4)',
            gradientStart: 'rgba(163, 230, 53, 0.2)',
            gradientEnd: 'rgba(163, 230, 53, 0.05)'
        },
        'toggle-3': {
            id: 'toggle-3',
            name: 'blue',
            border: 'rgb(14, 165, 233)',
            accent: 'rgb(14, 165, 233)',
            accentRgb: '14, 165, 233',
            hover: 'rgba(14, 165, 233, 0.15)',
            hoverStrong: 'rgba(14, 165, 233, 0.25)',
            textOnAccent: '#fff',
            shadow: 'rgba(14, 165, 233, 0.4)',
            gradientStart: 'rgba(14, 165, 233, 0.2)',
            gradientEnd: 'rgba(14, 165, 233, 0.05)'
        }
    },
    
    // CSS переменные для маппинга
    cssVariables: [
        '--border-clr',
        '--theme-accent',
        '--theme-accent-rgb',
        '--theme-hover',
        '--theme-hover-strong',
        '--theme-text-on-accent',
        '--theme-shadow',
        '--theme-gradient-start',
        '--theme-gradient-end'
    ],
    
    // Маппинг свойств: свойство темы -> CSS переменная
    propertyMapping: {
        'border': '--border-clr',
        'accent': '--theme-accent',
        'accentRgb': '--theme-accent-rgb',
        'hover': '--theme-hover',
        'hoverStrong': '--theme-hover-strong',
        'textOnAccent': '--theme-text-on-accent',
        'shadow': '--theme-shadow',
        'gradientStart': '--theme-gradient-start',
        'gradientEnd': '--theme-gradient-end'
    },
    
    /**
     * Применить тему к корневому элементу
     * @param {string} themeId - ID темы для применения
     */
    applyTheme(themeId) {
        const theme = this.themes[themeId];
        if (!theme) {
            console.error(`Тема не найдена: ${themeId}`);
            return;
        }
        
        const root = document.documentElement;
        
        // Применить все маппинги свойств
        Object.entries(this.propertyMapping).forEach(([prop, cssVar]) => {
            if (theme[prop] !== undefined) {
                root.style.setProperty(cssVar, theme[prop]);
            }
        });
        
        this.currentTheme = themeId;
        console.log(`Тема применена: ${theme.name} (${themeId})`);
        
        // Отправить событие для других скриптов
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: {
                themeId: themeId,
                theme: theme
            }
        }));
    },
    
    /**
     * Получить текущий объект темы
     * @returns {Object} Текущая конфигурация темы
     */
    getCurrentTheme() {
        return this.themes[this.currentTheme];
    },
    
    /**
     * Добавить новую тему динамически
     * @param {string} id - ID темы
     * @param {Object} config - Конфигурация темы
     */
    addTheme(id, config) {
        this.themes[id] = {
            id: id,
            name: config.name || id,
            border: config.border || '#fff',
            accent: config.accent || '#fff',
            accentRgb: config.accentRgb || '255, 255, 255',
            hover: config.hover || 'rgba(255, 255, 255, 0.15)',
            hoverStrong: config.hoverStrong || 'rgba(255, 255, 255, 0.25)',
            textOnAccent: config.textOnAccent || '#000',
            shadow: config.shadow || 'rgba(255, 255, 255, 0.4)',
            gradientStart: config.gradientStart || 'rgba(255, 255, 255, 0.2)',
            gradientEnd: config.gradientEnd || 'rgba(255, 255, 255, 0.05)'
        };
        console.log(`Новая тема добавлена: ${id}`);
    },
    
    /**
     * Получить все доступные имена CSS переменных
     * @returns {Array} Список имен CSS переменных
     */
    getCSSVariables() {
        return this.cssVariables;
    }
};

// ============================================
// РАЗНОЦВЕТНЫЕ ИКОНКИ ПРИ НАВЕДЕНИИ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Ждем небольшую задержку для полной загрузки DOM
    setTimeout(() => {
        const navItems = document.querySelectorAll('.nav-item a');
        
        // Палитра ярких цветов
        const colors = [
            '#FF6B6B', '#FF4757', '#FF8A5C', '#FF6348', '#FF9F43',
            '#FECA57', '#FFD93D', '#00B894', '#00CEC9', '#55EFC4',
            '#0984E3', '#45B7D1', '#74B9FF', '#6C5CE7', '#A29BFE',
            '#7BED9F', '#70A1FF', '#FFAF40', '#FF4D4D', '#D980FA',
            '#FD79A8', '#E17055', '#00CEC9', '#6C5CE7', '#FDCB6E'
        ];
        
        let lastColor = null;
        let lastColor2 = null;
        
        function getRandomColor() {
            return colors[Math.floor(Math.random() * colors.length)];
        }
        
        function getUniqueRandomColor() {
            let newColor;
            let attempts = 0;
            do {
                newColor = getRandomColor();
                attempts++;
                if (attempts > 50) break;
            } while (newColor === lastColor || newColor === lastColor2);
            
            lastColor2 = lastColor;
            lastColor = newColor;
            return newColor;
        }
        
        navItems.forEach(item => {
            const icon = item.querySelector('.nav-icon');
            const text = item.querySelector('.nav-text');
            
            if (!icon && !text) return;
            
            item.addEventListener('mouseenter', function(e) {
                const color = getUniqueRandomColor();
                
                // Анимируем иконку
                if (icon) {
                    icon.style.color = color;
                    icon.style.stroke = color;
                    icon.style.transition = 'color 0.3s ease, stroke 0.3s ease, transform 0.3s ease, filter 0.3s ease';
                    icon.style.transform = 'scale(1.15) rotate(-5deg)';
                    icon.style.filter = `drop-shadow(0 0 8px ${color}40)`;
                }
                
                // Анимируем текст
                if (text) {
                    text.style.color = color;
                    text.style.transition = 'color 0.3s ease';
                    text.style.fontWeight = '600';
                }
                
                // Добавляем свечение к родительскому элементу
                item.style.transition = 'background 0.3s ease';
                item.style.background = `${color}15`;
            });
            
            item.addEventListener('mouseleave', function() {
                // Возвращаем иконку
                if (icon) {
                    icon.style.color = '';
                    icon.style.stroke = '';
                    icon.style.transform = '';
                    icon.style.filter = '';
                }
                
                // Возвращаем текст
                if (text) {
                    text.style.color = '';
                    text.style.fontWeight = '';
                }
                
                // Убираем фон
                item.style.background = '';
            });
        });
        
        console.log('🌈 Разноцветные иконки активированы!');
    }, 100);
});

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeConfig;
}