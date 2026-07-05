// ============================================
// УПРАВЛЕНИЕ СЕРВЕРОМ - СПИСОК СЕРВЕРНЫХ МОДОВ
// ============================================

let serverModsList = [];

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ СЕРВЕРА
// ============================================
async function initServerPage() {
    console.log('🖥️ Инициализация страницы сервера');
    await loadServerMods();
}

// ============================================
// ЗАГРУЗКА СЕРВЕРНЫХ МОДОВ ИЗ КОНФИГА
// ============================================
async function loadServerMods() {
    const container = document.getElementById('serverModsContainer');
    if (!container) {
        console.warn('Контейнер serverModsContainer не найден');
        return;
    }

    try {
        // Сначала загружаем КЕШ модов (чтобы получить полную информацию)
        let modsList = [];
        let modsConfig = {};
        
        // Пробуем загрузить кеш
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

        modsConfig = data.config;
        
        // Фильтруем моды с server_mod: true
        const serverMods = [];
        for (const [modId, attrs] of Object.entries(modsConfig)) {
            if (attrs.server_mod === true) {
                // Ищем мод в списке из кеша
                const modInfo = modsList.find(m => m.id === modId);
                
                if (modInfo) {
                    serverMods.push({
                        id: modId,
                        name: modInfo.name || modId,
                        folder: modInfo.folder || modId,
                        path: modInfo.path || '',
                        version: modInfo.version || 'Неизвестно',
                        type: modInfo.type || 'unknown'
                    });
                } else {
                    // Если мод не найден в кеше, но есть в конфиге
                    serverMods.push({
                        id: modId,
                        name: modId,
                        folder: modId,
                        path: '',
                        version: 'Неизвестно',
                        type: 'unknown'
                    });
                }
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
// ПОЛУЧЕНИЕ ИНФОРМАЦИИ О МОДЕ
// ============================================
async function getModInfo(modId) {
    try {
        // Пробуем получить из кеша модов
        if (window.modsList && window.modsList.length > 0) {
            const mod = window.modsList.find(m => m.id === modId);
            if (mod) {
                return mod;
            }
        }
        
        // Если не нашли в кеше, запрашиваем у API
        const response = await fetch(`/api/mods/info/${modId}`);
        const data = await response.json();
        if (data.success) {
            return data.mod;
        }
        return null;
    } catch (e) {
        console.error(`❌ Ошибка получения информации о моде ${modId}:`, e);
        return null;
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
                ${mods.length === 0 ? '<p class="empty-hint">Отметьте моды как "СерверМод" в разделе "Управление модами"</p>' : ''}
                ${searchValue ? '<p class="empty-hint">Попробуйте изменить поиск</p>' : ''}
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(mod => {
        const escapedPath = mod.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        
        html += `
            <div class="server-mod-item" data-mod-id="${mod.id}">
                <div class="server-mod-info">
                    <div class="server-mod-name">
                        ${mod.name}
                        ${mod.type === 'workshop' ? '🛠️' : mod.type === 'custom' ? '📁' : '❓'}
                    </div>
                    <div class="server-mod-details">
                        <span class="server-mod-folder">${mod.folder}</span>
                        <span class="server-mod-version">v${mod.version}</span>
                        <span class="server-mod-type ${mod.type}">${mod.type === 'workshop' ? 'Workshop' : mod.type === 'custom' ? 'Кастомный' : 'Неизвестно'}</span>
                    </div>
                </div>
                <div class="server-mod-actions">
                    <!-- НОВАЯ КНОПКА ПОДКЛЮЧИТЬ -->
                    <button class="btn btn-connect-mod" onclick="connectMod('${mod.id}')" title="Подключить мод к серверу">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5v14"/>
                            <path d="M5 12h14"/>
                        </svg>
                        Подключить
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
// ПОИСК СЕРВЕРНЫХ МОДОВ
// ============================================
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

// ============================================
// ОБНОВЛЕНИЕ СПИСКА (кнопка)
// ============================================
async function refreshServerMods() {
    const btn = document.getElementById('refreshServerModsBtn');
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    await loadServerMods();
    
    if (btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
    
    if (typeof notifications !== 'undefined') {
        notifications.success('Список серверных модов обновлён');
    }
}

// ============================================
// ПОДКЛЮЧЕНИЕ МОДА К СЕРВЕРУ (ЗАГЛУШКА)
// ============================================
function connectMod(modId) {
    console.log(`🔌 Подключение мода: ${modId}`);
    
    // Находим мод в списке
    const mod = serverModsList.find(m => m.id === modId);
    if (mod) {
        console.log(`📦 Мод: ${mod.name} (${mod.folder})`);
        console.log(`📂 Путь: ${mod.path}`);
    }
    
    // TODO: Здесь будет логика подключения мода к серверу
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Подключение мода: ${mod?.name || modId} (заглушка)`);
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================
window.initServerPage = initServerPage;
window.loadServerMods = loadServerMods;
window.renderServerMods = renderServerMods;
window.refreshServerMods = refreshServerMods;
window.setupServerModsSearch = setupServerModsSearch;

console.log('🖥️ server.js загружен');