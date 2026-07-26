// ============================================
// TOAST - БЕЗ СТИЛЕЙ (только логика)
// ============================================

class ToastSystem {
    constructor() {
        this.container = null;
        this.maxToasts = 5;
        this.defaultDuration = 4000;
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    getColor(type) {
        const colors = {
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24',
            info: '#60a5fa'
        };
        return colors[type] || '#60a5fa';
    }

    getEmoji(type) {
        const emojis = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return emojis[type] || '📌';
    }

    show(message, type = 'info', duration = null) {
        const actualDuration = duration || this.defaultDuration;
        const color = this.getColor(type);
        const emoji = this.getEmoji(type);

        const items = this.container.querySelectorAll('.toast-item');
        if (items.length >= this.maxToasts) {
            items[0].remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        
        // Только data-атрибуты для CSS
        toast.dataset.type = type;
        toast.dataset.color = color;

        // Левая граница
        const border = document.createElement('div');
        border.className = 'toast-border';
        toast.appendChild(border);

        // Иконка
        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.textContent = emoji;
        toast.appendChild(icon);

        // Сообщение
        const msg = document.createElement('span');
        msg.className = 'toast-message';
        msg.textContent = message;
        toast.appendChild(msg);

        // Кнопка закрытия
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => this.close(toast);
        toast.appendChild(closeBtn);

        // Прогресс-бар
        const progress = document.createElement('div');
        progress.className = 'toast-progress';
        progress.style.animationDuration = `${actualDuration}ms`;
        toast.appendChild(progress);

        this.container.appendChild(toast);

        // Показываем через CSS класс
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        let timeout = setTimeout(() => {
            this.close(toast);
        }, actualDuration);

        toast.onmouseenter = () => {
            clearTimeout(timeout);
            toast.classList.add('hover');
        };

        toast.onmouseleave = () => {
            toast.classList.remove('hover');
            timeout = setTimeout(() => {
                this.close(toast);
            }, actualDuration);
        };

        return toast;
    }

    close(toast) {
        if (!toast || toast._closing) return;
        toast._closing = true;

        toast.classList.remove('show');
        toast.classList.add('hiding');

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 400);
    }

    success(message, duration = null) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = null) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = null) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = null) {
        return this.show(message, 'info', duration);
    }

    clearAll() {
        const items = this.container.querySelectorAll('.toast-item');
        items.forEach(item => this.close(item));
    }
}

const toast = new ToastSystem();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = toast;
}