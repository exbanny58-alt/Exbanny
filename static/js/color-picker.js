// color-picker.js - Управление палитрой цветов + яркость свечения
const ColorPicker = {
    colors: {},
    isOpen: false,
    isLoaded: false,
    defaultColors: {
        accent: '#7acc7a',
        glowIntensity: 50
    },

    init() {
        // Если есть начальное состояние — используем его
        if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.colors) {
            const serverColors = window.__INITIAL_STATE__.colors;
            this.colors = {
                accent: serverColors.accent || this.defaultColors.accent,
                glowIntensity: serverColors.glowIntensity !== undefined 
                    ? serverColors.glowIntensity 
                    : this.defaultColors.glowIntensity
            };
        } else {
            // Fallback — загружаем с сервера
            this.loadColors();
        }
        
        // Создаём попап
        this.createPopup();
        // Привязываем события
        this.bindEvents();
        // Применяем цвета к странице
        this.applyColors();
        // Отмечаем, что загружено
        this.isLoaded = true;
        console.log('🎨 ColorPicker инициализирован с цветами:', this.colors);
    },

    async loadColors() {
        // Этот метод теперь используется только как fallback
        try {
            const response = await fetch('/api/settings/load');
            const data = await response.json();
            
            if (data && data.colors && typeof data.colors === 'object') {
                this.colors = {
                    accent: data.colors.accent || this.defaultColors.accent,
                    glowIntensity: data.colors.glowIntensity !== undefined && data.colors.glowIntensity !== null 
                        ? data.colors.glowIntensity 
                        : this.defaultColors.glowIntensity
                };
            } else {
                this.colors = { ...this.defaultColors };
                await this.saveColorsToServer(this.colors);
            }
        } catch (error) {
            console.error('Ошибка загрузки цветов:', error);
            this.colors = { ...this.defaultColors };
        }
    },
    async saveColorsToServer(colors) {
        try {
            const response = await fetch('/api/settings/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ colors: colors })
            });
            const data = await response.json();
            return data.success || false;
        } catch (error) {
            console.error('Ошибка сохранения цветов:', error);
            return false;
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
        
        if (!glowPreview) return;
        
        const color = colorInput ? colorInput.value : (this.colors.accent || this.defaultColors.accent);
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
        
        const accent = this.colors.accent || this.defaultColors.accent;
        const intensity = this.colors.glowIntensity !== undefined ? this.colors.glowIntensity : this.defaultColors.glowIntensity;
        
        if (colorInput) colorInput.value = accent;
        if (hexInput) hexInput.value = accent;
        if (preview) preview.style.background = accent;
        if (slider) slider.value = intensity;
        if (glowValue) glowValue.textContent = intensity + '%';
        
        this.updateGlowPreview();
    },

    async save() {
        const colorInput = document.getElementById('colorAccent');
        const slider = document.getElementById('glowSlider');
        
        const newColors = {
            accent: colorInput ? colorInput.value : (this.colors.accent || this.defaultColors.accent),
            accentSecondary: this.colors.accentSecondary || this.defaultColors.accentSecondary,
            glowIntensity: slider ? parseInt(slider.value) : (this.colors.glowIntensity || this.defaultColors.glowIntensity)
        };
        
        this.colors = newColors;
        this.applyColors();
        
        const success = await this.saveColorsToServer(newColors);
        
        if (success) {
            Notifications.success('✅ Стили темы Сохранены!');
            setTimeout(() => this.close(), 600);
        } else {
            Notifications.error('❌ Ошибка сохранения');
        }
    },

    async reset() {
        this.colors = { ...this.defaultColors };
        this.updateValues();
        this.applyColors();
        
        const success = await this.saveColorsToServer(this.defaultColors);
        
        if (success) {
            Notifications.success('↺ Стиль темы Сброшен');
            setTimeout(() => this.close(), 600);
        } else {
            Notifications.error('❌ Ошибка сброса');
        }
    },
    
    applyColors() {
        const root = document.documentElement;
        const accent = this.colors.accent || this.defaultColors.accent;
        const intensity = this.colors.glowIntensity !== undefined ? this.colors.glowIntensity : this.defaultColors.glowIntensity;
        const intensityFloat = intensity / 100;
        const glowSize = intensity * 1.5;
        
        if (accent) {
            root.style.setProperty('--accent', accent, 'important');
            root.style.setProperty('--accent-dim', accent + 'cc', 'important');
            root.style.setProperty('--accent-bg', accent + '0f', 'important');
            root.style.setProperty('--loader-color', accent, 'important');
            
            const minAlpha = 5;
            const maxAlpha = 51;
            const alpha = Math.round(minAlpha + (maxAlpha - minAlpha) * intensityFloat);
            const alphaHex = alpha.toString(16).padStart(2, '0');
            
            root.style.setProperty('--accent-glow', accent + alphaHex, 'important');
            root.style.setProperty('--accent-glow-strong', accent + alphaHex, 'important');
            root.style.setProperty('--accent-glow-size', Math.max(glowSize, 2) + 'px', 'important');
            
            this.updatePlayerColors(accent);
        }
    },
    updatePlayerColors(accent) {
        // Обновляем цвет кнопки плеера
        const toggle = document.getElementById('playerToggle');
        if (toggle) {
            toggle.style.borderColor = accent;
            toggle.style.boxShadow = `0 0 24px ${accent}33`;
        }
        
        // Обновляем бейдж
        const badge = document.querySelector('.player-badge');
        if (badge) {
            badge.style.background = accent;
        }
        
        // Обновляем bass-ring
        const bassRing = document.querySelector('.bass-ring');
        if (bassRing) {
            bassRing.style.borderColor = accent;
        }
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    }
};