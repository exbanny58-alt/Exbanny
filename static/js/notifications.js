// ========================================
// NOTIFICATIONS SYSTEM — DayzM
// Появляются снизу по центру с выездом
// ========================================

class DayzMNotification {
    constructor() {
        this.container = null;
        this.initialized = false;
        this.queue = [];
    }

    init() {
        if (this.initialized) return;
        
        this.container = document.createElement('div');
        this.container.className = 'dayzm-notifications';
        document.body.appendChild(this.container);
        
        this.initialized = true;
        console.log('✅ Notification system initialized');
    }

    show(options) {
        if (!this.initialized) this.init();

        const defaults = {
            type: 'info',
            title: '',
            message: '',
            duration: 4000,
            actions: []
        };

        const config = { ...defaults, ...options };
        
        // Создаём уведомление
        const note = this.createNotification(config);
        this.container.appendChild(note);

        // ⚠️ ВАЖНО: принудительный reflow перед добавлением класса
        // Чтобы анимация сработала
        void note.offsetHeight;
        
        // Добавляем класс show — уведомление выезжает
        requestAnimationFrame(() => {
            note.classList.add('show');
        });

        // Автозакрытие
        if (config.duration > 0) {
            setTimeout(() => {
                this.close(note);
            }, config.duration);
        }

        return note;
    }

    createNotification(config) {
        const { type, title, message, actions } = config;

        const note = document.createElement('div');
        note.className = `dayzm-notification dayzm-notification--${type}`;
        
        // Добавляем атрибут для duration (чтобы убрать прогресс-бар если нужно)
        if (config.duration === 0) {
            note.setAttribute('data-duration', '0');
        }

        // Иконки
        const icons = {
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/></svg>`,
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
        };

        note.innerHTML = `
            <div class="dayzm-notification__icon">${icons[type] || icons.info}</div>
            <div class="dayzm-notification__body">
                ${title ? `<div class="dayzm-notification__title">${title}</div>` : ''}
                ${message ? `<div class="dayzm-notification__message">${message}</div>` : ''}
            </div>
            <button class="dayzm-notification__close" aria-label="Закрыть">✕</button>
            ${actions.length ? `
                <div class="dayzm-notification__actions">
                    ${actions.map((action, i) => `
                        <button class="dayzm-notification__action" data-index="${i}">${action.label}</button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        // Закрытие по крестику
        note.querySelector('.dayzm-notification__close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.close(note);
        });

        // Закрытие по клику на само уведомление (но не на кнопки)
        note.addEventListener('click', (e) => {
            if (!e.target.closest('.dayzm-notification__action') && 
                !e.target.closest('.dayzm-notification__close')) {
                this.close(note);
            }
        });

        // Действия
        if (actions.length) {
            note.querySelectorAll('.dayzm-notification__action').forEach((btn) => {
                const index = parseInt(btn.dataset.index);
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (actions[index].callback) {
                        actions[index].callback();
                    }
                    this.close(note);
                });
            });
        }

        return note;
    }

    close(note) {
        if (!note || note.classList.contains('closing')) return;
        
        note.classList.remove('show');
        note.classList.add('closing');
        
        setTimeout(() => {
            if (note.parentNode) {
                note.parentNode.removeChild(note);
            }
        }, 400);
    }

    // ============================================
    // БЫСТРЫЕ МЕТОДЫ
    // ============================================

    success(title, message = '', duration = 4000) {
        return this.show({ type: 'success', title, message, duration });
    }

    error(title, message = '', duration = 5000) {
        return this.show({ type: 'error', title, message, duration });
    }

    warning(title, message = '', duration = 4000) {
        return this.show({ type: 'warning', title, message, duration });
    }

    info(title, message = '', duration = 3000) {
        return this.show({ type: 'info', title, message, duration });
    }

    confirm(title, message = '', actions = []) {
        return this.show({
            type: 'warning',
            title,
            message,
            duration: 0,
            actions: actions.length ? actions : [
                { label: 'Да', callback: () => {} },
                { label: 'Нет', callback: () => {} }
            ]
        });
    }
}

// Глобальный экземпляр
const Notifications = new DayzMNotification();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
});

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DayzMNotification, Notifications };
}