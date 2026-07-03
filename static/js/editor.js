// ============================================
// ВИЗУАЛЬНЫЙ CSS РЕДАКТОР
// ============================================

// ============================================
// ОТКРЫТИЕ / ЗАКРЫТИЕ
// ============================================
function openEditor() {
    const overlay = document.getElementById('cssEditorOverlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadCurrentStyles();
    updatePreview();
}

function closeEditor() {
    const overlay = document.getElementById('cssEditorOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// ЗАГРУЗКА ТЕКУЩИХ СТИЛЕЙ
// ============================================
function loadCurrentStyles() {
    const main = document.querySelector('main');
    const body = document.body;
    const navActive = document.querySelector('.nav-item.active a');
    const slideOverlay = document.querySelector('.slide-overlay');
    const musicPlayer = document.querySelector('.music-player');
    const content = document.querySelector('.content');
    const leftContent = document.querySelector('.left-content');
    const rightContent = document.querySelector('.right-content');
    const editorContainer = document.querySelector('.editor-container');
    
    // Основной контейнер
    if (main) {
        const bg = window.getComputedStyle(main).background || 'rgba(16, 21, 61, 0.5)';
        const blur = parseInt(window.getComputedStyle(main).backdropFilter.replace('blur(', '')) || 10;
        const radius = parseInt(window.getComputedStyle(main).borderRadius) || 20;
        const padding = parseInt(window.getComputedStyle(main).padding) || 0;
        const gap = parseInt(window.getComputedStyle(main).gap) || 0;
        
        document.getElementById('mainBg').value = extractColor(bg) || '#10153d';
        document.getElementById('mainBlur').value = blur;
        document.getElementById('mainBlurVal').textContent = blur;
        document.getElementById('mainRadius').value = radius;
        document.getElementById('mainRadiusVal').textContent = radius;
        document.getElementById('mainPadding').value = padding;
        document.getElementById('mainPaddingVal').textContent = padding;
        document.getElementById('mainGap').value = gap;
        document.getElementById('mainGapVal').textContent = gap;
    }
    
    // Меню актив
    if (navActive) {
        const bg = window.getComputedStyle(navActive).background;
        document.getElementById('menuActiveBg').value = extractColor(bg) || '#6a6d9b';
    }
    
    // Контент
    if (content) {
        const gap = parseInt(window.getComputedStyle(content).gap) || 0;
        document.getElementById('contentGap').value = gap;
        document.getElementById('contentGapVal').textContent = gap;
    }
    
    // Левая колонка
    if (leftContent) {
        const padding = parseInt(window.getComputedStyle(leftContent).padding) || 30;
        document.getElementById('leftPadding').value = padding;
        document.getElementById('leftPaddingVal').textContent = padding;
    }
    
    // Правая колонка
    if (rightContent) {
        const padding = parseInt(window.getComputedStyle(rightContent).padding) || 25;
        document.getElementById('rightPadding').value = padding;
        document.getElementById('rightPaddingVal').textContent = padding;
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function extractColor(bg) {
    const rgba = bg.match(/rgba?\([^)]+\)/);
    if (rgba) return rgba[0];
    const hex = bg.match(/#[a-fA-F0-9]{6}/);
    if (hex) return hex[0];
    return null;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToRgba(rgb, alpha) {
    if (!rgb) return `rgba(0,0,0,${alpha})`;
    const match = rgb.match(/(\d+)/g);
    if (match && match.length >= 3) {
        return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
    }
    return `rgba(0,0,0,${alpha})`;
}

// ============================================
// ПРИМЕНЕНИЕ ВСЕХ СТИЛЕЙ
// ============================================
function applyAllStyles() {
    const main = document.querySelector('main');
    const navActive = document.querySelector('.nav-item.active a');
    const slideOverlay = document.querySelector('.slide-overlay');
    const musicPlayer = document.querySelector('.music-player');
    const overlay = document.getElementById('cssEditorOverlay');
    const content = document.querySelector('.content');
    const leftContent = document.querySelector('.left-content');
    const rightContent = document.querySelector('.right-content');
    const editorContainer = document.querySelector('.editor-container');
    
    // === ОСНОВНОЙ КОНТЕЙНЕР ===
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
    
    // === МЕНЮ АКТИВ ===
    if (navActive) {
        const color = document.getElementById('menuActiveBg').value;
        const opacity = document.getElementById('menuOpacity').value / 100;
        const rgb = hexToRgb(color);
        if (rgb) {
            navActive.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        }
    }
    
    // === КОНТЕНТ ===
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
    
    // === СЛАЙДЕР ОВЕРЛЕЙ ===
    if (slideOverlay) {
        const color1 = document.getElementById('gradientColor1').value;
        const color2 = document.getElementById('gradientColor2').value;
        const direction = document.getElementById('gradientDirection').value;
        const useGradient = document.getElementById('useGradient').checked;
        const overlayColor = document.getElementById('slideOverlayColor').value;
        const opacity = document.getElementById('slideOverlayOpacity').value / 100;
        
        if (useGradient) {
            slideOverlay.style.background = `linear-gradient(${direction}deg, ${color1}, ${color2})`;
        } else {
            const rgb = hexToRgb(overlayColor);
            if (rgb) {
                slideOverlay.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
            }
        }
    }
    
    // === ПЛЕЕР ===
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
    
    // === ПРЕДПРОСМОТР ===
    updatePreview();
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
function resetEditorStyles() {
    if (!confirm('Сбросить все изменения CSS?')) return;
    
    const defaults = {
        mainBg: '#10153d',
        mainBlur: 10,
        mainRadius: 20,
        mainOpacity: 50,
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
        playerBlur: 10,
        playerOpacity: 20,
        playerPadding: 20,
        playerRadius: 16,
        editorBg: '#10153d',
        editorBlur: 0,
        editorRadius: 20,
        editorPadding: 30,
        editorOpacity: 95,
        editorBorder: 1,
        overlayBg: '#000000',
        overlayOpacity: 70,
        overlayBlur: 8,
        isTransparent: false,
        isBlur: true
    };
    
    // Применяем значения
    Object.keys(defaults).forEach(key => {
        const el = document.getElementById(key);
        if (el) {
            if (el.type === 'checkbox') {
                el.checked = defaults[key];
            } else if (el.type === 'color') {
                el.value = defaults[key];
            } else {
                el.value = defaults[key];
                const valEl = document.getElementById(key + 'Val');
                if (valEl) valEl.textContent = defaults[key];
            }
        }
    });
    
    // Обновить направление градиента
    updateGradientDirection();
    
    // Применить
    applyAllStyles();
    showNotification('🔄 CSS сброшен до значений по умолчанию');
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
    applyAllStyles();
}

// ============================================
// ОБНОВЛЕНИЕ ЗНАЧЕНИЙ ПОЛЗУНКОВ
// ============================================
function updateRangeValue(id, displayId) {
    const value = document.getElementById(id).value;
    const display = document.getElementById(displayId);
    if (display) display.textContent = value;
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
    
    // Скачиваем файл
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
    // Обновление значений ползунков
    document.querySelectorAll('input[type="range"]').forEach(range => {
        const displayId = range.id + 'Val';
        const display = document.getElementById(displayId);
        if (display) {
            range.addEventListener('input', function() {
                display.textContent = this.value;
                applyAllStyles();
            });
        }
    });
    
    // Автоприменение при изменении
    document.querySelectorAll('.editor-controls input, .editor-controls select').forEach(input => {
        if (input.type !== 'range') {
            input.addEventListener('input', applyAllStyles);
            input.addEventListener('change', applyAllStyles);
        }
    });
    
    // Направление градиента
    updateGradientDirection();
    
    // Применить стили при открытии
    setTimeout(applyAllStyles, 100);
});