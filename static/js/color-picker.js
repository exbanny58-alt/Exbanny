// color-picker.js - Управление палитрой цветов + яркость свечения
const ColorPicker = {
    colors: {},
    isOpen: false,
    defaultColors: {
        accent: '#7acc7a',
        glowIntensity: 50
    },

    init() {
        this.loadColors();
        this.createPopup();
        this.bindEvents();
    },

    async loadColors() {
        try {
            const response = await fetch('/api/settings/load');
            const data = await response.json();
            this.colors = data.colors || { ...this.defaultColors };
            if (this.colors.glowIntensity === undefined || this.colors.glowIntensity === null) {
                this.colors.glowIntensity = 50;
            }
        } catch (error) {
            console.error('Ошибка загрузки цветов:', error);
            this.colors = { ...this.defaultColors };
        }
    },

    createPopup() {
        const oldOverlay = document.getElementById('colorPickerOverlay');
        const oldPopup = document.getElementById('colorPickerPopup');
        if (oldOverlay) oldOverlay.remove();
        if (oldPopup) oldPopup.remove();

        const overlay = document.createElement('div');
        overlay.className = 'color-picker-overlay';
        overlay.id = 'colorPickerOverlay';

        const popup = document.createElement('div');
        popup.className = 'color-picker-popup';
        popup.id = 'colorPickerPopup';
        popup.innerHTML = `
            <div class="popup-header">
                <div class="popup-title-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a10 10 0 0 1 0 20"></path>
                        <path d="M12 2a10 10 0 0 0 0 20"></path>
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                        <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                        <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                    </svg>
                </div>
                <h3>Акцентный цвет</h3>
                <button class="popup-close" id="colorPickerClose">✕</button>
            </div>
            <div class="color-group">
                <label>Выберите цвет</label>
                <div class="color-row">
                    <input type="color" id="colorAccent" value="${this.colors.accent}">
                    <input type="text" class="color-hex-input" id="colorAccentHex" value="${this.colors.accent}" placeholder="#7acc7a">
                    <div class="color-preview" id="colorAccentPreview" style="background:${this.colors.accent}"></div>
                </div>
            </div>
            <div class="color-group">
                <label>Яркость свечения: <span id="glowValue">${this.colors.glowIntensity}%</span></label>
                <div class="glow-slider-container">
                    <input type="range" class="glow-slider" id="glowSlider" 
                           min="0" max="100" value="${this.colors.glowIntensity}">
                    <div class="glow-preview" id="glowPreview"></div>
                </div>
                <div class="glow-labels">
                    <span>Тусклое</span>
                    <span>Насыщенное</span>
                </div>
            </div>
            <div class="popup-actions">
                <button class="btn-save" id="colorSaveBtn">💾 Сохранить</button>
                <button class="btn-reset" id="colorResetBtn">↺ Сбросить</button>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        setTimeout(() => {
            this.updateGlowPreview();
        }, 10);
    },

    bindEvents() {
        document.getElementById('colorPickerClose')?.addEventListener('click', () => this.close());
        document.getElementById('colorPickerOverlay')?.addEventListener('click', () => this.close());
        document.getElementById('colorSaveBtn')?.addEventListener('click', () => this.save());
        document.getElementById('colorResetBtn')?.addEventListener('click', () => this.reset());
        this.bindColorInputs();
        this.bindGlowSlider();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    bindColorInputs() {
        const colorInput = document.getElementById('colorAccent');
        const hexInput = document.getElementById('colorAccentHex');
        const preview = document.getElementById('colorAccentPreview');
        
        if (colorInput && hexInput && preview) {
            const updateColor = (val) => {
                colorInput.value = val;
                hexInput.value = val;
                preview.style.background = val;
                this.updateGlowPreview();
            };

            colorInput.addEventListener('input', () => {
                const val = colorInput.value;
                updateColor(val);
            });
            
            hexInput.addEventListener('input', () => {
                let val = hexInput.value.trim();
                if (val.match(/^#[0-9a-fA-F]{6}$/)) {
                    updateColor(val);
                } else if (val.match(/^[0-9a-fA-F]{6}$/)) {
                    val = '#' + val;
                    updateColor(val);
                }
            });
            
            hexInput.addEventListener('blur', () => {
                let val = hexInput.value.trim();
                if (val.match(/^[0-9a-fA-F]{6}$/)) {
                    val = '#' + val;
                    hexInput.value = val;
                    updateColor(val);
                } else if (!val.match(/^#[0-9a-fA-F]{6}$/)) {
                    hexInput.value = colorInput.value;
                }
            });
        }
    },

    bindGlowSlider() {
        const slider = document.getElementById('glowSlider');
        const glowValue = document.getElementById('glowValue');
        
        if (slider && glowValue) {
            slider.addEventListener('input', () => {
                const value = parseInt(slider.value);
                glowValue.textContent = value + '%';
                this.colors.glowIntensity = value;
                this.updateGlowPreview();
            });
        }
    },

    updateGlowPreview() {
        const glowPreview = document.getElementById('glowPreview');
        const colorInput = document.getElementById('colorAccent');
        const slider = document.getElementById('glowSlider');
        
        if (!glowPreview) return;
        
        const color = colorInput ? colorInput.value : this.colors.accent;
        const intensity = this.colors.glowIntensity !== undefined ? this.colors.glowIntensity : 50;
        const intensityFloat = intensity / 100;
        const glowSize = intensity * 1.5;
        
        glowPreview.style.background = color;
        glowPreview.style.opacity = Math.max(0.1, intensityFloat);
        glowPreview.style.boxShadow = `0 0 ${glowSize}px ${color}`;
        
        if (intensity === 0) {
            glowPreview.style.boxShadow = `0 0 2px ${color}44`;
            glowPreview.style.opacity = '0.3';
        }
    },

    open() {
        if (this.isOpen) return;
        
        const overlay = document.getElementById('colorPickerOverlay');
        const popup = document.getElementById('colorPickerPopup');
        
        if (overlay && popup) {
            this.updateValues();
            overlay.classList.add('active');
            popup.classList.remove('closing');
            popup.classList.add('active');
            this.isOpen = true;
        }
    },

    close() {
        if (!this.isOpen) return;
        
        const overlay = document.getElementById('colorPickerOverlay');
        const popup = document.getElementById('colorPickerPopup');
        
        if (popup) {
            popup.classList.add('closing');
            setTimeout(() => {
                popup.classList.remove('active');
                popup.classList.remove('closing');
                if (overlay) overlay.classList.remove('active');
                this.isOpen = false;
            }, 250);
        } else {
            if (overlay) overlay.classList.remove('active');
            this.isOpen = false;
        }
    },

    updateValues() {
        const colorInput = document.getElementById('colorAccent');
        const hexInput = document.getElementById('colorAccentHex');
        const preview = document.getElementById('colorAccentPreview');
        const slider = document.getElementById('glowSlider');
        const glowValue = document.getElementById('glowValue');
        
        if (this.colors.glowIntensity === undefined || this.colors.glowIntensity === null) {
            this.colors.glowIntensity = 50;
        }
        
        if (colorInput) colorInput.value = this.colors.accent;
        if (hexInput) hexInput.value = this.colors.accent;
        if (preview) preview.style.background = this.colors.accent;
        if (slider) slider.value = this.colors.glowIntensity;
        if (glowValue) glowValue.textContent = this.colors.glowIntensity + '%';
        
        this.updateGlowPreview();
    },

    save() {
        const colorInput = document.getElementById('colorAccent');
        const slider = document.getElementById('glowSlider');
        
        const newColors = {
            accent: colorInput ? colorInput.value : this.colors.accent,
            glowIntensity: slider ? parseInt(slider.value) : this.colors.glowIntensity
        };
        
        this.colors = newColors;
        this.applyColors();
        
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colors: newColors })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('✅ Настройки сохранены!');
                setTimeout(() => this.close(), 600);
            }
        })
        .catch(error => {
            console.error('Ошибка сохранения:', error);
            this.showNotification('❌ Ошибка сохранения');
        });
    },

    reset() {
        this.colors = { ...this.defaultColors };
        this.updateValues();
        this.applyColors();
        
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ colors: this.defaultColors })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('↺ Настройки сброшены');
                setTimeout(() => this.close(), 600);
            }
        })
        .catch(error => {
            console.error('Ошибка сброса:', error);
        });
    },

    applyColors() {
        const root = document.documentElement;
        const intensity = this.colors.glowIntensity !== undefined ? this.colors.glowIntensity : 50;
        const intensityFloat = intensity / 100;
        const glowSize = intensity * 1.5;
        
        if (this.colors.accent) {
            root.style.setProperty('--accent', this.colors.accent);
            root.style.setProperty('--accent-dim', this.colors.accent + 'cc');
            root.style.setProperty('--accent-bg', this.colors.accent + '0f');
            root.style.setProperty('--loader-color', this.colors.accent);
            
            const minAlpha = 5;
            const maxAlpha = 51;
            const alpha = Math.round(minAlpha + (maxAlpha - minAlpha) * intensityFloat);
            const alphaHex = alpha.toString(16).padStart(2, '0');
            
            root.style.setProperty('--accent-glow', this.colors.accent + alphaHex);
            root.style.setProperty('--accent-glow-strong', this.colors.accent + alphaHex);
            root.style.setProperty('--accent-glow-size', Math.max(glowSize, 2) + 'px');
        }
    },

    showNotification(message) {
        const existing = document.querySelector('.color-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'color-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            background: var(--bg-card);
            border: 1px solid var(--accent-dim);
            border-radius: 12px;
            padding: 14px 24px;
            color: var(--text-primary);
            font-family: 'Montserrat', sans-serif;
            font-size: 0.9rem;
            z-index: 1001;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 24px var(--accent-glow);
            animation: slideBounceUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 320px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'popupClose 0.25s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    }
};