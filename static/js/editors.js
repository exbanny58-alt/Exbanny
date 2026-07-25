// ============================================
// РЕДАКТОРЫ - ПОЛНАЯ ЛОГИКА
// ============================================

// Конфигурация редакторов
const EDITORS_CONFIG = {
    // ============ НОВЫЙ РЕДАКТОР СЕРВЕРА ============
    server: {
        id: 'server',
        name: 'Редакторы сервера',
        icon: '⚙️',
        description: 'Инструменты для редактирования файлов сервера DayZ',
        type: 'custom',
        init: 'initServerEditor',
        tiles: [
            {
                id: 'server_config',
                icon: '⚙️',
                title: 'Редактор serverDZ.cfg',
                description: 'Основной конфигурационный файл сервера DayZ',
                badge: 'Основной',
                init: 'initServerConfigEditor'
            },
            {
                id: 'types_editor',
                icon: '📦',
                title: 'Редактор types.xml',
                description: 'Настройка лута через файл types.xml',
                badge: 'Лут',
                init: 'initTypesEditor'
            }
            // Сюда можно будет добавить другие редакторы серверных файлов
        ]
    },
    // ================================================
    mpg: {
        id: 'mpg',
        name: 'MPG Spawner Editor',
        icon: '📍',
        description: 'Редактор точек спавна для мода MPG Spawner',
        type: 'custom',
        init: 'initMpgEditor',
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
    },
    fc_fish: {
        id: 'fc_fish',
        name: 'FC Fish Config Editor',
        icon: '🐟',
        description: 'Редактор конфига рыболовного мода FC Fish',
        type: 'custom',
        init: 'initFcFishEditor',
        tiles: []
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
                contentArea.innerHTML = `
                    <div class="editor-placeholder">
                        <div class="editor-placeholder-icon">📂</div>
                        <p class="editor-placeholder-title">Выберите редактор</p>
                        <p class="editor-placeholder-text">Выберите редактор из выпадающего списка выше</p>
                    </div>
                `;
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
    
    // ПЕРВЫЙ: Редакторы сервера
    const serverOption = document.createElement('option');
    serverOption.value = 'server';
    serverOption.textContent = '⚙️ Редакторы сервера';
    select.appendChild(serverOption);
    
    // ВТОРОЙ: MPG Spawner Editor
    const mpgOption = document.createElement('option');
    mpgOption.value = 'mpg';
    mpgOption.textContent = '📍 MPG Spawner Editor';
    select.appendChild(mpgOption);
    
    // ТРЕТИЙ: FC Fish Config Editor
    const fcFishOption = document.createElement('option');
    fcFishOption.value = 'fc_fish';
    fcFishOption.textContent = '🐟 FC Fish Config Editor';
    select.appendChild(fcFishOption);
}

// ============================================
// ОТКРЫТЬ РЕДАКТОР
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
    
    // Если у редактора есть плитки - показываем их
    if (config.tiles && config.tiles.length > 0) {
        renderTiles(contentArea, config);
    } else {
        // Иначе сразу загружаем редактор
        if (config.init && typeof window[config.init] === 'function') {
            window[config.init]();
        } else {
            // Если функция не загружена - подгружаем скрипт
            loadEditorScript(editorId, config);
        }
    }
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`📂 Открыт: ${config.name}`);
    }
}

