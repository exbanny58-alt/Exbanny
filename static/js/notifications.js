// ========================================
// NOTIFICATION SYSTEM
// ========================================

class NotificationCenter {
    constructor() {
        this.items = [];
        this.itemsToKill = [];
        this.killTimeout = null;
        this.container = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
        
        this.initialized = true;
    }

    show(options = {}) {
        if (!this.initialized) this.init();

        const defaults = {
            type: 'info',
            title: 'Уведомление',
            subtitle: '',
            actions: ['OK'],
            duration: 5000
        };

        const config = { ...defaults, ...options };
        
        const iconMap = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'message'
        };

        const message = {
            type: config.type,
            icon: iconMap[config.type] || 'message',
            title: config.title,
            subtitle: config.subtitle,
            actions: config.actions
        };

        const note = new Notification({
            message,
            container: this.container,
            duration: config.duration,
            onDismiss: () => this.killNote(note.id)
        });

        this.items.push(note);
        this.shiftNotes();

        if (config.duration > 0) {
            setTimeout(() => {
                this.killNote(note.id);
            }, config.duration);
        }

        return note.id;
    }

    success(title, subtitle = '') {
        return this.show({ type: 'success', title, subtitle, actions: ['OK'] });
    }

    error(title, subtitle = '') {
        return this.show({ type: 'error', title, subtitle, actions: ['Закрыть'] });
    }

    warning(title, subtitle = '') {
        return this.show({ type: 'warning', title, subtitle, actions: ['OK'] });
    }

    info(title, subtitle = '') {
        return this.show({ type: 'info', title, subtitle, actions: ['OK'] });
    }

    killNote(id) {
        const note = this.items.find(item => item.id === id);
        if (!note) return;

        note.el.classList.add('notification--out');
        this.itemsToKill.push(note);

        clearTimeout(this.killTimeout);
        this.killTimeout = setTimeout(() => {
            this.itemsToKill.forEach(itemToKill => {
                if (itemToKill.el && itemToKill.el.parentNode) {
                    itemToKill.el.parentNode.removeChild(itemToKill.el);
                }
                this.items = this.items.filter(item => item.id !== itemToKill.id);
            });
            this.itemsToKill = [];
            this.shiftNotes();
        }, 300);
    }

    shiftNotes() {
        this.items.forEach((item, i) => {
            if (item.el) {
                const transY = 100 * i;
                item.el.style.transform = `translateY(${transY}%)`;
            }
        });
    }
}

class Notification {
    constructor({ message, container, duration, onDismiss }) {
        this.id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.el = null;
        this.duration = duration;
        this.onDismiss = onDismiss;
        this.create(message, container);
    }

    create(message, container) {
        const { type, icon, title, subtitle, actions } = message;
        const block = 'notification';

        // Main element
        const note = document.createElement('div');
        note.id = this.id;
        note.className = `${block} ${block}--${type}`; // ← Добавляем класс типа
        note.style.transform = 'translateY(100%)';
        container.appendChild(note);

        // Box
        const box = document.createElement('div');
        box.className = `${block}__box`;
        note.appendChild(box);

        // Content wrapper (left side: icon + text)
        const content = document.createElement('div');
        content.className = `${block}__content`;
        box.appendChild(content);

        // Icon
        const iconDiv = document.createElement('div');
        iconDiv.className = `${block}__icon`;
        content.appendChild(iconDiv);

        const iconSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSVG.setAttribute('class', `${block}__icon-svg`);
        iconSVG.setAttribute('viewBox', '0 0 32 32');
        iconSVG.setAttribute('width', '32');
        iconSVG.setAttribute('height', '32');
        iconDiv.appendChild(iconSVG);

        const iconUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        iconUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${icon}`);
        iconSVG.appendChild(iconUse);

        // Text
        const text = document.createElement('div');
        text.className = `${block}__text`;
        content.appendChild(text);

        const titleEl = document.createElement('div');
        titleEl.className = `${block}__text-title`;
        titleEl.textContent = title;
        text.appendChild(titleEl);

        if (subtitle) {
            const subtitleEl = document.createElement('div');
            subtitleEl.className = `${block}__text-subtitle`;
            subtitleEl.textContent = subtitle;
            text.appendChild(subtitleEl);
        }

        // Buttons wrapper (right side)
        if (actions && actions.length > 0) {
            const btns = document.createElement('div');
            btns.className = `${block}__btns`;
            box.appendChild(btns);

            actions.forEach((action, index) => {
                const btn = document.createElement('button');
                btn.className = `${block}__btn`;
                btn.type = 'button';
                btn.textContent = action;

                // Single button - primary accent
                if (actions.length === 1) {
                    btn.classList.add(`${block}__btn--primary`);
                }

                // Close/danger button
                if (action.toLowerCase() === 'закрыть' || action.toLowerCase() === 'close') {
                    btn.classList.add(`${block}__btn--danger`);
                }

                // Neutral for multi-button groups
                if (actions.length > 1 && !btn.classList.contains(`${block}__btn--danger`)) {
                    btn.classList.add(`${block}__btn--neutral`);
                }

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.onDismiss) this.onDismiss();
                });

                btns.appendChild(btn);
            });
        }

        // Click on notification body to dismiss (but not on buttons)
        note.addEventListener('click', (e) => {
            if (!e.target.closest(`.${block}__btn`)) {
                if (this.onDismiss) this.onDismiss();
            }
        });

        this.el = note;

        // Animate in
        requestAnimationFrame(() => {
            note.style.transform = 'translateY(0)';
        });
    }
}

// Create global instance
const Notifications = new NotificationCenter();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Notifications.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationCenter, Notifications };
}