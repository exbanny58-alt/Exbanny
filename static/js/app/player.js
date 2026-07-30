// ============================================
// УПРАВЛЕНИЕ ПЛАВАЮЩИМ ПЛЕЕРОМ (APP-ЧАСТЬ)
// ============================================

app.initMusicButton = function() {
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

    this.overridePlayerMethods();
    console.log('✅ Music button initialized');
};

app.overridePlayerMethods = function() {
    if (typeof Player === 'undefined') return;

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
};

app.toggleFloatingButton = function() {
    const player = document.getElementById('dayzmPlayer');
    if (!player) return;

    if (player.classList.contains('hidden') || player.style.display === 'none') {
        this.showFloatingButton();
    } else {
        this.hideFloatingButton();
    }
};

app.showFloatingButton = function() {
    const player = document.getElementById('dayzmPlayer');
    if (!player) return;

    player.classList.remove('hidden');
    player.style.display = 'block';
    player.style.animation = 'fadeIn 0.3s ease forwards';
    this.updateMusicButtonState(true);
};

app.hideFloatingButton = function() {
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
};

app.updateMusicButtonState = function(isVisible) {
    const musicBtn = document.querySelector('.music-btn');
    if (!musicBtn) return;

    musicBtn.classList.toggle('active', isVisible);
};