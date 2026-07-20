// ============================================
// РЕДАКТОРЫ - ПОЛНАЯ ЛОГИКА
// ============================================

// Конфигурация редакторов (только один пункт в выпадающем меню)
const EDITORS_CONFIG = {
    mpg: {
        id: 'mpg',
        name: 'MPG Spawner Editor',
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>',
        type: 'custom',
        // Внутри этого редактора будет несколько плиток
        tiles: [
            {
                id: 'mpg_spawner',
                icon: '📍',
                title: 'MPG Spawner Editor',
                description: 'Редактор точек спавна для мода MPG Spawner',
                badge: 'Редактор',
                init: 'initMpgEditor'
            },
            {
                id: 'loot_extractor',
                icon: '📦',
                title: 'Loot Extractor',
                description: 'Справочник всех предметов DayZ с поиском',
                badge: 'Справочник',
                init: 'initLootExtractor'
            }
        ]
    }
};

// Текущее состояние
let currentEditor = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ РЕДАКТОРОВ
// ============================================
function initEditorsPage() {
    console.log('📝 Инициализация страницы редакторов');
    
    const select = document.getElementById('editorSelect');
    
    if (!select) {
        console.warn('⚠️ Элемент editorSelect не найден');
        return;
    }
    
    populateEditorSelect(select);
    
    select.addEventListener('change', function() {
        const value = this.value;
        if (value && EDITORS_CONFIG[value]) {
            openEditor(value);
        } else {
            const contentArea = document.getElementById('editorContentArea');
            if (contentArea) {
                contentArea.innerHTML = '';
            }
            currentEditor = null;
        }
    });
}

// ============================================
// ЗАПОЛНЕНИЕ ВЫПАДАЮЩЕГО СПИСКА
// ============================================
function populateEditorSelect(select) {
    while (select.options.length > 0) {
        select.remove(0);
    }
    
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '— Выберите редактор —';
    select.appendChild(emptyOption);
    
    // Только один пункт - MPG Spawner Editor
    const option = document.createElement('option');
    option.value = 'mpg';
    option.textContent = 'MPG Spawner Editor';
    select.appendChild(option);
}

// ============================================
// ОТКРЫТЬ РЕДАКТОР (показывает плитки)
// ============================================
function openEditor(editorId) {
    const config = EDITORS_CONFIG[editorId];
    if (!config) {
        console.error(`Редактор не найден: ${editorId}`);
        return;
    }
    
    currentEditor = editorId;
    
    const contentArea = document.getElementById('editorContentArea');
    if (!contentArea) return;
    
    // Показываем плитки редактора
    renderTiles(contentArea, config);
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`📂 Открыт: ${config.name}`);
    }
}

// ============================================
// ОТРИСОВКА ПЛИТОК РЕДАКТОРА
// ============================================
function renderTiles(container, config) {
    if (!config.tiles || config.tiles.length === 0) {
        container.innerHTML = `
            <div class="editor-placeholder">
                <div class="editor-placeholder-icon">📭</div>
                <p>Нет доступных инструментов</p>
            </div>
        `;
        return;
    }
    
    let tilesHtml = '';
    config.tiles.forEach(tile => {
        tilesHtml += `
            <div class="editor-tile" onclick="openTile('${tile.id}', '${tile.init}')">
                <div class="editor-tile-icon">${tile.icon}</div>
                <div class="editor-tile-content">
                    <h3 class="editor-tile-title">${tile.title}</h3>
                    <p class="editor-tile-description">${tile.description}</p>
                    <div class="editor-tile-badge">${tile.badge || 'Нажмите для открытия'}</div>
                </div>
                <div class="editor-tile-arrow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9,18 15,12 9,6"/>
                    </svg>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="editors-tiles-wrapper">
            <div class="editors-tiles-grid">
                ${tilesHtml}
            </div>
        </div>
    `;
}

// ============================================
// ОТКРЫТЬ КОНКРЕТНУЮ ПЛИТКУ
// ============================================
function openTile(tileId, initFunctionName) {
    console.log(`🔓 Открытие плитки: ${tileId}`);
    
    const container = document.getElementById('editorContentArea');
    if (!container) return;
    
    // Показываем загрузку
    container.innerHTML = `
        <div class="editor-placeholder">
            <div class="editor-placeholder-icon">⏳</div>
            <p>Загрузка...</p>
        </div>
    `;
    
    // Проверяем, загружена ли функция
    if (typeof window[initFunctionName] !== 'function') {
        // Определяем какой скрипт грузить
        let scriptSrc = '';
        if (tileId === 'mpg_spawner') {
            scriptSrc = '/static/js/mpg_editor.js';
        } else if (tileId === 'loot_extractor') {
            scriptSrc = '/static/js/loot_extractor.js';
        } else {
            container.innerHTML = `
                <div class="editor-placeholder">
                    <div class="editor-placeholder-icon">❌</div>
                    <p>Неизвестный инструмент</p>
                </div>
            `;
            return;
        }
        
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.onload = function() {
            if (typeof window[initFunctionName] === 'function') {
                window[initFunctionName]();
            } else {
                container.innerHTML = `
                    <div class="editor-placeholder">
                        <div class="editor-placeholder-icon">❌</div>
                        <p>Ошибка загрузки</p>
                    </div>
                `;
            }
        };
        script.onerror = function() {
            container.innerHTML = `
                <div class="editor-placeholder">
                    <div class="editor-placeholder-icon">❌</div>
                    <p>Не удалось загрузить инструмент</p>
                </div>
            `;
        };
        document.head.appendChild(script);
        return;
    }
    
    window[initFunctionName]();
}

// ============================================
// ВОЗВРАТ К ПЛИТКАМ (для mpg_editor.js)
// ============================================
function backToTiles() {
    const container = document.getElementById('editorContentArea');
    if (!container) return;
    
    // Удаляем кнопку "Назад" если она есть
    const backBtn = document.querySelector('.mpg-back-btn');
    if (backBtn) {
        backBtn.remove();
    }
    
    // Переоткрываем редактор
    if (currentEditor && EDITORS_CONFIG[currentEditor]) {
        renderTiles(container, EDITORS_CONFIG[currentEditor]);
    } else {
        // Или показываем плитки по умолчанию
        const defaultConfig = EDITORS_CONFIG['mpg'];
        if (defaultConfig) {
            renderTiles(container, defaultConfig);
        }
    }
}

// ============================================
// ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ
// ============================================
window.initEditorsPage = initEditorsPage;
window.openEditor = openEditor;
window.renderTiles = renderTiles;
window.openTile = openTile;
window.backToTiles = backToTiles;
window.populateEditorSelect = populateEditorSelect;

console.log('📝 editors.js загружен (с двумя плитками)');