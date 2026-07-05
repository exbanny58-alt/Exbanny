// ============================================
// УПРАВЛЕНИЕ ИГРОЙ - СПИСОК КЛИЕНТСКИХ МОДОВ
// ============================================

let clientModsList = [];

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ИГРЫ
// ============================================
async function initGamePage() {
    console.log('🎮 Инициализация страницы игры');
    await loadClientMods();
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
        
        // Фильтруем моды с client: true
        const clientMods = [];
        for (const [modId, attrs] of Object.entries(modsConfig)) {
            if (attrs.client === true) {
                // Ищем мод в списке из кеша
                const modInfo = modsList.find(m => m.id === modId);
                
                if (modInfo) {
                    clientMods.push({
                        id: modId,
                        name: modInfo.name || modId,
                        folder: modInfo.folder || modId,
                        path: modInfo.path || '',
                        version: modInfo.version || 'Неизвестно',
                        type: modInfo.type || 'unknown'
                    });
                } else {
                    // Если мод не найден в кеше, но есть в конфиге
                    clientMods.push({
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
        
        html += `
            <div class="game-mod-item" data-mod-id="${mod.id}">
                <div class="game-mod-info">
                    <div class="game-mod-name">
                        ${mod.name}
                        ${mod.type === 'workshop' ? '🛠️' : mod.type === 'custom' ? '📁' : '❓'}
                    </div>
                    <div class="game-mod-details">
                        <span class="game-mod-folder">${mod.folder}</span>
                        <span class="game-mod-version">v${mod.version}</span>
                        <span class="game-mod-type ${mod.type}">${mod.type === 'workshop' ? 'Workshop' : mod.type === 'custom' ? 'Кастомный' : 'Неизвестно'}</span>
                    </div>
                </div>
                <div class="game-mod-actions">
                    <button class="btn btn-connect-mod" onclick="connectClientMod('${mod.id}')" title="Подключить мод к игре">
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
// ПОДКЛЮЧЕНИЕ МОДА К ИГРЕ (ЗАГЛУШКА)
// ============================================
function connectClientMod(modId) {
    console.log(`🎮 Подключение клиентского мода: ${modId}`);
    
    const mod = clientModsList.find(m => m.id === modId);
    if (mod) {
        console.log(`📦 Мод: ${mod.name} (${mod.folder})`);
        console.log(`📂 Путь: ${mod.path}`);
    }
    
    // TODO: Здесь будет логика подключения мода к игре
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Подключение мода к игре: ${mod?.name || modId} (заглушка)`);
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================
window.initGamePage = initGamePage;
window.loadClientMods = loadClientMods;
window.renderClientMods = renderClientMods;
window.setupGameModsSearch = setupGameModsSearch;
window.connectClientMod = connectClientMod;

console.log('🎮 game.js загружен');