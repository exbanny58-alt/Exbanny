// ============================================
// ВИЗУАЛЬНЫЙ CSS РЕДАКТОР
// ============================================

// ============================================
// ЗАГРУЗКА/СОХРАНЕНИЕ НАСТРОЕК С СЕРВЕРА
// ============================================

async function loadEditorSettingsFromServer() {
    try {
        const response = await fetch('/api/editor/settings');
        const data = await response.json();
        
        if (data && Object.keys(data).length > 0) {
            applySettingsToControls(data);
            applyAllStyles(false);
            return true;
        } else {
            const defaults = {
                mainBg: '#10153d',
                mainOpacity: 50,
                mainBlur: 10,
                mainRadius: 20,
                mainPadding: 0,
                mainGap: 0,
                menuActiveBg: '#6a6d9b',
                menuOpacity: 50,
                textColor: '#ffffff',
                contentGap: 0,
                leftPadding: 30,
                rightPadding: 25,
                slideOverlayColor: '#261595',
                slideOverlayOpacity: 80,
                gradientColor1: '#4a3f8a',
                gradientColor2: '#1a1145',
                gradientDirection: '135',
                useGradient: false,
                playerBg: '#bcb8c6',
                playerOpacity: 20,
                playerBlur: 10,
                playerPadding: 20,
                playerRadius: 16,
                editorBg: '#10153d',
                editorOpacity: 95,
                editorBlur: 0,
                editorRadius: 20,
                editorPadding: 30,
                editorBorder: 1,
                overlayBg: '#000000',
                overlayOpacity: 70,
                overlayBlur: 8,
                isTransparent: false,
                isBlur: true
            };
            applySettingsToControls(defaults);
            applyAllStyles(false);
            return false;
        }
    } catch (e) {
        return false;
    }
}

async function saveEditorSettingsToServer(showNotification = true) {
    const settings = getCurrentSettings();
    
    try {
        const response = await fetch('/api/editor/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings)
        });
        const result = await response.json();
        
        if (result.success) {
            if (showNotification) {
                showNotification('✅ Настройки сохранены');
            }
            return true;
        } else {
            if (showNotification) {
                showNotification('❌ Ошибка сохранения');
            }
            return false;
        }
    } catch (e) {
        if (showNotification) {
            showNotification('❌ Ошибка сохранения');
        }
        return false;
    }
}

// ============================================
// ПОЛУЧЕНИЕ/ПРИМЕНЕНИЕ НАСТРОЕК
// ============================================

function getCurrentSettings() {
    return {
        mainBg: document.getElementById('mainBg').value,
        mainOpacity: parseInt(document.getElementById('mainOpacity').value),
        mainBlur: parseInt(document.getElementById('mainBlur').value),
        mainRadius: parseInt(document.getElementById('mainRadius').value),
        mainPadding: parseInt(document.getElementById('mainPadding').value),
        mainGap: parseInt(document.getElementById('mainGap').value),
        menuActiveBg: document.getElementById('menuActiveBg').value,
        menuOpacity: parseInt(document.getElementById('menuOpacity').value),
        textColor: document.getElementById('textColor').value,
        contentGap: parseInt(document.getElementById('contentGap').value),
        leftPadding: parseInt(document.getElementById('leftPadding').value),
        rightPadding: parseInt(document.getElementById('rightPadding').value),
        slideOverlayColor: document.getElementById('slideOverlayColor').value,
        slideOverlayOpacity: parseInt(document.getElementById('slideOverlayOpacity').value),
        gradientColor1: document.getElementById('gradientColor1').value,
        gradientColor2: document.getElementById('gradientColor2').value,
        gradientDirection: document.getElementById('gradientDirection').value,
        useGradient: document.getElementById('useGradient').checked,
        playerBg: document.getElementById('playerBg').value,
        playerOpacity: parseInt(document.getElementById('playerOpacity').value),
        playerBlur: parseInt(document.getElementById('playerBlur').value),
        playerPadding: parseInt(document.getElementById('playerPadding').value),
        playerRadius: parseInt(document.getElementById('playerRadius').value),
        editorBg: document.getElementById('editorBg').value,
        editorOpacity: parseInt(document.getElementById('editorOpacity').value),
        editorBlur: parseInt(document.getElementById('editorBlur').value),
        editorRadius: parseInt(document.getElementById('editorRadius').value),
        editorPadding: parseInt(document.getElementById('editorPadding').value),
        editorBorder: parseInt(document.getElementById('editorBorder').value),
        overlayBg: document.getElementById('overlayBg').value,
        overlayOpacity: parseInt(document.getElementById('overlayOpacity').value),
        overlayBlur: parseInt(document.getElementById('overlayBlur').value),
        isTransparent: document.getElementById('isTransparent').checked,
        isBlur: document.getElementById('isBlur').checked
    };
}

