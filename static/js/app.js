// SPA приложение DayzM
const app = {
    config: null,
    currentPage: null,
    currentSettingsTab: 'general',

    async init() {
        try {
            const response = await fetch('/api/config');
            this.config = await response.json();
            this.render();
            EffectsManager.init();
            ColorPicker.init();
            this.initMusicButton();
        } catch (error) {
            console.error('Ошибка загрузки конфига:', error);
        }
    },

    render() {
        this.renderLogo();
        this.renderSettingsButton();
        this.renderSettingsSubnav();
        this.renderTabs();
        this.showHome();
        setTimeout(() => ColorPicker.applyColors(), 100);
    },

    renderLogo() {
        document.querySelector('.logo .dayz').textContent = this.config.app.logo.text;
        document.querySelector('.logo .m').textContent = this.config.app.logo.accent;
        document.title = this.config.app.title;
    },

    renderSettingsButton() {
        const btn = document.querySelector('.settings-btn');
        if (this.config.settings && this.config.settings.icon) {
            btn.innerHTML = this.config.settings.icon;
        }
        btn.addEventListener('click', () => this.togglePage('settings'));
    },

    renderSettingsSubnav() {
        document.querySelectorAll('.subnav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.settingsTab;
                this.switchSettingsTab(tabName);
            });
        });
    },

    renderTabs() {
        const nav = document.querySelector('.side-tabs');
        nav.innerHTML = '';

        this.config.pages.forEach(page => {
            const button = document.createElement('button');
            button.className = 'side-tab';
            button.dataset.pageId = page.id;
            button.innerHTML = `
                <span class="tab-icon">${page.icon}</span>
                ${page.name}
            `;
            button.addEventListener('click', () => this.togglePage(page.id));
            nav.appendChild(button);
        });

        SideLoader.init();
    },

    showHome() {
        document.getElementById('content').innerHTML = this.config.homePage.content;
        this.currentPage = 'home';
        this.hideSettingsSubnav();
        this.closeColorPickerIfOpen();

        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelector('.settings-btn').classList.remove('active');
        
        setTimeout(() => EffectsManager.applyToContent(), 50);
    },

    togglePage(pageId) {
        if (this.currentPage === pageId) {
            this.showHome();
        } else {
            this.openPage(pageId);
        }
    },

    openPage(pageId) {
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.pageId === pageId);
        });

        if (pageId === 'settings') {
            this.showSettingsSubnav();
            document.querySelector('.settings-btn').classList.add('active');
            document.querySelectorAll('.side-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            this.currentSettingsTab = 'general';
            document.querySelectorAll('.subnav-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.settingsTab === 'general');
            });
            this.loadSettingsContent('general');
        } else {
            this.hideSettingsSubnav();
            this.closeColorPickerIfOpen();
            document.querySelector('.settings-btn').classList.remove('active');
            const page = this.config.pages.find(p => p.id === pageId);
            if (page) {
                document.getElementById('content').innerHTML = page.content;
                setTimeout(() => EffectsManager.applyToContent(), 50);
            }
        }

        this.currentPage = pageId;
    },
    
    showSettingsSubnav() {
        document.getElementById('settingsSubnav').classList.add('visible');
    },

    hideSettingsSubnav() {
        document.getElementById('settingsSubnav').classList.remove('visible');
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
                            <svg viewBox='0 0 24 24' fill='none' stroke='#7acc7a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
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
        if (!musicBtn) return;

        // Находим контейнер плеера
        const player = document.getElementById('dayzmPlayer');
        if (!player) return;

        // По умолчанию плавающая кнопка скрыта
        player.classList.add('hidden');
        player.style.display = 'none';

        // Обработчик клика по кнопке в топ-панели - только показывает/скрывает плавающую кнопку
        musicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFloatingButton();
        });

        // Синхронизация с закрытием тела плеера через крестик
        const closeBtn = document.getElementById('playerClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Закрываем только тело плеера, плавающая кнопка остаётся
                if (typeof Player !== 'undefined' && Player.isOpen) {
                    Player.close();
                }
                this.updateMusicButtonState(true);
            });
        }

        // Когда плавающая кнопка открывает плеер - синхронизируем состояние
        if (typeof Player !== 'undefined') {
            // Перехватываем открытие плеера через плавающую кнопку
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
                // Плавающая кнопка остаётся видимой
                app.updateMusicButtonState(true);
            };
        }
    },

    // Показывает/скрывает ТОЛЬКО плавающую кнопку (не тело плеера)
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
        
        // НЕ открываем плеер автоматически!
        // Пользователь сам кликнет по плавающей кнопке когда захочет
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
        
        // Если тело плеера открыто - закрываем его
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
    app.init();
    document.querySelector('.logo').addEventListener('click', () => app.goHome());
});