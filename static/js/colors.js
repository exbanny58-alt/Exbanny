// Вкладка Цвета
const ColorsPage = {
    settings: {
        theme: 'dark',
        accentColor: '#7acc7a',
        animations: true,
        glow: true,
        shadows: false,
        border: true,
        buttonStyle: 'flat'
    },

    getHTML() {
        return `
            <div class='settings-page'>
                <div class='settings-header'>
                    <div class='settings-icon'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='#7acc7a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                            <circle cx='12' cy='12' r='10'></circle>
                            <path d='M12 2a10 10 0 0 1 0 20'></path>
                            <path d='M12 2a10 10 0 0 0 0 20'></path>
                        </svg>
                    </div>
                    <h1>Цвета</h1>
                </div>
                <div class='settings-content'>
                    <p>Настройка цветовой схемы интерфейса</p>
                    
                    <div class='colors-controls'>
                        <!-- Theme Toggle -->
                        <div class='color-control-group'>
                            <label class='control-label'>Тема</label>
                            <div class='toggle-group'>
                                <div class='toggle-track ${this.settings.theme === 'dark' ? 'active' : ''}' data-toggle="theme">
                                    <div class='toggle-handle'></div>
                                </div>
                                <span class='toggle-label'>${this.settings.theme === 'dark' ? 'Тёмная' : 'Светлая'}</span>
                            </div>
                        </div>

                        <!-- Accent Color -->
                        <div class='color-control-group'>
                            <label class='control-label'>Акцентный цвет</label>
                            <div class='color-picker-group'>
                                <input type='color' class='color-picker' value='${this.settings.accentColor}'>
                                <div class='color-presets'>
                                    <button class='color-preset ${this.settings.accentColor === '#7acc7a' ? 'active' : ''}' style='background:#7acc7a' data-color='#7acc7a'></button>
                                    <button class='color-preset ${this.settings.accentColor === '#ff6b6b' ? 'active' : ''}' style='background:#ff6b6b' data-color='#ff6b6b'></button>
                                    <button class='color-preset ${this.settings.accentColor === '#4ecdc4' ? 'active' : ''}' style='background:#4ecdc4' data-color='#4ecdc4'></button>
                                    <button class='color-preset ${this.settings.accentColor === '#45b7d1' ? 'active' : ''}' style='background:#45b7d1' data-color='#45b7d1'></button>
                                    <button class='color-preset ${this.settings.accentColor === '#f9ca24' ? 'active' : ''}' style='background:#f9ca24' data-color='#f9ca24'></button>
                                </div>
                            </div>
                        </div>

                        <!-- Toggle Switches -->
                        <div class='color-control-group'>
                            <label class='control-label'>Элементы интерфейса</label>
                            <div class='switches-grid'>
                                <div class='switch-item'>
                                    <div class='toggle-track ${this.settings.animations ? 'active' : ''}' data-toggle="animations">
                                        <div class='toggle-handle'></div>
                                    </div>
                                    <span class='switch-label'>Анимации</span>
                                </div>
                                <div class='switch-item'>
                                    <div class='toggle-track ${this.settings.glow ? 'active' : ''}' data-toggle="glow">
                                        <div class='toggle-handle'></div>
                                    </div>
                                    <span class='switch-label'>Свечение</span>
                                </div>
                                <div class='switch-item'>
                                    <div class='toggle-track ${this.settings.shadows ? 'active' : ''}' data-toggle="shadows">
                                        <div class='toggle-handle'></div>
                                    </div>
                                    <span class='switch-label'>Тени</span>
                                </div>
                                <div class='switch-item'>
                                    <div class='toggle-track ${this.settings.border ? 'active' : ''}' data-toggle="border">
                                        <div class='toggle-handle'></div>
                                    </div>
                                    <span class='switch-label'>Границы</span>
                                </div>
                            </div>
                        </div>

                        <!-- Radio Group -->
                        <div class='color-control-group'>
                            <label class='control-label'>Стиль кнопок</label>
                            <div class='radio-group'>
                                <label class='radio-item ${this.settings.buttonStyle === 'flat' ? 'selected' : ''}'>
                                    <input type='radio' name='button-style' value='flat' ${this.settings.buttonStyle === 'flat' ? 'checked' : ''}>
                                    <span class='radio-custom'></span>
                                    Плоские
                                </label>
                                <label class='radio-item ${this.settings.buttonStyle === 'clay' ? 'selected' : ''}'>
                                    <input type='radio' name='button-style' value='clay' ${this.settings.buttonStyle === 'clay' ? 'checked' : ''}>
                                    <span class='radio-custom'></span>
                                    Объёмные
                                </label>
                                <label class='radio-item ${this.settings.buttonStyle === 'glass' ? 'selected' : ''}'>
                                    <input type='radio' name='button-style' value='glass' ${this.settings.buttonStyle === 'glass' ? 'checked' : ''}>
                                    <span class='radio-custom'></span>
                                    Стекло
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.loadSettings();
        this.initToggles();
        this.initColorPresets();
        this.initRadios();
    },

    loadSettings() {
        // Загружаем из localStorage
        const saved = localStorage.getItem('dayzm_colors');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            } catch (e) {}
        }
        
        // Загружаем с сервера
        fetch('/api/settings/load')
            .then(response => response.json())
            .then(data => {
                if (data && data.colors) {
                    this.settings = { ...this.settings, ...data.colors };
                    localStorage.setItem('dayzm_colors', JSON.stringify(this.settings));
                    this.applySettings();
                    // Перерендерим для обновления UI
                    app.loadSettingsContent();
                }
            })
            .catch(() => {
                // Если сервер недоступен, применяем из localStorage
                this.applySettings();
            });
    },

    saveSettings() {
        // Сохраняем в localStorage
        localStorage.setItem('dayzm_colors', JSON.stringify(this.settings));
        
        // Сохраняем на сервер
        fetch('/api/settings/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                colors: this.settings
            })
        }).catch(error => {
            console.error('Ошибка сохранения настроек цветов:', error);
        });
        
        this.applySettings();
    },

    applySettings() {
        // Применяем тему
        if (this.settings.theme === 'light') {
            document.documentElement.style.setProperty('--bg-primary', '#f0f0f0');
            document.documentElement.style.setProperty('--bg-top-panel', '#e8e8e8');
            document.documentElement.style.setProperty('--bg-side-panel', '#e0e0e0');
            document.documentElement.style.setProperty('--bg-card', '#ffffff');
            document.documentElement.style.setProperty('--text-primary', '#333333');
            document.documentElement.style.setProperty('--text-secondary', '#666666');
            document.documentElement.style.setProperty('--text-heading', '#222222');
            document.documentElement.style.setProperty('--border-color', '#d0d0d0');
            document.documentElement.style.setProperty('--border-hover', '#b0b0b0');
        } else {
            document.documentElement.style.setProperty('--bg-primary', '#1a1d1a');
            document.documentElement.style.setProperty('--bg-top-panel', '#1e211e');
            document.documentElement.style.setProperty('--bg-side-panel', '#1c1f1c');
            document.documentElement.style.setProperty('--bg-card', '#212421');
            document.documentElement.style.setProperty('--text-primary', '#b0b5b0');
            document.documentElement.style.setProperty('--text-secondary', '#7d827d');
            document.documentElement.style.setProperty('--text-heading', '#c8cdc8');
            document.documentElement.style.setProperty('--border-color', '#2a2f2a');
            document.documentElement.style.setProperty('--border-hover', '#3a423a');
        }

        // Применяем акцентный цвет
        const color = this.settings.accentColor;
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-dim', color + '99');
        document.documentElement.style.setProperty('--accent-glow', color + '1f');
        document.documentElement.style.setProperty('--accent-glow-strong', color + '33');
        document.documentElement.style.setProperty('--accent-bright', color);
        document.documentElement.style.setProperty('--accent-bg', color + '0f');
        document.documentElement.style.setProperty('--loader-color', color);

        // Применяем настройки интерфейса
        document.documentElement.style.setProperty('--animations-enabled', this.settings.animations ? '1' : '0');
        document.documentElement.style.setProperty('--glow-enabled', this.settings.glow ? '1' : '0');
        document.documentElement.style.setProperty('--shadows-enabled', this.settings.shadows ? '1' : '0');
        document.documentElement.style.setProperty('--border-enabled', this.settings.border ? '1' : '0');

        // Применяем стиль кнопок
        document.querySelectorAll('.btn-clay, .side-tab, .subnav-tab, .settings-btn, .effect-option').forEach(btn => {
            btn.classList.remove('style-flat', 'style-clay', 'style-glass');
            btn.classList.add('style-' + this.settings.buttonStyle);
        });
    },

    initToggles() {
        document.querySelectorAll('.toggle-track').forEach(track => {
            track.addEventListener('click', () => {
                const toggleName = track.dataset.toggle;
                const isActive = track.classList.toggle('active');
                
                // Обновляем настройки
                if (toggleName === 'theme') {
                    this.settings.theme = isActive ? 'dark' : 'light';
                    const label = track.closest('.toggle-group').querySelector('.toggle-label');
                    if (label) label.textContent = isActive ? 'Тёмная' : 'Светлая';
                } else if (toggleName === 'animations') {
                    this.settings.animations = isActive;
                } else if (toggleName === 'glow') {
                    this.settings.glow = isActive;
                } else if (toggleName === 'shadows') {
                    this.settings.shadows = isActive;
                } else if (toggleName === 'border') {
                    this.settings.border = isActive;
                }
                
                this.saveSettings();
            });
        });
    },

    initColorPresets() {
        const presets = document.querySelectorAll('.color-preset');
        const colorPicker = document.querySelector('.color-picker');
        
        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                presets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
                const color = preset.dataset.color;
                colorPicker.value = color;
                this.settings.accentColor = color;
                this.saveSettings();
            });
        });

        colorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            presets.forEach(p => p.classList.remove('active'));
            this.settings.accentColor = color;
            this.saveSettings();
        });
    },

    initRadios() {
        document.querySelectorAll('.radio-item input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    const parent = radio.closest('.radio-item');
                    const siblings = parent.parentElement.querySelectorAll('.radio-item');
                    siblings.forEach(s => s.classList.remove('selected'));
                    parent.classList.add('selected');
                    
                    this.settings.buttonStyle = radio.value;
                    this.saveSettings();
                }
            });
        });
    }
};