// ============================================
// ЗАГРУЗКА СКРИПТА РЕДАКТОРА
// ============================================
function loadEditorScript(editorId, config) {
    const contentArea = document.getElementById('editorContentArea');
    if (!contentArea) return;
    
    contentArea.innerHTML = `
        <div class="editor-placeholder">
            <div class="editor-placeholder-icon">⏳</div>
            <p>Загрузка ${config.name}...</p>
        </div>
    `;
    
    let scriptSrc = '';
    if (editorId === 'server') {
        // Для серверных редакторов грузим server_editors.js
        scriptSrc = '/static/js/server_editors.js';
    } else if (editorId === 'mpg') {
        scriptSrc = '/static/js/mpg_editor.js';
    } else if (editorId === 'fc_fish') {
        scriptSrc = '/static/js/fc_fish_editor.js';
    } else {
        contentArea.innerHTML = `
            <div class="editor-placeholder">
                <div class="editor-placeholder-icon">❌</div>
                <p>Неизвестный редактор</p>
            </div>
        `;
        return;
    }
    
    // Проверяем, не загружен ли уже скрипт
    if (typeof window[config.init] === 'function') {
        window[config.init]();
        return;
    }
    
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.onload = function() {
        if (typeof window[config.init] === 'function') {
            window[config.init]();
        } else {
            contentArea.innerHTML = `
                <div class="editor-placeholder">
                    <div class="editor-placeholder-icon">❌</div>
                    <p>Ошибка загрузки ${config.name}</p>
                </div>
            `;
        }
    };
    script.onerror = function() {
        contentArea.innerHTML = `
            <div class="editor-placeholder">
                <div class="editor-placeholder-icon">❌</div>
                <p>Не удалось загрузить ${config.name}</p>
            </div>
        `;
    };
    document.head.appendChild(script);
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
            <div class="editor-tile-wrapper">
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
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="editor-tiles-wrapper">
            <div class="editor-tiles-grid">
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
        if (tileId === 'server_config') {
            scriptSrc = '/static/js/server_config_editor.js';
        } else if (tileId === 'mpg_spawner') {
            scriptSrc = '/static/js/mpg_editor.js';
        } else if (tileId === 'loot_extractor') {
            scriptSrc = '/static/js/loot_extractor.js';
        } else if (tileId === 'fc_fish') {
            scriptSrc = '/static/js/fc_fish_editor.js';
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
// ВОЗВРАТ К ПЛИТКАМ (для server_config_editor.js)
// ============================================
function backToServerTiles() {
    const container = document.getElementById('editorContentArea');
    if (!container) return;
    
    // Удаляем кнопку "Назад" если она есть
    const backBtn = document.querySelector('.server-config-back-btn');
    if (backBtn) {
        backBtn.remove();
    }
    
    // Переоткрываем редактор сервера
    if (currentEditor && EDITORS_CONFIG[currentEditor]) {
        renderTiles(container, EDITORS_CONFIG[currentEditor]);
    } else {
        const serverConfig = EDITORS_CONFIG['server'];
        if (serverConfig) {
            renderTiles(container, serverConfig);
        }
    }
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
// ВОЗВРАТ К ВЫБОРУ РЕДАКТОРА (для fc_fish_editor.js)
// ============================================
function backToEditorSelect() {
    const container = document.getElementById('editorContentArea');
    if (!container) return;
    
    // Удаляем кнопку "Назад" если она есть
    const backBtn = document.querySelector('.fc-fish-back-btn');
    if (backBtn) {
        backBtn.remove();
    }
    
    // Показываем пустое состояние
    container.innerHTML = `
        <div class="editor-placeholder">
            <div class="editor-placeholder-icon">📂</div>
            <p class="editor-placeholder-title">Выберите редактор</p>
            <p class="editor-placeholder-text">Выберите редактор из выпадающего списка выше</p>
        </div>
    `;
    
    // Сбрасываем выпадающий список
    const select = document.getElementById('editorSelect');
    if (select) {
        select.value = '';
    }
    
    currentEditor = null;
}

// ============================================
// ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ
// ============================================
window.initEditorsPage = initEditorsPage;
window.openEditor = openEditor;
window.renderTiles = renderTiles;
window.openTile = openTile;
window.backToTiles = backToTiles;
window.backToServerTiles = backToServerTiles;
window.backToEditorSelect = backToEditorSelect;
window.populateEditorSelect = populateEditorSelect;

console.log('📝 editors.js загружен');