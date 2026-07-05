// ============================================
// УПРАВЛЕНИЕ ИГРОЙ - СПИСОК КЛИЕНТСКИХ МОДОВ
// ============================================

let clientModsList = [];
let gameLinks = {};
let isGamePageVisible = true;
let gameRefreshInterval = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ИГРЫ
// ============================================
async function initGamePage() {
    console.log('🎮 Инициализация страницы игры');
    await loadGameLinks();
    await loadClientMods();
    startGameAutoRefresh();
}

// ============================================
// АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ
// ============================================
function startGameAutoRefresh() {
    if (gameRefreshInterval) {
        clearInterval(gameRefreshInterval);
        gameRefreshInterval = null;
    }
    
    gameRefreshInterval = setInterval(async () => {
        if (isGamePageVisible) {
            await refreshGameData();
        }
    }, 10000);
    
    console.log('🔄 Автообновление игры запущено (каждые 10 сек)');
}

function stopGameAutoRefresh() {
    if (gameRefreshInterval) {
        clearInterval(gameRefreshInterval);
        gameRefreshInterval = null;
        console.log('🔄 Автообновление игры остановлено');
    }
}

// Отслеживаем видимость страницы
document.addEventListener('visibilitychange', () => {
    isGamePageVisible = !document.hidden;
});

async function refreshGameData() {
    try {
        await loadGameLinks();
        let updated = false;
        clientModsList.forEach(mod => {
            const newState = gameLinks[mod.id] === true;
            if (mod.is_connected !== newState) {
                mod.is_connected = newState;
                updated = true;
            }
        });
        
        if (updated) {
            console.log('🔄 Обнаружены изменения в игре, обновляем список');
            renderClientMods(clientModsList);
        }
    } catch (e) {
        console.warn('⚠️ Ошибка автообновления игры:', e);
    }
}

// ============================================
// ЗАГРУЗКА ПОДКЛЮЧЕННЫХ МОДОВ ИГРЫ
// ============================================
async function loadGameLinks() {
    try {
        const response = await fetch('/api/game/links');
        const data = await response.json();
        if (data.success) {
            gameLinks = data.links || {};
            console.log(`🔗 Загружено ${Object.keys(gameLinks).length} подключенных модов игры`);
            return true;
        }
        return false;
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить список подключений игры:', e);
        return false;
    }
}

// ============================================
// ЗАГРУЗКА КЛИЕНТСКИХ МОДОВ ИЗ КОНФИГА
// ============================================
async function loadClientMods() {
    const container = document.getElementById('gameModsContainer');
    if (!container) {
        console.warn('Контейнер gameModsContainer не найден');
        return;
    }

    try {
        let modsList = [];
        let modsConfig = {};
        
        try {
            const cacheResponse = await fetch('/api/mods/cache');
            const cacheData = await cacheResponse.json();
            if (cacheData.success && cacheData.mods) {
                modsList = cacheData.mods;
            }
        } catch (e) {
            console.warn('⚠️ Не удалось загрузить кеш модов:', e);
        }

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

        modsConfig = data.config;
        
        const clientMods = [];
        for (const [modId, attrs] of Object.entries(modsConfig)) {
            if (attrs.client === true) {
                const modInfo = modsList.find(m => m.id === modId);
                
                if (modInfo) {
                    clientMods.push({
                        id: modId,
                        name: modInfo.name || modId,
                        folder: modInfo.folder || modId,
                        path: modInfo.path || '',
                        version: modInfo.version || 'Неизвестно',
                        type: modInfo.type || 'unknown',
                        is_connected: gameLinks[modId] === true
                    });
                } else {
                    clientMods.push({
                        id: modId,
                        name: modId,
                        folder: modId,
                        path: '',
                        version: 'Неизвестно',
                        type: 'unknown',
                        is_connected: gameLinks[modId] === true
                    });
                }
            }
        }

        clientModsList = clientMods;
        renderClientMods(clientMods);

    } catch (e) {
        console.error('❌ Ошибка загрузки клиентских модов:', e);
        container.innerHTML = `
            <div class="empty-mods">
                <p>❌ Ошибка: ${e.message}</p>
            </div>
        `;
    }
}

