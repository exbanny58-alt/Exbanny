// ============================================
// УПРАВЛЕНИЕ МОДАМИ (с кешированием)
// ============================================

let modsList = [];
let modsState = {};
let isModsReady = false;
let isCacheLoaded = false;

// Делаем доступными глобально
window.modsList = modsList;
window.isModsReady = isModsReady;
window._modsStats = null;

// Загрузка состояния модов
async function loadModsState() {
    try {
        const response = await fetch('/api/mods/state');
        const data = await response.json();
        if (data.success) {
            modsState = data.state;
        }
    } catch (e) {
        console.error('Ошибка загрузки состояния модов:', e);
    }
}

// Загрузка модов из кеша (МГНОВЕННО)
async function loadModsFromCache() {
    try {
        console.log('⚡ Загрузка модов из кеша...');
        const response = await fetch('/api/mods/cache');
        const data = await response.json();
        
        if (data.success && data.mods) {
            modsList = data.mods;
            window.modsList = modsList;
            
            modsList.forEach(mod => {
                if (modsState[mod.id] !== undefined) {
                    mod.enabled = modsState[mod.id];
                }
            });
            
            isModsReady = true;
            isCacheLoaded = true;
            window.isModsReady = isModsReady;
            window._modsStats = data.stats;
            
            console.log(`✅ Загружено ${data.stats.total} модов из кеша`);
            return true;
        } else {
            console.warn('⚠️ Кеш не найден, нужно сканирование');
            return false;
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки кеша:', e);
        return false;
    }
}

// Фоновое сканирование и обновление кеша
async function backgroundScanAndCache() {
    try {
        console.log('🔄 Фоновое сканирование модов...');
        const response = await fetch('/api/mods/scan-and-cache', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Кеш обновлён: ${data.stats.total} модов`);
            
            if (data.mods) {
                modsList = data.mods;
                window.modsList = modsList;
                window._modsStats = data.stats;
                
                const container = document.getElementById('modsListContainer');
                if (container) {
                    renderMods(modsList);
                    updateStats(data.stats);
                    if (typeof notifications !== 'undefined') {
                        notifications.info('Список модов обновлён');
                    }
                }
            }
        } else {
            console.warn('⚠️ Ошибка фонового сканирования:', data.message);
        }
    } catch (e) {
        console.error('❌ Ошибка фонового сканирования:', e);
    }
}

// Сканирование модов (вызывается при обновлении)
async function scanMods(showLoading = true) {
    const container = document.getElementById('modsListContainer');
    
    if (!container) {
        console.error('Контейнер modsListContainer не найден');
        return;
    }

    if (showLoading) {
        container.innerHTML = `
            <div class="loading-mods">
                <span class="spinner"></span>
                Сканирование модов...
            </div>
        `;
    }

    try {
        const response = await fetch('/api/mods/scan-and-cache', {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            modsList = data.mods;
            window.modsList = modsList;
            
            modsList.forEach(mod => {
                if (modsState[mod.id] !== undefined) {
                    mod.enabled = modsState[mod.id];
                }
            });

            renderMods(modsList);
            updateStats(data.stats);
            isModsReady = true;
            window.isModsReady = isModsReady;
            window._modsStats = data.stats;
            
            if (typeof notifications !== 'undefined') {
                notifications.success(`Найдено ${data.stats.total} модов`);
            }
        } else {
            container.innerHTML = `
                <div class="empty-mods">
                    <p>❌ ${data.message || 'Ошибка сканирования'}</p>
                    <p class="empty-hint">Проверьте пути в настройках</p>
                </div>
            `;
            if (typeof notifications !== 'undefined') {
                notifications.error(data.message || 'Ошибка сканирования модов');
            }
        }
    } catch (e) {
        container.innerHTML = `
            <div class="empty-mods">
                <p>❌ Ошибка: ${e.message}</p>
            </div>
        `;
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сканирования: ' + e.message);
        }
    }
}

// Мгновенное отображение модов (без сканирования)
function renderModsInstant() {
    const container = document.getElementById('modsListContainer');
    
    if (!container) {
        console.error('Контейнер modsListContainer не найден');
        return;
    }

    if (modsList.length > 0) {
        renderMods(modsList);
        if (window._modsStats) {
            updateStats(window._modsStats);
        }
    } else {
        container.innerHTML = `
            <div class="empty-mods">
                <p>📭 Модов не найдено</p>
                <p class="empty-hint">Нажмите "Обновить список" для сканирования</p>
            </div>
        `;
        updateStats({ total: 0, enabled: 0, workshop: 0, custom: 0 });
    }
}

// Отрисовка списка модов
function renderMods(mods) {
    const container = document.getElementById('modsListContainer');
    
    if (!container) {
        console.error('Контейнер modsListContainer не найден');
        return;
    }
    
    const searchInput = document.getElementById('modsSearchInput');
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
                <p>📭 Модов не найдено</p>
                ${searchValue ? '<p class="empty-hint">Попробуйте изменить поиск</p>' : ''}
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(mod => {
        const isEnabled = mod.enabled !== false;
        // Экранируем путь для безопасной передачи в onclick
        const escapedPath = mod.path.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += `
            <div class="mod-item" data-mod-id="${mod.id}">
                <div class="mod-info">
                    <div class="mod-name">
                        ${mod.name}
                        ${mod.type === 'workshop' ? '🛠️' : '📁'}
                    </div>
                    <div class="mod-details">
                        <span class="mod-folder">${mod.folder}</span>
                        <span class="mod-version">v${mod.version}</span>
                        <span class="mod-type ${mod.type}">${mod.type === 'workshop' ? 'Workshop' : 'Кастомный'}</span>
                        ${!mod.has_meta ? '<span class="mod-warning">⚠️ Нет meta.cpp</span>' : ''}
                    </div>
                </div>
                <div class="mod-actions">
                    <label class="mod-toggle">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} 
                               onchange="toggleMod('${mod.id}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-mod-folder" onclick="openModFolder('${escapedPath}')" title="Открыть папку мода">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    // Проверяем, что функция openModFolder доступна глобально
    if (typeof window.openModFolder === 'undefined') {
        console.warn('⚠️ openModFolder не определена глобально');
    }
}

// Обновление статистики
function updateStats(stats) {
    const totalEl = document.getElementById('totalModsCount');
    const enabledEl = document.getElementById('enabledModsCount');
    const workshopEl = document.getElementById('workshopModsCount');
    const customEl = document.getElementById('customModsCount');
    
    if (totalEl) totalEl.textContent = stats.total || 0;
    if (enabledEl) enabledEl.textContent = stats.enabled || 0;
    if (workshopEl) workshopEl.textContent = stats.workshop || 0;
    if (customEl) customEl.textContent = stats.custom || 0;
}

// Включение/выключение мода
async function toggleMod(modId, enabled) {
    try {
        const response = await fetch('/api/mods/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mod_id: modId, enabled: enabled })
        });

        const data = await response.json();
        if (data.success) {
            modsState[modId] = enabled;
            
            const mod = modsList.find(m => m.id === modId);
            if (mod) {
                mod.enabled = enabled;
                const stats = {
                    total: modsList.length,
                    workshop: modsList.filter(m => m.type === 'workshop').length,
                    custom: modsList.filter(m => m.type === 'custom').length,
                    enabled: modsList.filter(m => m.enabled !== false).length
                };
                updateStats(stats);
                window._modsStats = stats;
            }
            
            if (typeof notifications !== 'undefined') {
                notifications.success(enabled ? 'Мод включён' : 'Мод выключен');
            }
        } else {
            if (typeof notifications !== 'undefined') {
                notifications.error(data.message || 'Ошибка');
            }
        }
    } catch (e) {
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка: ' + e.message);
        }
    }
}

