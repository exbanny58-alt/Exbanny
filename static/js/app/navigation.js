// ============================================
// НАВИГАЦИЯ
// ============================================

app.showHome = function() {
    console.log('🏠 Showing home page');
    this.currentPage = 'home';
    this.isSettingsOpen = false;
    this.hideSettingsSubnav();
    this.closeColorPickerIfOpen();

    document.querySelectorAll('.side-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) settingsBtn.classList.remove('active');

    // Загружаем домашнюю страницу из БД
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.home_page) {
                document.getElementById('content').innerHTML = data.home_page.content;
                setTimeout(() => EffectsManager.applyToContent(), 50);
            } else {
                // Fallback
                document.getElementById('content').innerHTML = `
                    <div class='welcome-screen'>
                        <div class='welcome-logo'>
                            <span class='welcome-dayz'>Dayz</span><span class='welcome-m'>M</span>
                        </div>
                        <p class='welcome-subtitle'>Платформа управления сервером</p>
                        <div class='loader'>
                            <div class='inner one'></div>
                            <div class='inner two'></div>
                            <div class='inner three'></div>
                        </div>
                    </div>
                `;
                setTimeout(() => EffectsManager.applyToContent(), 50);
            }
        })
        .catch(() => {
            document.getElementById('content').innerHTML = `
                <div class='welcome-screen'>
                    <div class='welcome-logo'>
                        <span class='welcome-dayz'>Dayz</span><span class='welcome-m'>M</span>
                    </div>
                    <p class='welcome-subtitle'>Платформа управления сервером</p>
                    <div class='loader'>
                        <div class='inner one'></div>
                        <div class='inner two'></div>
                        <div class='inner three'></div>
                    </div>
                </div>
            `;
            setTimeout(() => EffectsManager.applyToContent(), 50);
        });
};

app.togglePage = function(pageId) {
    console.log('🔄 Toggle page:', pageId, 'current:', this.currentPage);

    if (pageId === 'settings') {
        if (this.currentPage === 'settings' || this.isSettingsOpen) {
            this.showHome();
            return;
        }
        this.openPage('settings');
        return;
    }

    if (pageId === 'home') {
        this.showHome();
        return;
    }

    if (this.currentPage === pageId) {
        this.showHome();
        return;
    }

    this.openPage(pageId);
};

app.openPage = function(pageId) {
    console.log('📄 Opening page:', pageId);

    if (pageId === 'settings') {
        this.openSettings();
        return;
    }

    this.isSettingsOpen = false;
    this.hideSettingsSubnav();
    this.closeColorPickerIfOpen();

    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) settingsBtn.classList.remove('active');

    document.querySelectorAll('.side-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.pageId === pageId);
    });

    // Загружаем страницу из БД
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.pages) {
                const page = data.pages.find(p => p.id === pageId);
                if (page) {
                    document.getElementById('content').innerHTML = page.content;
                    setTimeout(() => EffectsManager.applyToContent(), 50);
                } else {
                    this.showHome();
                }
            } else {
                this.showHome();
            }
        })
        .catch(() => {
            this.showHome();
        });

    this.currentPage = pageId;
};

app.openSettings = function() {
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
};

app.goHome = function() {
    this.showHome();
    ColorPicker.close();
};

// ---- Рендеринг кнопок навигации ----
app.renderSettingsButton = function() {
    const btn = document.querySelector('.settings-btn');
    if (!btn) {
        console.warn('⚠️ Settings button not found in DOM');
        return;
    }

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('⚙️ Settings button clicked');
        this.togglePage('settings');
    });

    console.log('✅ Settings button initialized');
};

app.updateActiveTab = function() {
    document.querySelectorAll('.side-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const pageId = tab.dataset.pageId;
            console.log('📄 Page clicked:', pageId);
            this.togglePage(pageId);
        });
    });
};