function applySettingsToControls(settings) {
    Object.keys(settings).forEach(key => {
        const el = document.getElementById(key);
        if (!el) return;
        
        const value = settings[key];
        
        if (el.type === 'checkbox') {
            el.checked = value;
        } else if (el.type === 'color') {
            el.value = value;
        } else if (el.type === 'range') {
            el.value = value;
            const valEl = document.getElementById(key + 'Val');
            if (valEl) {
                valEl.textContent = value;
            }
        } else {
            el.value = value;
        }
    });
    
    updateGradientDirection();
}

// ============================================
// ОТКРЫТИЕ / ЗАКРЫТИЕ
// ============================================

async function openEditor() {
    const overlay = document.getElementById('cssEditorOverlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    await loadEditorSettingsFromServer();
    updatePreview();
}

function closeEditor() {
    const overlay = document.getElementById('cssEditorOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// ПРИМЕНЕНИЕ ВСЕХ СТИЛЕЙ
// ============================================

function applyAllStyles(save = false) {
    const main = document.querySelector('main');
    const navActive = document.querySelector('.nav-item.active a');
    const musicPlayer = document.querySelector('.music-player');
    const overlay = document.getElementById('cssEditorOverlay');
    const content = document.querySelector('.content');
    const leftContent = document.querySelector('.left-content');
    const rightContent = document.querySelector('.right-content');
    const editorContainer = document.querySelector('.editor-container');
    
    // === ОСНОВНОЙ КОНТЕЙНЕР (main) ===
    if (main) {
        const bgColor = document.getElementById('mainBg').value;
        const blur = document.getElementById('mainBlur').value;
        const radius = document.getElementById('mainRadius').value;
        const padding = document.getElementById('mainPadding').value;
        const gap = document.getElementById('mainGap').value;
        const opacity = document.getElementById('mainOpacity').value / 100;
        
        const rgb = hexToRgb(bgColor);
        if (rgb) {
            main.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        }
        main.style.backdropFilter = `blur(${blur}px)`;
        main.style.borderRadius = `${radius}px`;
        main.style.padding = `${padding}px`;
        main.style.gap = `${gap}px`;
    }
    
    // === МЕНЮ АКТИВНЫЙ ПУНКТ ===
    if (navActive) {
        const color = document.getElementById('menuActiveBg').value;
        const opacity = document.getElementById('menuOpacity').value / 100;
        const rgb = hexToRgb(color);
        if (rgb) {
            navActive.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        }
    }
    
    // === КОНТЕНТ (расстояние между колонками) ===
    if (content) {
        const gap = document.getElementById('contentGap').value;
        content.style.gap = `${gap}px`;
    }
    
    // === ЛЕВАЯ КОЛОНКА ===
    if (leftContent) {
        const padding = document.getElementById('leftPadding').value;
        leftContent.style.padding = `${padding}px`;
    }
    
    // === ПРАВАЯ КОЛОНКА ===
    if (rightContent) {
        const padding = document.getElementById('rightPadding').value;
        rightContent.style.padding = `${padding}px`;
    }
    
    // === ЦВЕТ ТЕКСТА ===
    const textColor = document.getElementById('textColor').value;
    document.querySelectorAll('.left-content, .right-content, .content-placeholder h1, .right-placeholder h1, .music-player h2, .music-player p').forEach(el => {
        if (el) el.style.color = textColor;
    });
    
    // === МУЗЫКАЛЬНЫЙ ПЛЕЕР - С ЗАЩИТОЙ ===
    if (musicPlayer) {
        const color = document.getElementById('playerBg').value;
        const blur = document.getElementById('playerBlur').value;
        const opacity = document.getElementById('playerOpacity').value / 100;
        const padding = document.getElementById('playerPadding').value;
        const radius = document.getElementById('playerRadius').value;
        
        const rgb = hexToRgb(color);
        if (rgb) {
            musicPlayer.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        }
        musicPlayer.style.backdropFilter = `blur(${blur}px)`;
        musicPlayer.style.padding = `${padding}px`;
        musicPlayer.style.borderRadius = `${radius}px`;
        
        // === ЗАЩИТА ЭЛЕМЕНТОВ ПЛЕЕРА ===
        // Прогресс-бар
        const progress = document.getElementById('progress');
        if (progress) {
            progress.style.width = '100%';
            progress.style.maxWidth = '300px';
            progress.style.flex = '0 0 auto';
        }
        
        // Кнопки управления
        const controls = musicPlayer.querySelectorAll('.controls button');
        controls.forEach(btn => {
            btn.style.flexShrink = '0';
        });
    }
    
    // === ОКНО РЕДАКТОРА ===
    if (editorContainer) {
        const bgColor = document.getElementById('editorBg').value;
        const blur = document.getElementById('editorBlur').value;
        const radius = document.getElementById('editorRadius').value;
        const padding = document.getElementById('editorPadding').value;
        const opacity = document.getElementById('editorOpacity').value / 100;
        const border = document.getElementById('editorBorder').value;
        
        const rgb = hexToRgb(bgColor);
        if (rgb) {
            editorContainer.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        }
        editorContainer.style.backdropFilter = `blur(${blur}px)`;
        editorContainer.style.borderRadius = `${radius}px`;
        editorContainer.style.padding = `${padding}px`;
        editorContainer.style.border = `${border}px solid rgba(255, 255, 255, 0.3)`;
    }
    
    // === ОВЕРЛЕЙ РЕДАКТОРА ===
    const overlayOpacity = document.getElementById('overlayOpacity').value / 100;
    const overlayBlur = document.getElementById('overlayBlur').value;
    const isTransparent = document.getElementById('isTransparent').checked;
    const isBlur = document.getElementById('isBlur').checked;
    const overlayBg = document.getElementById('overlayBg').value;
    
    const rgb = hexToRgb(overlayBg);
    if (rgb) {
        overlay.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${overlayOpacity})`;
    }
    overlay.style.backdropFilter = isBlur ? `blur(${overlayBlur}px)` : 'none';
    
    if (isTransparent) {
        overlay.classList.add('transparent');
    } else {
        overlay.classList.remove('transparent');
    }
    
    if (!isBlur) {
        overlay.classList.add('no-blur');
    } else {
        overlay.classList.remove('no-blur');
    }
    
    // === СОХРАНЕНИЕ НА СЕРВЕР ===
    if (save) {
        saveEditorSettingsToServer(true);
    }
    
    // === ОБНОВЛЕНИЕ ПРЕВЬЮ ===
    updatePreview();
}
// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// ============================================
// ОБНОВЛЕНИЕ ПРЕВЬЮ
// ============================================

function updatePreview() {
    const previewBox = document.querySelector('.preview-box');
    const previewText = document.querySelector('.preview-text');
    const previewCard = document.querySelector('.preview-card');
    
    if (previewBox) {
        const color = document.getElementById('mainBg').value;
        const blur = document.getElementById('mainBlur').value;
        const radius = document.getElementById('mainRadius').value;
        const opacity = document.getElementById('mainOpacity').value / 100;
        const rgb = hexToRgb(color);
        
        previewBox.style.background = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : color;
        previewBox.style.backdropFilter = `blur(${blur}px)`;
        previewBox.style.borderRadius = `${radius}px`;
        previewBox.style.borderColor = document.getElementById('textColor').value;
    }
    
    if (previewText) {
        previewText.style.color = document.getElementById('textColor').value;
    }
    
    if (previewCard) {
        const color1 = document.getElementById('gradientColor1').value;
        const color2 = document.getElementById('gradientColor2').value;
        const direction = document.getElementById('gradientDirection').value;
        const useGradient = document.getElementById('useGradient').checked;
        
        if (useGradient) {
            previewCard.style.background = `linear-gradient(${direction}deg, ${color1}, ${color2})`;
        } else {
            const color = document.getElementById('slideOverlayColor').value;
            const opacity = document.getElementById('slideOverlayOpacity').value / 100;
            const rgb = hexToRgb(color);
            previewCard.style.background = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : color;
        }
    }
}

// ============================================
// СБРОС
// ============================================

async function resetEditorStyles() {
    if (!confirm('Сбросить все изменения CSS?')) return;
    
    try {
        const response = await fetch('/api/editor/settings/defaults', {
            method: 'POST',
        });
        const result = await response.json();
        
        if (result.success && result.defaults) {
            applySettingsToControls(result.defaults);
            applyAllStyles(true);
            showNotification('🔄 Сброшено до стандартных настроек');
        } else {
            showNotification('❌ Ошибка сброса');
        }
    } catch (e) {
        showNotification('❌ Ошибка сброса');
    }
}

// ============================================
// НАПРАВЛЕНИЕ ГРАДИЕНТА
// ============================================

function updateGradientDirection() {
    const buttons = document.querySelectorAll('.gradient-direction button');
    const value = document.getElementById('gradientDirection').value;
    
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === value);
    });
}

function setGradientDirection(dir) {
    document.getElementById('gradientDirection').value = dir;
    updateGradientDirection();
    applyAllStyles(false);
}

// ============================================
// ЭКСПОРТ CSS
// ============================================

function exportCSS() {
    const css = `/* Сгенерировано визуальным редактором */
/* Основной контейнер */
main {
    background: ${document.querySelector('main')?.style.background || 'rgba(16, 21, 61, 0.5)'};
    backdrop-filter: ${document.querySelector('main')?.style.backdropFilter || 'blur(10px)'};
    border-radius: ${document.querySelector('main')?.style.borderRadius || '20px'};
    padding: ${document.querySelector('main')?.style.padding || '0px'};
    gap: ${document.querySelector('main')?.style.gap || '0px'};
}

/* Меню актив */
.nav-item.active a {
    background: ${document.querySelector('.nav-item.active a')?.style.background || 'rgba(106, 109, 155, 0.5)'};
}

/* Контент */
.content {
    gap: ${document.querySelector('.content')?.style.gap || '0px'};
}

.left-content {
    padding: ${document.querySelector('.left-content')?.style.padding || '30px'};
}

.right-content {
    padding: ${document.querySelector('.right-content')?.style.padding || '25px'};
}

/* Слайдер оверлей */
.slide-overlay {
    background: ${document.querySelector('.slide-overlay')?.style.background || 'rgba(38, 21, 149, 0.8)'};
}

/* Музыкальный плеер */
.music-player {
    background: ${document.querySelector('.music-player')?.style.background || 'rgba(188, 184, 198, 0.2)'};
    backdrop-filter: ${document.querySelector('.music-player')?.style.backdropFilter || 'blur(10px)'};
    padding: ${document.querySelector('.music-player')?.style.padding || '20px'};
    border-radius: ${document.querySelector('.music-player')?.style.borderRadius || '16px'};
}`;
    
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-style.css';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('✅ CSS экспортирован!');
}

// ============================================
// УВЕДОМЛЕНИЯ
// ============================================

function showNotification(message) {
    let notification = document.querySelector('.editor-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'editor-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 21, 61, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 12px 24px;
            color: #fff;
            font-family: "Nunito", sans-serif;
            font-size: 0.9rem;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform: translateX(-50%) translateY(20px);
            pointer-events: none;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
    
    clearTimeout(notification._hideTimeout);
    notification._hideTimeout = setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('input[type="range"]').forEach(range => {
        const displayId = range.id + 'Val';
        const display = document.getElementById(displayId);
        if (display) {
            range.addEventListener('input', function() {
                display.textContent = this.value;
                applyAllStyles(false);
            });
        }
    });
    
    document.querySelectorAll('.editor-controls input, .editor-controls select').forEach(input => {
        if (input.type !== 'range') {
            input.addEventListener('input', function() {
                applyAllStyles(false);
            });
            input.addEventListener('change', function() {
                applyAllStyles(false);
            });
        }
    });
    
    const applyBtn = document.querySelector('.editor-btn-success');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            applyAllStyles(true);
            showNotification('✅ Настройки применены и сохранены');
        });
    }
    
    updateGradientDirection();
    
    setTimeout(async function() {
        await loadEditorSettingsFromServer();
    }, 200);
});