// Открыть папку с модом
async function openModFolder(path) {
    console.log('📂 openModFolder вызвана с путём:', path);
    
    if (!path) {
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к моду не указан');
        }
        return;
    }
    
    try {
        const response = await fetch('/api/open/explorer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: path })
        });
        const data = await response.json();
        
        if (data.success) {
            if (typeof notifications !== 'undefined') {
                notifications.success('Папка открыта');
            }
        } else {
            if (typeof notifications !== 'undefined') {
                notifications.error(data.message || 'Ошибка открытия папки');
            }
        }
    } catch (e) {
        console.error('❌ Ошибка открытия папки:', e);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка: ' + e.message);
        }
    }
}

// Поиск модов
function setupModsSearch() {
    const searchInput = document.getElementById('modsSearchInput');
    if (searchInput) {
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        newInput.addEventListener('input', () => {
            renderMods(modsList);
        });
    }
}

// Прикрепляем обработчики кнопок
function attachModsButtonHandlers() {
    const refreshBtn = document.getElementById('refreshModsBtn');
    if (refreshBtn) {
        const newRefreshBtn = refreshBtn.cloneNode(true);
        refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
        newRefreshBtn.addEventListener('click', () => scanMods(true));
    }
    
    const workshopBtn = document.getElementById('openWorkshopBtn');
    if (workshopBtn) {
        const newWorkshopBtn = workshopBtn.cloneNode(true);
        workshopBtn.parentNode.replaceChild(newWorkshopBtn, workshopBtn);
        newWorkshopBtn.addEventListener('click', () => {
            fetch('/api/settings')
                .then(r => r.json())
                .then(data => {
                    if (data.workshop) {
                        fetch('/api/open/explorer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: data.workshop })
                        });
                    } else if (typeof notifications !== 'undefined') {
                        notifications.warning('Путь к Workshop не указан в настройках');
                    }
                });
        });
    }
    
    const customBtn = document.getElementById('openCustomModsBtn');
    if (customBtn) {
        const newCustomBtn = customBtn.cloneNode(true);
        customBtn.parentNode.replaceChild(newCustomBtn, customBtn);
        newCustomBtn.addEventListener('click', () => {
            fetch('/api/settings')
                .then(r => r.json())
                .then(data => {
                    if (data.custom_mods) {
                        fetch('/api/open/explorer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: data.custom_mods })
                        });
                    } else if (typeof notifications !== 'undefined') {
                        notifications.warning('Путь к кастомным модам не указан в настройках');
                    }
                });
        });
    }
}

