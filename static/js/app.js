// SPA приложение DayzM
const app = {
    config: null,
    currentPage: null,
    currentSettingsTab: 'general',
    isSettingsOpen: false,  // Добавляем флаг для отслеживания состояния настроек

    async init() {
        console.log('🚀 App initializing...');
        
        this.config = window.__INITIAL_STATE__.config;
        console.log('✅ Config loaded:', this.config);
        
        const colors = window.__INITIAL_STATE__.colors;
        if (colors) {
            ColorPicker.colors = {
                accent: colors.accent || '#7acc7a',
                glowIntensity: colors.glowIntensity !== undefined ? colors.glowIntensity : 50
            };
            ColorPicker.applyColors();
            console.log('✅ Colors applied:', ColorPicker.colors);
        }
        
        const effect = window.__INITIAL_STATE__.effect;
        if (effect && EffectsManager.effects[effect]) {
            EffectsManager.currentEffect = effect;
            console.log('✅ Effect set:', effect);
        }
        
        this.render();
        
        EffectsManager.init();
        ColorPicker.init();
        this.initMusicButton();
        
        setTimeout(() => EffectsManager.applyToContent(), 50);
        
        console.log('✅ App initialized successfully');
    },

    render() {
        this.renderLogo();
        this.renderSettingsButton();
        this.renderSettingsSubnav();
        this.updateActiveTab();
        this.loadSettingsFromServer();
    },

    renderLogo() {
        if (this.config && this.config.app) {
            document.title = this.config.app.title;
        }
    },

    renderSettingsButton() {
        const btn = document.querySelector('.settings-btn');
        if (btn) {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('⚙️ Settings button clicked');
                this.togglePage('settings');
            });
            console.log('✅ Settings button initialized');
        } else {
            console.warn('⚠️ Settings button not found in DOM');
        }
    },

    renderSettingsSubnav() {
        document.querySelectorAll('.subnav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.settingsTab;
                console.log('📑 Settings tab clicked:', tabName);
                this.switchSettingsTab(tabName);
            });
        });
    },

    updateActiveTab() {
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const pageId = tab.dataset.pageId;
                console.log('📄 Page clicked:', pageId);
                this.togglePage(pageId);
            });
        });
    },

    async loadSettingsFromServer() {
        try {
            const response = await fetch('/api/settings/load');
            const data = await response.json();
            
            if (data.effect && EffectsManager.effects[data.effect]) {
                EffectsManager.currentEffect = data.effect;
            }
            
            if (data.colors) {
                ColorPicker.colors = {
                    accent: data.colors.accent || ColorPicker.colors.accent,
                    accentSecondary: data.colors.accentSecondary || ColorPicker.colors.accentSecondary,
                    glowIntensity: data.colors.glowIntensity !== undefined ? data.colors.glowIntensity : ColorPicker.colors.glowIntensity
                };
                ColorPicker.applyColors();
            }
        } catch (error) {
            console.error('❌ Error loading settings:', error);
            Notifications.error('Ошибка загрузки настроек');
        }
    },
    showHome() {
        console.log('🏠 Showing home page');
        this.currentPage = 'home';
        this.isSettingsOpen = false;
        this.hideSettingsSubnav();
        this.closeColorPickerIfOpen();

        // Убираем активный класс со всех вкладок
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        const settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) settingsBtn.classList.remove('active');
        
        // Возвращаем контент на главную
        if (this.config && this.config.homePage) {
            document.getElementById('content').innerHTML = this.config.homePage.content;
        }
        
        setTimeout(() => EffectsManager.applyToContent(), 50);
    },

    togglePage(pageId) {
        console.log('🔄 Toggle page:', pageId, 'current:', this.currentPage);
        
        // Если кликнули по настройкам
        if (pageId === 'settings') {
            // Если настройки уже открыты — сворачиваем на главную
            if (this.currentPage === 'settings' || this.isSettingsOpen) {
                this.showHome();
                return;
            }
            // Иначе открываем настройки
            this.openPage('settings');
            return;
        }
        
        // Если кликнули по home — показываем главную
        if (pageId === 'home') {
            this.showHome();
            return;
        }
        
        // Если кликнули по той же странице — сворачиваем на главную
        if (this.currentPage === pageId) {
            this.showHome();
            return;
        }
        
        // Открываем страницу
        this.openPage(pageId);
    },

    openPage(pageId) {
        console.log('📄 Opening page:', pageId);
        
        // Если открываем настройки
        if (pageId === 'settings') {
            this.isSettingsOpen = true;
            this.showSettingsSubnav();
            const settingsBtn = document.querySelector('.settings-btn');
            if (settingsBtn) settingsBtn.classList.add('active');
            
            document.querySelectorAll('.side-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            this.currentSettingsTab = 'general';
            document.querySelectorAll('.subnav-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.settingsTab === 'general');
            });
            this.loadSettingsContent('general');
            this.currentPage = 'settings';
            return;
        }
        
        // Открываем обычную страницу
        this.isSettingsOpen = false;
        this.hideSettingsSubnav();
        this.closeColorPickerIfOpen();
        
        const settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) settingsBtn.classList.remove('active');
        
        // Обновляем активную вкладку
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.pageId === pageId);
        });
        
        const page = this.config.pages.find(p => p.id === pageId);
        if (page) {
            document.getElementById('content').innerHTML = page.content;
            setTimeout(() => EffectsManager.applyToContent(), 50);
        }

        this.currentPage = pageId;
    },
    
    showSettingsSubnav() {
        const subnav = document.getElementById('settingsSubnav');
        if (subnav) subnav.classList.add('visible');
    },

    hideSettingsSubnav() {
        const subnav = document.getElementById('settingsSubnav');
        if (subnav) subnav.classList.remove('visible');
    },

    closeColorPickerIfOpen() {
        if (ColorPicker.isOpen) {
            ColorPicker.close();
        }
    },

    switchSettingsTab(tabName) {
        this.currentSettingsTab = tabName;

        document.querySelectorAll('.subnav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.settingsTab === tabName);
        });

        if (tabName === 'colors') {
            ColorPicker.open();
            return;
        }

        ColorPicker.close();
        this.loadSettingsContent(tabName);
    },

    loadSettingsContent(tabName) {
        const tab = tabName || this.currentSettingsTab;
        
        if (tab === 'general') {
            document.getElementById('content').innerHTML = `
                <div class='settings-page'>
                    <div class='settings-header'>
                        <div class='settings-icon'>
                            <svg viewBox='0 0 24 24' fill='none' stroke='var(--accent)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                                <circle cx='12' cy='12' r='3'></circle>
                                <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
                            </svg>
                        </div>
                        <h1>Общие настройки</h1>
                    </div>
                    <div class='settings-content'>
                        <p>Здесь будут общие настройки приложения</p>
                    </div>
                </div>`;
        } else if (tab === 'effects') {
            const effects = EffectsManager.effects;
            const currentEffect = EffectsManager.currentEffect;
            let optionsHtml = '';
            
            Object.entries(effects).forEach(([id, effect]) => {
                const isActive = currentEffect === id;
                optionsHtml += `
                    <div class="effect-option ${isActive ? 'active' : ''}" data-effect="${id}">
                        <div class="effect-radio"></div>
                        <div class="effect-info">
                            <span class="effect-name">${effect.name}</span>
                            <span class="effect-desc">${effect.description}</span>
                        </div>
                    </div>`;
            });

            document.getElementById('content').innerHTML = `
                <div class='settings-page effects-page'>
                    <div class='settings-content effects-content'>
                        <p>Выберите анимацию переключения между страницами</p>
                        <div class='effects-list'>
                            ${optionsHtml}
                        </div>
                    </div>
                </div>`;

            setTimeout(() => {
                document.querySelectorAll('.effect-option').forEach(option => {
                    option.addEventListener('click', () => {
                        const effectId = option.dataset.effect;
                        EffectsManager.setEffect(effectId);
                        this.loadSettingsContent('effects');
                    });
                });
            }, 0);
        }
        
        setTimeout(() => EffectsManager.applyToContent(), 50);
    },

    goHome() {
        this.showHome();
        ColorPicker.close();
    },

    // ============================================
    // УПРАВЛЕНИЕ ПЛАВАЮЩИМ ПЛЕЕРОМ
    // ============================================

    initMusicButton() {
        const musicBtn = document.querySelector('.music-btn');
        if (!musicBtn) {
            console.warn('⚠️ Music button not found in DOM');
            return;
        }

        const player = document.getElementById('dayzmPlayer');
        if (!player) {
            console.warn('⚠️ Player container not found');
            return;
        }

        player.classList.add('hidden');
        player.style.display = 'none';

        const newMusicBtn = musicBtn.cloneNode(true);
        musicBtn.parentNode.replaceChild(newMusicBtn, musicBtn);

        newMusicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🎵 Music button clicked');
            this.toggleFloatingButton();
        });

        const closeBtn = document.getElementById('playerClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (typeof Player !== 'undefined' && Player.isOpen) {
                    Player.close();
                }
                this.updateMusicButtonState(true);
            });
        }

        if (typeof Player !== 'undefined') {
            const originalToggle = Player.toggle;
            Player.toggle = function() {
                originalToggle.call(this);
                app.updateMusicButtonState(true);
            };

            const originalOpen = Player.open;
            Player.open = function() {
                originalOpen.call(this);
                app.updateMusicButtonState(true);
            };

            const originalClose = Player.close;
            Player.close = function() {
                originalClose.call(this);
                app.updateMusicButtonState(true);
            };
        }
        
        console.log('✅ Music button initialized');
    },

    toggleFloatingButton() {
        const player = document.getElementById('dayzmPlayer');
        if (!player) return;
        
        if (player.classList.contains('hidden') || player.style.display === 'none') {
            this.showFloatingButton();
        } else {
            this.hideFloatingButton();
        }
    },

    showFloatingButton() {
        const player = document.getElementById('dayzmPlayer');
        if (!player) return;
        
        player.classList.remove('hidden');
        player.style.display = 'block';
        player.style.animation = 'fadeIn 0.3s ease forwards';
        
        this.updateMusicButtonState(true);
    },

    hideFloatingButton() {
        const player = document.getElementById('dayzmPlayer');
        if (!player) return;
        
        player.style.animation = 'popupClose 0.25s ease forwards';
        setTimeout(() => {
            player.classList.add('hidden');
            player.style.display = 'none';
            player.style.animation = '';
        }, 250);
        
        this.updateMusicButtonState(false);
        
        if (typeof Player !== 'undefined' && Player.isOpen) {
            Player.close();
        }
    },

    updateMusicButtonState(isVisible) {
        const musicBtn = document.querySelector('.music-btn');
        if (!musicBtn) return;
        
        if (isVisible) {
            musicBtn.classList.add('active');
        } else {
            musicBtn.classList.remove('active');
        }
    }
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing app...');
    app.init();
    
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => app.goHome());
    }
});