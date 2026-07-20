// ============================================
// УПРАВЛЕНИЕ СЕРВЕРОМ - СПИСОК СЕРВЕРНЫХ МОДОВ
// ============================================

let serverModsList = [];
let serverLinks = {};
let isPageVisible = true;

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ СЕРВЕРА
// ============================================
async function initServerPage() {
    console.log('🖥️ Инициализация страницы сервера');
    
    await loadServerLinks();
    await loadServerMods();
    
    startAutoRefresh();
}

// ============================================
// АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ
// ============================================
let refreshInterval = null;

function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    refreshInterval = setInterval(async () => {
        if (isPageVisible) {
            await refreshServerData();
        }
    }, 10000);
    
    console.log('🔄 Автообновление запущено (каждые 10 сек)');
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('🔄 Автообновление остановлено');
    }
}

document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
});

// ============================================
// ОБНОВЛЕНИЕ ДАННЫХ
// ============================================
async function refreshServerData() {
    try {
        await loadServerLinks();
        
        let updated = false;
        serverModsList.forEach(mod => {
            const newState = serverLinks[mod.id] === true;
            if (mod.is_connected !== newState) {
                mod.is_connected = newState;
                updated = true;
            }
        });
        
        if (updated) {
            console.log('🔄 Обнаружены изменения, обновляем список');
            renderServerMods(serverModsList);
        }
    } catch (e) {
        console.warn('⚠️ Ошибка автообновления:', e);
    }
}

// ============================================
// ЗАГРУЗКА ПОДКЛЮЧЕННЫХ МОДОВ
// ============================================
async function loadServerLinks() {
    try {
        const response = await fetch('/api/server/links');
        const data = await response.json();
        if (data.success) {
            serverLinks = data.links || {};
            console.log(`🔗 Загружено ${Object.keys(serverLinks).length} подключенных модов`);
            return true;
        }
        return false;
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить список подключений:', e);
        return false;
    }
}

// ============================================
// ЗАГРУЗКА СЕРВЕРНЫХ МОДОВ
// ============================================
async function loadServerMods() {
    const container = document.getElementById('serverModsContainer');
    if (!container) {
        console.warn('Контейнер serverModsContainer не найден');
        return;
    }

    try {
        // Загружаем кеш модов
        let modsList = [];
        try {
            const cacheResponse = await fetch('/api/mods/cache');
            const cacheData = await cacheResponse.json();
            if (cacheData.success && cacheData.mods) {
                modsList = cacheData.mods;
            }
        } catch (e) {
            console.warn('⚠️ Не удалось загрузить кеш модов:', e);
        }

        // Загружаем конфиг модов
        const response = await fetch('/api/mods/config');
        const data = await response.json();
        
        if (!data.success) {
            container.innerHTML = `
                <div class="empty-mods">
                    <p>❌ Ошибка загрузки конфига</p>
                </div>
            `;
            return;
        }

        const modsConfig = data.config;
        const serverMods = [];
        
        for (const [modId, attrs] of Object.entries(modsConfig)) {
            // Показываем моды с флагом server ИЛИ server_mod
            if (attrs.server === true || attrs.server_mod === true) {
                const modInfo = modsList.find(m => m.id === modId);
                
                serverMods.push({
                    id: modId,
                    name: modInfo?.name || modId,
                    folder: modInfo?.folder || modId,
                    path: modInfo?.path || '',
                    version: modInfo?.version || 'Неизвестно',
                    type: modInfo?.type || 'unknown',
                    is_connected: serverLinks[modId] === true,
                    is_server: attrs.server === true,
                    is_server_mod: attrs.server_mod === true
                });
            }
        }

        serverModsList = serverMods;
        renderServerMods(serverMods);

    } catch (e) {
        console.error('❌ Ошибка загрузки серверных модов:', e);
        container.innerHTML = `
            <div class="empty-mods">
                <p>❌ Ошибка: ${e.message}</p>
            </div>
        `;
    }
}