// Инициализация страницы модов (МГНОВЕННАЯ)
async function initModsPage() {
    const container = document.getElementById('modsListContainer');
    if (!container) {
        console.warn('Страница модов не загружена, пропускаем инициализацию');
        return;
    }

    // Проверяем, что openModFolder доступна глобально
    if (typeof window.openModFolder === 'undefined') {
        window.openModFolder = openModFolder;
        console.log('✅ openModFolder зарегистрирована глобально');
    }

    const cacheLoaded = await loadModsFromCache();
    
    if (cacheLoaded && modsList.length > 0) {
        console.log('⚡ Мгновенная загрузка из кеша');
        renderMods(modsList);
        if (window._modsStats) {
            updateStats(window._modsStats);
        }
        setupModsSearch();
        attachModsButtonHandlers();
        return;
    }

    container.innerHTML = `
        <div class="loading-mods">
            <span class="spinner"></span>
            Первое сканирование модов...
        </div>
    `;
    
    await scanMods(true);
    setupModsSearch();
    attachModsButtonHandlers();
}

// ============================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// ============================================
window.initModsPage = initModsPage;
window.toggleMod = toggleMod;
window.openModFolder = openModFolder;
window.scanMods = scanMods;
window.loadModsState = loadModsState;
window.loadModsFromCache = loadModsFromCache;
window.backgroundScanAndCache = backgroundScanAndCache;
window.renderMods = renderMods;
window.renderModsInstant = renderModsInstant;
window.updateStats = updateStats;
window.attachModsButtonHandlers = attachModsButtonHandlers;
window.setupModsSearch = setupModsSearch;

// Проверка после загрузки
console.log('📦 mods.js загружен, функции экспортированы:');
console.log('  - openModFolder:', typeof window.openModFolder);
console.log('  - toggleMod:', typeof window.toggleMod);
console.log('  - scanMods:', typeof window.scanMods);