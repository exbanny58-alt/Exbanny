// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ============================================

app.init = async function() {
    console.log('🚀 App initializing...');
    
    this.config = window.__INITIAL_STATE__.config;
    console.log('✅ Config loaded:', this.config);
    
    this.applyInitialColors();
    this.applyInitialEffect();
    
    this.render();
    
    EffectsManager.init();
    ColorPicker.init();
    this.initMusicButton();
    
    setTimeout(() => EffectsManager.applyToContent(), 50);
    
    console.log('✅ App initialized successfully');
};

app.applyInitialColors = function() {
    const colors = window.__INITIAL_STATE__.colors;
    if (colors) {
        ColorPicker.colors = {
            accent: colors.accent || '#7acc7a',
            glowIntensity: colors.glowIntensity !== undefined ? colors.glowIntensity : 50
        };
        ColorPicker.applyColors();
        console.log('✅ Colors applied:', ColorPicker.colors);
    }
};

app.applyInitialEffect = function() {
    const effect = window.__INITIAL_STATE__.effect;
    if (effect && EffectsManager.effects[effect]) {
        EffectsManager.currentEffect = effect;
        console.log('✅ Effect set:', effect);
    }
};

app.render = function() {
    this.renderLogo();
    this.renderSettingsButton();
    this.renderSettingsSubnav();
    this.updateActiveTab();
    this.loadSettingsFromServer();
};

app.renderLogo = function() {
    if (this.config?.app) {
        document.title = this.config.app.title;
    }
};