// ============================================
// ОТРИСОВКА СПИСКА СЕРВЕРНЫХ МОДОВ
// ============================================
function renderServerMods(mods) {
    const container = document.getElementById('serverModsContainer');
    if (!container) return;

    const searchInput = document.getElementById('serverModsSearchInput');
    const searchValue = searchInput?.value?.toLowerCase() || '';

    let filtered = mods;
    if (searchValue) {
        filtered = mods.filter(m => 
            m.name.toLowerCase().includes(searchValue) || 
            m.folder.toLowerCase().includes(searchValue)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-mods">
                <p>📭 Серверных модов не найдено</p>
                ${mods.length === 0 ? '<p class="empty-hint">Отметьте моды как "Серверный" 🟡 или "СерверМод" 🔵 в разделе "Управление модами"</p>' : ''}
                ${searchValue ? '<p class="empty-hint">Попробуйте изменить поиск</p>' : ''}
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(mod => {
        const escapedPath = mod.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const isConnected = mod.is_connected || false;
        
        // Определяем тип мода
        let typeBadge = '';
        if (mod.is_server && mod.is_server_mod) {
            typeBadge = '<span class="server-type-badge both">🟡 Серверный + 🔵 СерверМод</span>';
        } else if (mod.is_server) {
            typeBadge = '<span class="server-type-badge server">🟡 Серверный </span>';
        } else if (mod.is_server_mod) {
            typeBadge = '<span class="server-type-badge server-mod">🔵 СерверМод (-mod=)</span>';
        }
        
        html += `
            <div class="server-mod-item" data-mod-id="${mod.id}">
                <div class="server-mod-info">
                    <div class="server-mod-name">
                        ${mod.name}
                        ${mod.type === 'workshop' ? '🛠️' : mod.type === 'custom' ? '📁' : '❓'}
                        ${isConnected ? '<span class="mod-connected-badge">🔗 Подключен</span>' : '<span class="mod-not-connected-badge">⛔ Не подключен</span>'}
                        ${typeBadge}
                    </div>
                    <div class="server-mod-details">
                        <span class="server-mod-folder">${mod.folder}</span>
                        <span class="server-mod-version">v${mod.version}</span>
                        <span class="server-mod-type ${mod.type}">${mod.type === 'workshop' ? 'Workshop' : mod.type === 'custom' ? 'Кастомный' : 'Неизвестно'}</span>
                    </div>
                </div>
                <div class="server-mod-actions">
                    <button class="btn btn-connect-mod ${isConnected ? 'connected' : ''}" 
                            onclick="toggleModConnection('${mod.id}')" 
                            title="${isConnected ? 'Отключить мод от сервера' : 'Подключить мод к серверу'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            ${isConnected ? 
                                '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>' :
                                '<path d="M12 5v14"/><path d="M5 12h14"/>'
                            }
                        </svg>
                        ${isConnected ? 'Отключить' : 'Подключить'}
                    </button>
                    
                    <button class="btn-mod-folder" onclick="openModFolder('${escapedPath}')" title="Открыть папку мода" ${!mod.path ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================
// ПОДКЛЮЧЕНИЕ/ОТКЛЮЧЕНИЕ МОДА К СЕРВЕРУ
// ============================================
async function toggleModConnection(modId) {
    console.log(`🔌 Переключение подключения мода: ${modId}`);
    
    const mod = serverModsList.find(m => m.id === modId);
    if (!mod) {
        if (typeof notifications !== 'undefined') {
            notifications.error('Мод не найден');
        }
        return;
    }

    if (!mod.path) {
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к моду не найден');
        }
        return;
    }

    try {
        const settingsResponse = await fetch('/api/settings');
        const settings = await settingsResponse.json();
        
        if (!settings.server_exe || !settings.server_exe.trim()) {
            if (typeof notifications !== 'undefined') {
                notifications.warning('Сначала укажите путь к серверу в настройках');
            }
            return;
        }

        const serverDir = getServerDirectory(settings.server_exe);
        if (!serverDir) {
            if (typeof notifications !== 'undefined') {
                notifications.error('Не удалось определить папку сервера');
            }
            return;
        }

        const isConnected = serverLinks[modId] === true;
        
        // Блокируем кнопку на время операции
        const btn = document.querySelector(`.server-mod-item[data-mod-id="${modId}"] .btn-connect-mod`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '⏳ ...';
        }

        if (isConnected) {
            // Отключаем
            const response = await fetch(`/api/server/mods/${modId}/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            
            if (data.success) {
                delete serverLinks[modId];
                mod.is_connected = false;
                if (typeof notifications !== 'undefined') {
                    notifications.success(`Мод "${mod.name}" отключён от сервера`);
                }
            } else {
                if (typeof notifications !== 'undefined') {
                    notifications.error(data.message || 'Ошибка отключения');
                }
            }
        } else {
            // Подключаем
            const response = await fetch(`/api/server/mods/${modId}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mod_path: mod.path,
                    mod_name: mod.name,
                    mod_folder: mod.folder,
                    server_dir: serverDir
                })
            });
            const data = await response.json();
            
            if (data.success) {
                serverLinks[modId] = true;
                mod.is_connected = true;
                if (typeof notifications !== 'undefined') {
                    notifications.success(`Мод "${mod.name}" подключён к серверу`);
                }
            } else {
                if (typeof notifications !== 'undefined') {
                    notifications.error(data.message || 'Ошибка подключения');
                }
            }
        }
        
        // Обновляем список
        renderServerMods(serverModsList);
        
    } catch (e) {
        console.error('❌ Ошибка:', e);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка: ' + e.message);
        }
        renderServerMods(serverModsList);
    }
}
// server.js - добавляем функцию подтверждения

// ============================================
// ОЧИСТКА КОНФИГА ПОДКЛЮЧЕНИЙ
// ============================================
async function clearServerLinks() {
    // Показываем красивое модальное окно вместо confirm()
    showClearConfirmModal();
}

// ============================================
// КРАСИВОЕ МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ
// ============================================
function showClearConfirmModal() {
    // Удаляем старый модал если есть
    const oldModal = document.getElementById('clearConfirmModal');
    if (oldModal) {
        oldModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'clearConfirmModal';
    modal.className = 'modal-overlay clear-confirm-modal';
    modal.innerHTML = `
        <div class="modal-content modal-confirm">
            <div class="modal-header modal-confirm-header">
                <div class="modal-confirm-icon">⚠️</div>
                <h3>Очистка подключений</h3>
            </div>
            <div class="modal-body modal-confirm-body">
                <p class="modal-confirm-text">
                    Вы уверены, что хотите очистить все подключения?
                </p>
            </div>
            <div class="modal-footer modal-confirm-footer">
                <button class="btn btn-secondary" id="clearConfirmCancel">Отмена</button>
                <button class="btn btn-danger" id="clearConfirmOk">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    </svg>
                    Да, очистить всё
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Показываем с анимацией
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    // Обработчики
    modal.querySelector('#clearConfirmCancel').addEventListener('click', () => {
        closeClearConfirmModal();
    });

    modal.querySelector('#clearConfirmOk').addEventListener('click', () => {
        closeClearConfirmModal();
        executeClearServerLinks();
    });

    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeClearConfirmModal();
        }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeClearConfirmModal();
        }
    });
}

function closeClearConfirmModal() {
    const modal = document.getElementById('clearConfirmModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// ВЫПОЛНЕНИЕ ОЧИСТКИ
// ============================================
async function executeClearServerLinks() {
    const btn = document.getElementById('clearServerLinksBtn');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('loading');
        btn.innerHTML = '⏳ Очистка...';
    }
    
    try {
        const response = await fetch('/api/server/links/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем локальные данные
            serverLinks = {};
            serverModsList.forEach(mod => {
                mod.is_connected = false;
            });
            
            renderServerMods(serverModsList);
            
            if (typeof notifications !== 'undefined') {
                notifications.success(data.message);
            }
        } else {
            if (typeof notifications !== 'undefined') {
                notifications.error(data.message || 'Ошибка очистки');
            }
        }
    } catch (e) {
        console.error('❌ Ошибка очистки:', e);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка: ' + e.message);
        }
    }
    
    if (btn) {
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
            </svg>
            Очистить подключения
        `;
    }
}
// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function getServerDirectory(exePath) {
    if (!exePath) return null;
    const normalized = exePath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === -1) return null;
    return normalized.substring(0, lastSlash);
}

function setupServerModsSearch() {
    const searchInput = document.getElementById('serverModsSearchInput');
    if (searchInput) {
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        newInput.addEventListener('input', () => {
            renderServerMods(serverModsList);
        });
    }
}

async function refreshServerMods() {
    const btn = document.getElementById('refreshServerModsBtn');
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    await loadServerLinks();
    await loadServerMods();
    
    if (btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
    
    if (typeof notifications !== 'undefined') {
        notifications.success('Список серверных модов обновлён');
    }
}

function destroyServerPage() {
    stopAutoRefresh();
    console.log('🖥️ Страница сервера уничтожена');
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================
window.initServerPage = initServerPage;
window.loadServerMods = loadServerMods;
window.renderServerMods = renderServerMods;
window.refreshServerMods = refreshServerMods;
window.setupServerModsSearch = setupServerModsSearch;
window.toggleModConnection = toggleModConnection;
window.loadServerLinks = loadServerLinks;
window.destroyServerPage = destroyServerPage;
window.startAutoRefresh = startAutoRefresh;
window.stopAutoRefresh = stopAutoRefresh;
window.clearServerLinks = clearServerLinks;

console.log('🖥️ server.js загружен');