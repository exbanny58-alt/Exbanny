// ============================================
// ГЛАВНЫЙ ОБЪЕКТ APP
// ============================================

const app = {
    config: null,
    currentPage: null,
    currentSettingsTab: 'general',
    isSettingsOpen: false,
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