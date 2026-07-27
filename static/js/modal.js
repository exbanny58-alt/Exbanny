// ============================================
// УНИВЕРСАЛЬНОЕ МОДАЛЬНОЕ ОКНО
// ============================================

class Modal {
    constructor(options = {}) {
        this.options = {
            title: 'Заголовок',
            content: 'Содержимое модального окна',
            type: 'info',
            confirmText: 'Подтвердить',
            cancelText: 'Отмена',
            showCancel: true,
            showConfirm: true,
            onConfirm: null,
            onCancel: null,
            onClose: null,
            width: '500px',
            closeOnOverlay: true,
            closeOnEsc: true,
            ...options
        };
        
        this.element = null;
        this.overlay = null;
        this.isOpen = false;
        this._createModal();
    }
    
    _createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        
        this.element = document.createElement('div');
        this.element.className = `modal-window modal-${this.options.type}`;
        this.element.style.maxWidth = this.options.width;
        
        this.element.innerHTML = `
            <div class="modal-header">
                <div class="modal-header-left">
                    <span class="modal-icon">${this._getIcon()}</span>
                    <h2 class="modal-title">${this.options.title}</h2>
                </div>
                <button class="modal-close-btn" title="Закрыть">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                ${typeof this.options.content === 'string' ? this.options.content : ''}
            </div>
            <div class="modal-footer">
                ${this.options.showCancel ? `<button class="modal-btn modal-btn-cancel">${this.options.cancelText}</button>` : ''}
                ${this.options.showConfirm ? `<button class="modal-btn modal-btn-confirm modal-btn-${this.options.type}">${this.options.confirmText}</button>` : ''}
            </div>
        `;
        
        if (typeof this.options.content !== 'string' && this.options.content instanceof HTMLElement) {
            const body = this.element.querySelector('.modal-body');
            body.innerHTML = '';
            body.appendChild(this.options.content);
        }
        
        this.overlay.appendChild(this.element);
        document.body.appendChild(this.overlay);
        
        this._bindEvents();
    }
    
    _getIcon() {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            confirm: '❓'
        };
        return icons[this.options.type] || '📌';
    }
    
    _bindEvents() {
        const closeBtn = this.element.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
        
        if (this.options.closeOnEsc) {
            this._escHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this._escHandler);
        }
        
        const cancelBtn = this.element.querySelector('.modal-btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.options.onCancel) {
                    this.options.onCancel(this);
                }
                this.close();
            });
        }
        
        const confirmBtn = this.element.querySelector('.modal-btn-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (this.options.onConfirm) {
                    this.options.onConfirm(this);
                } else {
                    this.close();
                }
            });
        }
    }
    
    open() {
        if (this.isOpen) return this;
        this.isOpen = true;
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        return this;
    }
    
    close() {
        if (!this.isOpen) return this;
        this.isOpen = false;
        
        this.element.style.animation = 'modalSlideOut 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        this.overlay.style.animation = 'modalFadeOut 0.25s ease forwards';
        
        setTimeout(() => {
            this.overlay.style.display = 'none';
            document.body.style.overflow = '';
            this.element.style.animation = '';
            this.overlay.style.animation = '';
            
            if (this.options.onClose) {
                this.options.onClose(this);
            }
        }, 300);
        return this;
    }
    
    setContent(content) {
        const body = this.element.querySelector('.modal-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.innerHTML = '';
            body.appendChild(content);
        }
        return this;
    }
    
    setTitle(title) {
        const titleEl = this.element.querySelector('.modal-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
        this.options.title = title;
        return this;
    }
    
    // ============================================
    // СТАТИЧЕСКИЕ МЕТОДЫ
    // ============================================
    
    static info(options) {
        const modal = new Modal({
            type: 'info',
            title: options.title || 'Информация',
            content: options.content || '',
            confirmText: 'OK',
            showCancel: false,
            onConfirm: options.onConfirm || null,
            onClose: options.onClose || null,
            width: options.width || '450px',
            ...options
        });
        modal.open();
        return modal;
    }
    
    static success(options) {
        const modal = new Modal({
            type: 'success',
            title: options.title || 'Успешно!',
            content: options.content || '',
            confirmText: 'OK',
            showCancel: false,
            onConfirm: options.onConfirm || null,
            onClose: options.onClose || null,
            width: options.width || '450px',
            ...options
        });
        modal.open();
        return modal;
    }
    
    static warning(options) {
        const modal = new Modal({
            type: 'warning',
            title: options.title || 'Предупреждение',
            content: options.content || '',
            confirmText: 'OK',
            showCancel: false,
            onConfirm: options.onConfirm || null,
            onClose: options.onClose || null,
            width: options.width || '450px',
            ...options
        });
        modal.open();
        return modal;
    }
    
    static error(options) {
        const modal = new Modal({
            type: 'error',
            title: options.title || 'Ошибка',
            content: options.content || '',
            confirmText: 'OK',
            showCancel: false,
            onConfirm: options.onConfirm || null,
            onClose: options.onClose || null,
            width: options.width || '450px',
            ...options
        });
        modal.open();
        return modal;
    }
    
    static confirm(options) {
        const modal = new Modal({
            type: 'confirm',
            title: options.title || 'Подтверждение',
            content: options.content || '',
            confirmText: options.confirmText || 'Подтвердить',
            cancelText: options.cancelText || 'Отмена',
            showCancel: true,
            showConfirm: true,
            onConfirm: options.onConfirm || null,
            onCancel: options.onCancel || null,
            onClose: options.onClose || null,
            width: options.width || '450px',
            ...options
        });
        modal.open();
        return modal;
    }
    
    // ============================================
    // DESTROY (удаление из DOM)
    // ============================================
    
    destroy() {
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
        }
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

// ============================================
// ГАРАНТИРУЕМ ГЛОБАЛЬНУЮ ДОСТУПНОСТЬ
// ============================================

if (typeof window !== 'undefined') {
    window.Modal = Modal;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
}

console.log('📦 Modal загружен');