// ============================================
// ОТРИСОВКА СПИСКА КЛИЕНТСКИХ МОДОВ
// ============================================
function renderClientMods(mods) {
    const container = document.getElementById('gameModsContainer');
    if (!container) return;

    const searchInput = document.getElementById('gameModsSearchInput');
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
                <p>📭 Клиентских модов не найдено</p>
                ${mods.length === 0 ? '<p class="empty-hint">Отметьте моды как "КлиентМод" в разделе "Управление модами"</p>' : ''}
                ${searchValue ? '<p class="empty-hint">Попробуйте изменить поиск</p>' : ''}
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(mod => {
        const escapedPath = mod.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const isConnected = mod.is_connected || false;
        
        html += `
            <div class="game-mod-item" data-mod-id="${mod.id}">
                <div class="game-mod-info">
                    <div class="game-mod-name">
                        ${mod.name}
                        ${mod.type === 'workshop' ? '🛠️' : mod.type === 'custom' ? '📁' : '❓'}
                        ${isConnected ? '<span class="mod-connected-badge">🔗 Подключен</span>' : ''}
                    </div>
                    <div class="game-mod-details">
                        <span class="game-mod-folder">${mod.folder}</span>
                        <span class="game-mod-version">v${mod.version}</span>
                        <span class="game-mod-type ${mod.type}">${mod.type === 'workshop' ? 'Workshop' : mod.type === 'custom' ? 'Кастомный' : 'Неизвестно'}</span>
                    </div>
                </div>
                <div class="game-mod-actions">
                    <button class="btn btn-connect-mod ${isConnected ? 'connected' : ''}" 
                            onclick="toggleGameModConnection('${mod.id}')" 
                            title="${isConnected ? 'Отключить мод от игры' : 'Подключить мод к игре'}">
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
// ПОДКЛЮЧЕНИЕ/ОТКЛЮЧЕНИЕ МОДА К ИГРЕ
// ============================================
async function toggleGameModConnection(modId) {
    console.log(`🎮 Переключение подключения мода к игре: ${modId}`);
    
    const mod = clientModsList.find(m => m.id === modId);
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
        
        if (!settings.game_exe || !settings.game_exe.trim()) {
            if (typeof notifications !== 'undefined') {
                notifications.warning('Сначала укажите путь к игре в настройках');
            }
            return;
        }

        const gameDir = getGameDirectory(settings.game_exe);
        if (!gameDir) {
            if (typeof notifications !== 'undefined') {
                notifications.error('Не удалось определить папку игры');
            }
            return;
        }

        const isConnected = gameLinks[modId] === true;
        
        const btn = document.querySelector(`.game-mod-item[data-mod-id="${modId}"] .btn-connect-mod`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ ...';
        }

        if (isConnected) {
            const response = await fetch(`/api/game/mods/${modId}/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            
            if (data.success) {
                delete gameLinks[modId];
                mod.is_connected = false;
                if (typeof notifications !== 'undefined') {
                    notifications.success(`Мод "${mod.name}" отключён от игры`);
                }
            } else {
                if (typeof notifications !== 'undefined') {
                    notifications.error(data.message || 'Ошибка');
                }
            }
        } else {
            const response = await fetch(`/api/game/mods/${modId}/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mod_path: mod.path,
                    mod_name: mod.name,
                    mod_folder: mod.folder,
                    game_dir: gameDir
                })
            });
            const data = await response.json();
            
            if (data.success) {
                gameLinks[modId] = true;
                mod.is_connected = true;
                if (typeof notifications !== 'undefined') {
                    notifications.success(`Мод "${mod.name}" подключён к игре`);
                }
            } else {
                if (typeof notifications !== 'undefined') {
                    notifications.error(data.message || 'Ошибка');
                }
            }
        }
        
        renderClientMods(clientModsList);
        
    } catch (e) {
        console.error('❌ Ошибка:', e);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка: ' + e.message);
        }
        renderClientMods(clientModsList);
    }
}

// ============================================
// ПОЛУЧИТЬ ПАПКУ ИГРЫ ИЗ ПУТИ К EXE
// ============================================
function getGameDirectory(exePath) {
    if (!exePath) return null;
    const normalized = exePath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    if (lastSlash === -1) return null;
    return normalized.substring(0, lastSlash);
}

// ============================================
// ПОИСК КЛИЕНТСКИХ МОДОВ
// ============================================
function setupGameModsSearch() {
    const searchInput = document.getElementById('gameModsSearchInput');
    if (searchInput) {
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        newInput.addEventListener('input', () => {
            renderClientMods(clientModsList);
        });
    }
}

// ============================================
// ОБНОВЛЕНИЕ СПИСКА (кнопка)
// ============================================
async function refreshGameMods() {
    const btn = document.getElementById('refreshGameModsBtn');
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    await loadGameLinks();
    await loadClientMods();
    
    if (btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
    
    if (typeof notifications !== 'undefined') {
        notifications.success('Список клиентских модов обновлён');
    }
}

// ============================================
// ОСТАНОВКА АВТООБНОВЛЕНИЯ
// ============================================
function destroyGamePage() {
    stopGameAutoRefresh();
    console.log('🎮 Страница игры уничтожена');
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================
window.initGamePage = initGamePage;
window.loadClientMods = loadClientMods;
window.renderClientMods = renderClientMods;
window.setupGameModsSearch = setupGameModsSearch;
window.toggleGameModConnection = toggleGameModConnection;
window.refreshGameMods = refreshGameMods;
window.loadGameLinks = loadGameLinks;
window.destroyGamePage = destroyGamePage;
window.startGameAutoRefresh = startGameAutoRefresh;
window.stopGameAutoRefresh = stopGameAutoRefresh;

console.log('🎮 game.js загружен');