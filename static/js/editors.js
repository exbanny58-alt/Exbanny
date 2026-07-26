// ============================================
// РЕДАКТОРЫ - ПОЛНАЯ ЛОГИКА
// ============================================

// Конфигурация всех редакторов
const EDITORS_CONFIG = {
    mpg: {
        id: 'mpg',
        name: 'MPG Spawner Editor',
        icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>',
        type: 'custom',
        init: 'initMpgEditor',
        tile: {
            icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>',
            title: 'MPG Spawner',
            description: 'Редактор точек спавна для мода MPG Spawner'
        }
    }
};

// Текущее состояние
let currentEditor = null;
let currentFile = null;
let isMpgEditorOpen = false;

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
            currentFile = null;
            isMpgEditorOpen = false;
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
    
    for (const [key, config] of Object.entries(EDITORS_CONFIG)) {
        const option = document.createElement('option');
        option.value = key;
        // Убираем эмодзи из текста, оставляем только название
        option.textContent = `MPG Spawner Editor`;
        select.appendChild(option);
    }
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
    currentFile = null;
    isMpgEditorOpen = false;
    
    const contentArea = document.getElementById('editorContentArea');
    if (!contentArea) return;
    
    // Показываем плитку с редактором
    if (config.type === 'custom' && config.tile) {
        renderMpgTile(contentArea, config);
        return;
    }
    
    // Старый стиль для файлов
    if (config.type === 'files') {
        renderFileList(contentArea, config);
    } else {
        renderEditorPlaceholder(contentArea, config);
    }
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`${config.icon} Открыт: ${config.name}`);
    }
}

// ============================================
// ОТРИСОВКА ПЛИТКИ MPG EDITOR
// ============================================
function renderMpgTile(container, config) {
    container.innerHTML = `
        <div class="editor-tile-wrapper">
            <div class="editor-tile" onclick="openMpgEditor()">
                <div class="editor-tile-icon">${config.tile.icon}</div>
                <div class="editor-tile-content">
                    <h3 class="editor-tile-title">${config.tile.title}</h3>
                    <p class="editor-tile-description">${config.tile.description}</p>
                    <div class="editor-tile-badge">Нажмите для открытия</div>
                </div>
                <div class="editor-tile-arrow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9,18 15,12 9,6"/>
                    </svg>
                </div>
            </div>
        </div>
    `;
}
// ============================================
// ОТКРЫТЬ MPG EDITOR (по клику на плитку)
// ============================================
function openMpgEditor() {
    if (isMpgEditorOpen) return;
    isMpgEditorOpen = true;
    
    const container = document.getElementById('editorContentArea');
    if (!container) return;
    
    // Показываем загрузку
    container.innerHTML = `
        <div class="editor-placeholder">
            <div class="editor-placeholder-icon">⏳</div>
            <p>Загрузка редактора...</p>
        </div>
    `;
    
    // Проверяем, загружен ли mpg_editor.js
    if (typeof window.initMpgEditor !== 'function') {
        const script = document.createElement('script');
        script.src = '/static/js/mpg_editor.js';
        script.onload = function() {
            if (typeof window.initMpgEditor === 'function') {
                window.initMpgEditor();
            } else {
                container.innerHTML = `
                    <div class="editor-placeholder">
                        <div class="editor-placeholder-icon">❌</div>
                        <p>Ошибка загрузки редактора</p>
                    </div>
                `;
                isMpgEditorOpen = false;
            }
        };
        script.onerror = function() {
            container.innerHTML = `
                <div class="editor-placeholder">
                    <div class="editor-placeholder-icon">❌</div>
                    <p>Не удалось загрузить редактор</p>
                </div>
            `;
            isMpgEditorOpen = false;
        };
        document.head.appendChild(script);
        return;
    }
    
    window.initMpgEditor();
}

// ============================================
// ОТРИСОВКА СПИСКА ФАЙЛОВ (устаревшее)
// ============================================
function renderFileList(container, config) {
    container.innerHTML = `
        <div class="editor-header">
            <div class="editor-header-info">
                <span class="editor-header-icon">${config.icon}</span>
                <div>
                    <h2 class="editor-header-title">${config.name}</h2>
                    <p class="editor-header-subtitle">Выберите файл для редактирования</p>
                </div>
            </div>
        </div>
        <div class="editor-files-grid">
            ${config.files.map(file => `
                <div class="editor-file-tile" onclick="openFile('${config.id}', '${file}')">
                    <div class="editor-file-icon">📄</div>
                    <div class="editor-file-name">${file}</div>
                    <div class="editor-file-badge">В разработке</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// ОТРИСОВКА ПЛЕЙСХОЛДЕРА
// ============================================
function renderEditorPlaceholder(container, config) {
    container.innerHTML = `
        <div class="editor-placeholder">
            <div class="editor-placeholder-icon">${config.icon}</div>
            <h2 class="editor-placeholder-title">${config.name}</h2>
            <p class="editor-placeholder-text">
                Редактор "${config.name}" находится в разработке.<br>
                Функционал будет доступен в следующих обновлениях.
            </p>
            <div class="editor-placeholder-status">
                <span class="status-dot"></span>
                Статус: <span class="status-text">В разработке</span>
            </div>
        </div>
    `;
}

// ============================================
// ОТКРЫТЬ ФАЙЛ (устаревшее)
// ============================================
function openFile(editorId, fileName) {
    currentFile = fileName;
    const config = EDITORS_CONFIG[editorId];
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`📄 Открыт файл: ${fileName} (в разработке)`);
    }
    
    console.log(`📄 Открыт файл: ${fileName} в редакторе ${config.name}`);
    
    const contentArea = document.getElementById('editorContentArea');
    if (!contentArea) return;
    
    contentArea.innerHTML = `
        <div class="file-editor-placeholder">
            <div class="file-editor-header">
                <button class="btn btn-back" onclick="restoreFileList('${editorId}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15,18 9,12 15,6"/>
                    </svg>
                    Назад
                </button>
                <div class="file-editor-title">
                    <span class="file-editor-icon">📄</span>
                    <span>${fileName}</span>
                </div>
                <div class="file-editor-status">В разработке</div>
            </div>
            <div class="file-editor-body">
                <div class="file-editor-placeholder-icon">🔨</div>
                <div class="file-editor-placeholder-text">
                    <p>Редактор файла <strong>${fileName}</strong> находится в разработке.</p>
                    <p>Функционал будет доступен в следующих обновлениях.</p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// ВОССТАНОВИТЬ СПИСОК ФАЙЛОВ (устаревшее)
// ============================================
function restoreFileList(editorId) {
    const config = EDITORS_CONFIG[editorId];
    if (!config) return;
    
    const contentArea = document.getElementById('editorContentArea');
    if (!contentArea) return;
    
    renderFileList(contentArea, config);
    currentFile = null;
}

// ============================================
// ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ
// ============================================
window.initEditorsPage = initEditorsPage;
window.openEditor = openEditor;
window.openMpgEditor = openMpgEditor;
window.populateEditorSelect = populateEditorSelect;
window.renderFileList = renderFileList;
window.renderEditorPlaceholder = renderEditorPlaceholder;

console.log('📝 editors.js загружен');