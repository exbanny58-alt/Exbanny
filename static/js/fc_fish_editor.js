// ============================================
// FC FISH CONFIG EDITOR - ПОЛНЫЙ РЕДАКТОР
// ============================================

// ============================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================

let fcFishState = {
    config: null,
    profilesPath: '',
    isLoading: false,
    isDirty: false,
    selectedItemIndex: null,
    searchTerm: '',
    filterType: 'all'
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initFcFishEditor() {
    console.log('🐟 Инициализация FC Fish Config Editor');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadProfilesPath()
        .then(() => {
            console.log('✅ Путь загружен:', fcFishState.profilesPath);
            renderFcFishEditor(container);
            return loadFcFishConfig();
        })
        .catch((e) => {
            console.error('❌ Ошибка инициализации:', e);
            if (typeof notifications !== 'undefined') {
                notifications.error('Ошибка загрузки: ' + e.message);
            }
        });
}

function loadProfilesPath() {
    return new Promise((resolve, reject) => {
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                if (settings.server_exe) {
                    const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
                    fcFishState.profilesPath = serverDir + '/profiles';
                    console.log(`📁 Путь к profiles: ${fcFishState.profilesPath}`);
                    resolve(fcFishState.profilesPath);
                } else {
                    reject(new Error('Путь к серверу не указан в настройках'));
                }
            })
            .catch(e => {
                console.warn('⚠️ Не удалось загрузить путь к серверу:', e);
                if (typeof notifications !== 'undefined') {
                    notifications.warning('Не удалось загрузить путь к серверу');
                }
                reject(e);
            });
    });
}

// ============================================
// ЗАГРУЗКА КОНФИГА
// ============================================

async function loadFcFishConfig() {
    if (!fcFishState.profilesPath) {
        console.warn('⚠️ Путь к profiles не загружен, пробуем загрузить...');
        await loadProfilesPath();
    }
    
    fcFishState.isLoading = true;
    updateFcFishStatus('⏳ Загрузка конфига...');
    
    try {
        // ПУТЬ: profiles/FC_Mods/FC_Fish_Equip_config.json
        const configPath = fcFishState.profilesPath + '/FC_Mods/FC_Fish_Equip_config.json';
        console.log(`📂 Загрузка конфига: ${configPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath })
        });
        const data = await response.json();
        
        if (data.success && data.content) {
            try {
                const parsed = JSON.parse(data.content);
                if (parsed && typeof parsed === 'object') {
                    fcFishState.config = parsed;
                    console.log('✅ Конфиг загружен успешно');
                    updateFcFishStatus(`✅ Загружено ${parsed.items?.length || 0} рыб`);
                    
                    if (typeof notifications !== 'undefined') {
                        notifications.success(`Загружен конфиг FC Fish (${parsed.items?.length || 0} рыб)`);
                    }
                    
                    renderFcFishItems();
                    renderFcFishStats();
                    return;
                }
            } catch (parseError) {
                console.warn('⚠️ Ошибка парсинга конфига:', parseError);
            }
        }
        
        console.warn('⚠️ Конфиг не найден, создаём новый');
        fcFishState.config = getDefaultFcFishConfig();
        updateFcFishStatus('⚠️ Конфиг не найден, создан новый');
        
        if (typeof notifications !== 'undefined') {
            notifications.warning('FC_Fish_Equip_config.json не найден, создан новый');
        }
        
        renderFcFishItems();
        renderFcFishStats();
        
    } catch (e) {
        console.error('❌ Ошибка загрузки конфига:', e);
        fcFishState.config = getDefaultFcFishConfig();
        updateFcFishStatus('❌ Ошибка загрузки');
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки конфига');
        }
    }
    
    fcFishState.isLoading = false;
}

function getDefaultFcFishConfig() {
    return {
        configVersion: 5,
        DescriptionDebug: "-Отключение дебага (0-1). Подробное логирование данных (Включать просто так не рекомендую. Только для технических целей).  Disabling debug (0-1). Detailed data logging (I don't recommend turning it on just like that. For technical purposes only)",
        isDebugEnabled: 0,
        DescriptionCraft: "-Отключение крафтов (0-1). Параметры для настройки ниже, это строка с описанием.  Disabling crafting (0-1). The settings are below, this is the description line.",
        CraftCan: 0,
        CraftMetalSheet: 0,
        CraftWoodenLure: 0,
        DescriptionCan: "-Отключение появления банки после опустошения консервы (0-1). Параметры для настройки ниже, это строка с описанием.  Disabling the appearance of the can after emptying the canned food (0-1). The settings are below, this is the description line.",
        CreateCan: 0,
        DescriptionRod: "-Множитель урона по удочкам. 0.5 - будут получать половину от указанного урона, 1 - столько, сколько указано, 2 - в 2 раза больше, чем указано.",
        rodMultiplierX0_5: [
            "FC_FishingRod_Plastic_Blue",
            "FC_FishingRod_Plastic_Green",
            "FC_FishingRod_Plastic_Yellow",
            "FC_FishingRod_Plastic_Red"
        ],
        rodMultiplierX1: [
            "FC_FishingRod_Wooden_Blue",
            "FC_FishingRod_Wooden_Green",
            "FC_FishingRod_Wooden_Yellow",
            "FC_FishingRod_Wooden_Red"
        ],
        rodMultiplierX2: [
            "ImprovisedFishingRod",
            "FishingRod"
        ],
        items: [
            {
                name: "Mackerel",
                chance: 9,
                quantity: 1.0,
                waterType: "sea",
                instruments: ["rod", "trapLarge"],
                time: "1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1",
                damageRod: 5,
                validRods: [
                    "ImprovisedFishingRod",
                    "FishingRod",
                    "FC_FishingRod_Wooden_Blue",
                    "FC_FishingRod_Wooden_Green",
                    "FC_FishingRod_Wooden_Yellow",
                    "FC_FishingRod_Wooden_Red",
                    "FC_FishingRod_Plastic_Blue",
                    "FC_FishingRod_Plastic_Green",
                    "FC_FishingRod_Plastic_Yellow",
                    "FC_FishingRod_Plastic_Red"
                ]
            }
        ]
    };
}

// ============================================
// СОХРАНЕНИЕ КОНФИГА
// ============================================

async function saveFcFishConfig() {
    if (!fcFishState.profilesPath) {
        console.error('❌ Путь к profiles не загружен');
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к profiles не загружен');
        }
        return false;
    }
    
    updateFcFishStatus('⏳ Сохранение...');
    
    try {
        // ПУТЬ: profiles/FC_Mods/FC_Fish_Equip_config.json
        const configPath = fcFishState.profilesPath + '/FC_Mods/FC_Fish_Equip_config.json';
        const content = JSON.stringify(fcFishState.config, null, 4);
        
        const response = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath, content: content })
        });
        const data = await response.json();
        
        if (data.success) {
            fcFishState.isDirty = false;
            updateFcFishStatus(`✅ Сохранено (${fcFishState.config.items?.length || 0} рыб)`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success('Конфиг FC Fish сохранён');
            }
            return true;
        } else {
            throw new Error(data.message || 'Ошибка сохранения');
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        updateFcFishStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сохранения: ' + e.message);
        }
        return false;
    }
}

// ============================================
// ОБНОВЛЕНИЕ СТАТУСА
// ============================================

function updateFcFishStatus(message) {
    const statusEl = document.getElementById('fcFishStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'fc-fish-status';
        
        if (message.includes('⚠️')) statusEl.classList.add('warning');
        else if (message.includes('❌')) statusEl.classList.add('error');
        else if (message.includes('✅')) statusEl.classList.add('success');
        else if (message.includes('⏳')) statusEl.classList.add('loading');
    }
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА
// ============================================

function renderFcFishEditor(container) {
    container.innerHTML = `
        <div class="fc-fish-editor">
            <button class="fc-fish-back-btn" onclick="fcFishBackToEditorSelect()" title="Вернуться к выбору редактора">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <div class="fc-fish-header">
                <div class="fc-fish-header-info">
                    <span class="fc-fish-header-icon">🐟</span>
                    <div>
                        <h2 class="fc-fish-header-title">FC Fish Config Editor</h2>
                        <p class="fc-fish-header-subtitle">Редактор конфига рыболовного мода FC Fish</p>
                    </div>
                </div>
                <div class="fc-fish-header-actions">
                    <button class="btn btn-primary" onclick="saveFcFishConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Сохранить
                    </button>
                    <button class="btn btn-secondary" onclick="loadFcFishConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                        </svg>
                        Перезагрузить
                    </button>
                </div>
            </div>

            <div class="fc-fish-status-bar">
                <span class="fc-fish-status" id="fcFishStatus">✅ Готово</span>
                <span class="fc-fish-path">${fcFishState.profilesPath || 'Путь не указан'}</span>
            </div>

            <div class="fc-fish-tabs">
                <button class="fc-fish-tab active" onclick="fcFishSwitchTab('items')">
                    <span class="fc-fish-tab-icon">🎣</span>
                    Рыбы
                    <span class="fc-fish-tab-count">${fcFishState.config?.items?.length || 0}</span>
                </button>
                <button class="fc-fish-tab" onclick="fcFishSwitchTab('settings')">
                    <span class="fc-fish-tab-icon">⚙️</span>
                    Настройки
                </button>
                <button class="fc-fish-tab" onclick="fcFishSwitchTab('rods')">
                    <span class="fc-fish-tab-icon">🎯</span>
                    Удочки
                </button>
            </div>

            <div class="fc-fish-body">
                <!-- Вкладка: Рыбы -->
                <div class="fc-fish-tab-content active" id="fcFishTabItems">
                    <div class="fc-fish-sidebar">
                        <div class="fc-fish-sidebar-header">
                            <h3>Список рыб</h3>
                            <div style="display:flex;gap:6px;">
                                <button class="btn btn-primary btn-sm" onclick="fcFishAddItem()">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Добавить
                                </button>
                            </div>
                        </div>
                        <div class="fc-fish-search">
                            <input type="text" id="fcFishSearch" placeholder="🔍 Поиск рыбы..." 
                                   oninput="fcFishFilterItems()" class="fc-fish-search-input">
                            <select id="fcFishFilterType" onchange="fcFishFilterItems()" class="fc-fish-filter-select">
                                <option value="all">Все</option>
                                <option value="sea">Морские</option>
                                <option value="fresh">Пресноводные</option>
                                <option value="all">Все воды</option>
                            </select>
                        </div>
                        <div class="fc-fish-items-list" id="fcFishItemsList">
                            <div class="fc-fish-loading">
                                <span class="spinner"></span>
                                Загрузка...
                            </div>
                        </div>
                        <div class="fc-fish-sidebar-stats" id="fcFishStats">
                            <span>Всего: <strong id="fcFishTotalCount">0</strong></span>
                            <span>Морские: <strong id="fcFishSeaCount">0</strong></span>
                            <span>Пресноводные: <strong id="fcFishFreshCount">0</strong></span>
                        </div>
                    </div>
                    <div class="fc-fish-editor-panel">
                        <div class="fc-fish-editor-empty" id="fcFishEditorEmpty">
                            <span class="fc-fish-empty-icon">🐟</span>
                            <p>Выберите рыбу для редактирования</p>
                            <p class="fc-fish-empty-hint">Или создайте новую рыбу</p>
                        </div>
                        <div class="fc-fish-editor-content" id="fcFishEditorContent" style="display:none;"></div>
                    </div>
                </div>

                <!-- Вкладка: Настройки -->
                <div class="fc-fish-tab-content" id="fcFishTabSettings">
                    <div class="fc-fish-config-panel">
                        ${renderFcFishSettings()}
                    </div>
                </div>

                <!-- Вкладка: Удочки -->
                <div class="fc-fish-tab-content" id="fcFishTabRods">
                    <div class="fc-fish-rods-panel">
                        ${renderFcFishRods()}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    renderFcFishItems();
    renderFcFishStats();
    
    setTimeout(createFcFishScrollTopButton, 300);
}

// ============================================
// ОТРИСОВКА СПИСКА РЫБ
// ============================================

function renderFcFishItems() {
    const container = document.getElementById('fcFishItemsList');
    if (!container) return;
    
    const items = fcFishState.config?.items || [];
    const searchTerm = fcFishState.searchTerm.toLowerCase().trim();
    const filterType = fcFishState.filterType;
    
    let filtered = items;
    
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filterType !== 'all') {
        filtered = filtered.filter(item => item.waterType === filterType);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="fc-fish-empty-list">
                <span class="fc-fish-empty-icon">🎣</span>
                <p>${items.length === 0 ? 'Нет рыб в конфиге' : 'Ничего не найдено'}</p>
                ${items.length === 0 ? '<button class="btn btn-primary btn-sm" onclick="fcFishAddItem()">Создать первую рыбу</button>' : ''}
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach((item, index) => {
        const isActive = fcFishState.selectedItemIndex === index;
        const waterLabel = item.waterType === 'sea' ? '🌊' : item.waterType === 'fresh' ? '💧' : '🌍';
        const instruments = (item.instruments || []).join(', ');
        
        html += `
            <div class="fc-fish-item ${isActive ? 'active' : ''}" onclick="fcFishSelectItem(${index})">
                <div class="fc-fish-item-info">
                    <span class="fc-fish-item-name">${item.name}</span>
                    <span class="fc-fish-item-water">${waterLabel}</span>
                </div>
                <div class="fc-fish-item-details">
                    <span class="fc-fish-item-chance">${item.chance || 0}%</span>
                    <span class="fc-fish-item-instruments">${instruments || '—'}</span>
                </div>
                <div class="fc-fish-item-actions">
                    <button class="fc-fish-item-delete" onclick="event.stopPropagation(); fcFishConfirmDeleteItem(${index})" title="Удалить рыбу">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// ОТРИСОВКА СТАТИСТИКИ
// ============================================

function renderFcFishStats() {
    const items = fcFishState.config?.items || [];
    const total = items.length;
    const sea = items.filter(i => i.waterType === 'sea').length;
    const fresh = items.filter(i => i.waterType === 'fresh').length;
    const allWater = items.filter(i => i.waterType === 'all' || i.waterType === 'all_water').length;
    
    document.getElementById('fcFishTotalCount').textContent = total;
    document.getElementById('fcFishSeaCount').textContent = sea + (allWater > 0 ? ` (+${allWater})` : '');
    document.getElementById('fcFishFreshCount').textContent = fresh + (allWater > 0 ? ` (+${allWater})` : '');
    
    // Обновляем счетчик во вкладке
    const countEl = document.querySelector('.fc-fish-tab .fc-fish-tab-count');
    if (countEl) countEl.textContent = total;
}

// ============================================
// ФИЛЬТРАЦИЯ
// ============================================

function fcFishFilterItems() {
    const search = document.getElementById('fcFishSearch');
    const filter = document.getElementById('fcFishFilterType');
    
    if (search) fcFishState.searchTerm = search.value;
    if (filter) fcFishState.filterType = filter.value;
    
    renderFcFishItems();
}

// ============================================
// ВЫБОР РЫБЫ
// ============================================

function fcFishSelectItem(index) {
    fcFishState.selectedItemIndex = index;
    renderFcFishItems();
    renderFcFishItemEditor(index);
}

// ============================================
// ОТРИСОВКА РЕДАКТОРА РЫБЫ
// ============================================

function renderFcFishItemEditor(index) {
    const container = document.getElementById('fcFishEditorContent');
    const empty = document.getElementById('fcFishEditorEmpty');
    const item = fcFishState.config?.items?.[index];
    
    if (!item) {
        if (container) container.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    if (container) container.style.display = 'block';
    
    const instruments = ['rod', 'trapLarge', 'trapSmall'];
    const waterTypes = [
        { value: 'sea', label: '🌊 Морская' },
        { value: 'fresh', label: '💧 Пресноводная' },
        { value: 'all', label: '🌍 Все воды' }
    ];
    
    const allRods = [
        'ImprovisedFishingRod',
        'FishingRod',
        'FC_FishingRod_Wooden_Blue',
        'FC_FishingRod_Wooden_Green',
        'FC_FishingRod_Wooden_Yellow',
        'FC_FishingRod_Wooden_Red',
        'FC_FishingRod_Plastic_Blue',
        'FC_FishingRod_Plastic_Green',
        'FC_FishingRod_Plastic_Yellow',
        'FC_FishingRod_Plastic_Red'
    ];
    
    const timeHours = item.time ? item.time.split(',').map(Number) : Array(24).fill(1);
    
    container.innerHTML = `
        <div class="fc-fish-editor-form">
            <div class="fc-fish-form-section">
                <h4>Основные настройки</h4>
                <div class="fc-fish-form-row">
                    <div class="fc-fish-form-group">
                        <label>Название рыбы</label>
                        <input type="text" class="fc-fish-input" value="${item.name || ''}" 
                               onchange="fcFishUpdateItemField(${index}, 'name', this.value)">
                    </div>
                    <div class="fc-fish-form-group">
                        <label>Шанс (%)</label>
                        <input type="number" class="fc-fish-input" value="${item.chance || 0}" 
                               onchange="fcFishUpdateItemField(${index}, 'chance', parseInt(this.value) || 0)"
                               min="0" max="100">
                    </div>
                </div>
                <div class="fc-fish-form-row">
                    <div class="fc-fish-form-group">
                        <label>Количество</label>
                        <input type="number" step="0.1" class="fc-fish-input" value="${item.quantity || 1.0}" 
                               onchange="fcFishUpdateItemField(${index}, 'quantity', parseFloat(this.value) || 0)"
                               min="0" max="10">
                    </div>
                    <div class="fc-fish-form-group">
                        <label>Тип воды</label>
                        <select class="fc-fish-select" onchange="fcFishUpdateItemField(${index}, 'waterType', this.value)">
                            ${waterTypes.map(w => `<option value="${w.value}" ${item.waterType === w.value ? 'selected' : ''}>${w.label}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="fc-fish-form-row">
                    <div class="fc-fish-form-group">
                        <label>Урон удочке</label>
                        <input type="number" class="fc-fish-input" value="${item.damageRod || 0}" 
                               onchange="fcFishUpdateItemField(${index}, 'damageRod', parseInt(this.value) || 0)"
                               min="0" max="100">
                    </div>
                    <div class="fc-fish-form-group">
                        <label>Инструменты</label>
                        <div class="fc-fish-checkbox-group">
                            ${instruments.map(inst => `
                                <label class="fc-fish-checkbox">
                                    <input type="checkbox" ${(item.instruments || []).includes(inst) ? 'checked' : ''} 
                                           onchange="fcFishToggleInstrument(${index}, '${inst}')">
                                    ${inst}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="fc-fish-form-section">
                <h4>Время клёва (часы)</h4>
                <div class="fc-fish-time-grid">
                    ${Array(24).fill(0).map((_, hour) => `
                        <label class="fc-fish-time-hour">
                            <input type="checkbox" ${timeHours[hour] === 1 ? 'checked' : ''} 
                                   onchange="fcFishToggleHour(${index}, ${hour})">
                            <span>${String(hour).padStart(2, '0')}:00</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="fc-fish-form-section">
                <h4>Разрешённые удочки</h4>
                <div class="fc-fish-rods-grid">
                    ${allRods.map(rod => `
                        <label class="fc-fish-checkbox">
                            <input type="checkbox" ${(item.validRods || []).includes(rod) ? 'checked' : ''} 
                                   onchange="fcFishToggleRod(${index}, '${rod}')">
                            ${rod}
                        </label>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// ============================================
// ОБНОВЛЕНИЕ ПОЛЯ РЫБЫ
// ============================================

function fcFishUpdateItemField(index, field, value) {
    if (!fcFishState.config?.items?.[index]) return;
    fcFishState.config.items[index][field] = value;
    fcFishState.isDirty = true;
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
    renderFcFishItems();
    renderFcFishStats();
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ИНСТРУМЕНТА
// ============================================

function fcFishToggleInstrument(index, instrument) {
    const item = fcFishState.config?.items?.[index];
    if (!item) return;
    
    if (!item.instruments) item.instruments = [];
    
    const idx = item.instruments.indexOf(instrument);
    if (idx === -1) {
        item.instruments.push(instrument);
    } else {
        item.instruments.splice(idx, 1);
    }
    
    fcFishState.isDirty = true;
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
    renderFcFishItems();
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ЧАСА
// ============================================

function fcFishToggleHour(index, hour) {
    const item = fcFishState.config?.items?.[index];
    if (!item) return;
    
    const hours = item.time ? item.time.split(',').map(Number) : Array(24).fill(1);
    hours[hour] = hours[hour] === 1 ? 0 : 1;
    item.time = hours.join(',');
    
    fcFishState.isDirty = true;
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ УДОЧКИ
// ============================================

function fcFishToggleRod(index, rod) {
    const item = fcFishState.config?.items?.[index];
    if (!item) return;
    
    if (!item.validRods) item.validRods = [];
    
    const idx = item.validRods.indexOf(rod);
    if (idx === -1) {
        item.validRods.push(rod);
    } else {
        item.validRods.splice(idx, 1);
    }
    
    fcFishState.isDirty = true;
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
}

// ============================================
// ДОБАВЛЕНИЕ РЫБЫ
// ============================================

function fcFishAddItem() {
    if (!fcFishState.config) fcFishState.config = getDefaultFcFishConfig();
    if (!fcFishState.config.items) fcFishState.config.items = [];
    
    const newItem = {
        name: `Fish_${fcFishState.config.items.length + 1}`,
        chance: 10,
        quantity: 1.0,
        waterType: "all",
        instruments: ["rod"],
        time: Array(24).fill(1).join(','),
        damageRod: 5,
        validRods: [
            "ImprovisedFishingRod",
            "FishingRod",
            "FC_FishingRod_Wooden_Blue",
            "FC_FishingRod_Wooden_Green",
            "FC_FishingRod_Wooden_Yellow",
            "FC_FishingRod_Wooden_Red",
            "FC_FishingRod_Plastic_Blue",
            "FC_FishingRod_Plastic_Green",
            "FC_FishingRod_Plastic_Yellow",
            "FC_FishingRod_Plastic_Red"
        ]
    };
    
    fcFishState.config.items.push(newItem);
    fcFishState.selectedItemIndex = fcFishState.config.items.length - 1;
    fcFishState.isDirty = true;
    
    renderFcFishItems();
    renderFcFishStats();
    renderFcFishItemEditor(fcFishState.selectedItemIndex);
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Добавлена рыба: ${newItem.name}`);
    }
}

// ============================================
// УДАЛЕНИЕ РЫБЫ
// ============================================

function fcFishConfirmDeleteItem(index) {
    const item = fcFishState.config?.items?.[index];
    if (!item) return;
    
    if (typeof mpgShowConfirmModal !== 'undefined') {
        mpgShowConfirmModal(
            'Удаление рыбы',
            `Вы уверены, что хотите удалить "<strong>${item.name}</strong>"?<br>Это действие нельзя отменить.`,
            function() {
                fcFishExecuteDeleteItem(index);
            },
            function() {}
        );
    } else {
        if (confirm(`Удалить рыбу "${item.name}"?`)) {
            fcFishExecuteDeleteItem(index);
        }
    }
}

function fcFishExecuteDeleteItem(index) {
    const item = fcFishState.config?.items?.[index];
    if (!item) return;
    
    const name = item.name;
    
    fcFishState.config.items.splice(index, 1);
    if (fcFishState.selectedItemIndex === index) {
        fcFishState.selectedItemIndex = null;
    } else if (fcFishState.selectedItemIndex > index) {
        fcFishState.selectedItemIndex--;
    }
    fcFishState.isDirty = true;
    
    renderFcFishItems();
    renderFcFishStats();
    
    const container = document.getElementById('fcFishEditorContent');
    const empty = document.getElementById('fcFishEditorEmpty');
    if (container) container.style.display = 'none';
    if (empty) empty.style.display = 'block';
    
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалена рыба: ${name}`);
    }
}

// ============================================
// ВКЛАДКА НАСТРОЕК
// ============================================

function renderFcFishSettings() {
    const config = fcFishState.config || getDefaultFcFishConfig();
    
    return `
        <div class="fc-fish-config-section">
            <h4>Основные настройки</h4>
            <div class="fc-fish-form-row">
                <div class="fc-fish-form-group">
                    <label>Версия конфига</label>
                    <input type="number" class="fc-fish-input" value="${config.configVersion || 5}" 
                           onchange="fcFishUpdateConfigField('configVersion', parseInt(this.value) || 5)">
                </div>
                <div class="fc-fish-form-group">
                    <label>Debug режим</label>
                    <select class="fc-fish-select" onchange="fcFishUpdateConfigField('isDebugEnabled', parseInt(this.value))">
                        <option value="0" ${config.isDebugEnabled === 0 ? 'selected' : ''}>Выключен</option>
                        <option value="1" ${config.isDebugEnabled === 1 ? 'selected' : ''}>Включен</option>
                    </select>
                </div>
            </div>
            <div class="fc-fish-form-group fc-fish-form-group-full">
                <label>Описание Debug</label>
                <textarea class="fc-fish-textarea" rows="2" 
                          onchange="fcFishUpdateConfigField('DescriptionDebug', this.value)">${config.DescriptionDebug || ''}</textarea>
            </div>
        </div>

        <div class="fc-fish-config-section">
            <h4>Крафты</h4>
            <div class="fc-fish-form-row">
                <div class="fc-fish-form-group">
                    <label>Craft Can</label>
                    <select class="fc-fish-select" onchange="fcFishUpdateConfigField('CraftCan', parseInt(this.value))">
                        <option value="0" ${config.CraftCan === 0 ? 'selected' : ''}>Выключен</option>
                        <option value="1" ${config.CraftCan === 1 ? 'selected' : ''}>Включен</option>
                    </select>
                </div>
                <div class="fc-fish-form-group">
                    <label>Craft Metal Sheet</label>
                    <select class="fc-fish-select" onchange="fcFishUpdateConfigField('CraftMetalSheet', parseInt(this.value))">
                        <option value="0" ${config.CraftMetalSheet === 0 ? 'selected' : ''}>Выключен</option>
                        <option value="1" ${config.CraftMetalSheet === 1 ? 'selected' : ''}>Включен</option>
                    </select>
                </div>
            </div>
            <div class="fc-fish-form-row">
                <div class="fc-fish-form-group">
                    <label>Craft Wooden Lure</label>
                    <select class="fc-fish-select" onchange="fcFishUpdateConfigField('CraftWoodenLure', parseInt(this.value))">
                        <option value="0" ${config.CraftWoodenLure === 0 ? 'selected' : ''}>Выключен</option>
                        <option value="1" ${config.CraftWoodenLure === 1 ? 'selected' : ''}>Включен</option>
                    </select>
                </div>
                <div class="fc-fish-form-group">
                    <label>Create Can</label>
                    <select class="fc-fish-select" onchange="fcFishUpdateConfigField('CreateCan', parseInt(this.value))">
                        <option value="0" ${config.CreateCan === 0 ? 'selected' : ''}>Выключен</option>
                        <option value="1" ${config.CreateCan === 1 ? 'selected' : ''}>Включен</option>
                    </select>
                </div>
            </div>
            <div class="fc-fish-form-group fc-fish-form-group-full">
                <label>Описание крафтов</label>
                <textarea class="fc-fish-textarea" rows="2" 
                          onchange="fcFishUpdateConfigField('DescriptionCraft', this.value)">${config.DescriptionCraft || ''}</textarea>
            </div>
            <div class="fc-fish-form-group fc-fish-form-group-full">
                <label>Описание банок</label>
                <textarea class="fc-fish-textarea" rows="2" 
                          onchange="fcFishUpdateConfigField('DescriptionCan', this.value)">${config.DescriptionCan || ''}</textarea>
            </div>
            <div class="fc-fish-form-group fc-fish-form-group-full">
                <label>Описание удочек</label>
                <textarea class="fc-fish-textarea" rows="2" 
                          onchange="fcFishUpdateConfigField('DescriptionRod', this.value)">${config.DescriptionRod || ''}</textarea>
            </div>
        </div>
    `;
}

// ============================================
// ВКЛАДКА УДОЧЕК
// ============================================

function renderFcFishRods() {
    const config = fcFishState.config || getDefaultFcFishConfig();
    
    const rodGroups = [
        { key: 'rodMultiplierX0_5', label: 'x0.5 урона (Пластиковые)', color: '#60a5fa' },
        { key: 'rodMultiplierX1', label: 'x1 урон (Деревянные)', color: '#4ade80' },
        { key: 'rodMultiplierX2', label: 'x2 урона (Самодельные)', color: '#fbbf24' }
    ];
    
    return `
        <div class="fc-fish-config-section">
            <h4>Группы удочек по множителю урона</h4>
            <p class="fc-fish-rods-description">${config.DescriptionRod || 'Множитель урона по удочкам'}</p>
            
            ${rodGroups.map(group => `
                <div class="fc-fish-rod-group">
                    <div class="fc-fish-rod-group-header" style="border-color: ${group.color}30;">
                        <span class="fc-fish-rod-group-label" style="color: ${group.color};">${group.label}</span>
                        <span class="fc-fish-rod-group-count">${(config[group.key] || []).length} удочек</span>
                    </div>
                    <div class="fc-fish-rod-group-items">
                        ${(config[group.key] || []).map(rod => `
                            <span class="fc-fish-rod-tag">
                                ${rod}
                                <span class="fc-fish-rod-tag-remove" onclick="fcFishRemoveRodFromGroup('${group.key}', '${rod}')">×</span>
                            </span>
                        `).join('')}
                    </div>
                    <div class="fc-fish-rod-add">
                        <input type="text" class="fc-fish-input" placeholder="Название удочки..." 
                               id="fcFishNewRod_${group.key}" 
                               onkeydown="if(event.key==='Enter') fcFishAddRodToGroup('${group.key}')">
                        <button class="btn btn-primary btn-sm" onclick="fcFishAddRodToGroup('${group.key}')">➕</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// ОБНОВЛЕНИЕ ПОЛЯ КОНФИГА
// ============================================

function fcFishUpdateConfigField(field, value) {
    if (!fcFishState.config) return;
    fcFishState.config[field] = value;
    fcFishState.isDirty = true;
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
}

// ============================================
// УПРАВЛЕНИЕ УДОЧКАМИ
// ============================================

function fcFishAddRodToGroup(groupKey) {
    const input = document.getElementById(`fcFishNewRod_${groupKey}`);
    if (!input) return;
    
    const rod = input.value.trim();
    if (!rod) {
        if (typeof notifications !== 'undefined') {
            notifications.warning('Введите название удочки');
        }
        return;
    }
    
    if (!fcFishState.config[groupKey]) {
        fcFishState.config[groupKey] = [];
    }
    
    if (fcFishState.config[groupKey].includes(rod)) {
        if (typeof notifications !== 'undefined') {
            notifications.warning(`"${rod}" уже есть в этой группе`);
        }
        return;
    }
    
    fcFishState.config[groupKey].push(rod);
    fcFishState.isDirty = true;
    input.value = '';
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
    
    // Перерисовываем вкладку удочек
    const container = document.getElementById('editorContentArea');
    if (container) {
        renderFcFishEditor(container);
        fcFishSwitchTab('rods');
    }
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Добавлена удочка: ${rod}`);
    }
}

function fcFishRemoveRodFromGroup(groupKey, rod) {
    if (!fcFishState.config[groupKey]) return;
    
    fcFishState.config[groupKey] = fcFishState.config[groupKey].filter(r => r !== rod);
    fcFishState.isDirty = true;
    updateFcFishStatus('⚠️ Есть несохранённые изменения');
    
    const container = document.getElementById('editorContentArea');
    if (container) {
        renderFcFishEditor(container);
        fcFishSwitchTab('rods');
    }
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалена удочка: ${rod}`);
    }
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================

function fcFishSwitchTab(tab) {
    // Обновляем кнопки
    document.querySelectorAll('.fc-fish-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(
            tab === 'items' ? 'Рыбы' : 
            tab === 'settings' ? 'Настройки' : 'Удочки'
        ));
    });
    
    // Обновляем контент
    document.querySelectorAll('.fc-fish-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetMap = {
        'items': 'fcFishTabItems',
        'settings': 'fcFishTabSettings',
        'rods': 'fcFishTabRods'
    };
    
    const target = document.getElementById(targetMap[tab]);
    if (target) {
        target.classList.add('active');
        
        // Если переключились на удочки, перерисовываем их
        if (tab === 'rods') {
            const rodsPanel = document.querySelector('.fc-fish-rods-panel');
            if (rodsPanel) {
                rodsPanel.innerHTML = renderFcFishRods();
            }
        }
        
        // Если переключились на настройки
        if (tab === 'settings') {
            const settingsPanel = document.querySelector('.fc-fish-config-panel');
            if (settingsPanel) {
                settingsPanel.innerHTML = renderFcFishSettings();
            }
        }
    }
}

// ============================================
// ВОЗВРАТ К ВЫБОРУ РЕДАКТОРА
// ============================================

function fcFishBackToEditorSelect() {
    destroyFcFishScrollTopButton();
    
    if (fcFishState.isDirty) {
        if (typeof mpgShowConfirmModal !== 'undefined') {
            mpgShowConfirmModal(
                'Несохранённые изменения',
                'Есть несохранённые изменения. Вы уверены, что хотите выйти без сохранения?',
                function() {
                    if (typeof window.backToEditorSelect === 'function') {
                        window.backToEditorSelect();
                    }
                },
                function() {}
            );
        } else {
            if (confirm('Есть несохранённые изменения. Выйти без сохранения?')) {
                if (typeof window.backToEditorSelect === 'function') {
                    window.backToEditorSelect();
                }
            }
        }
        return;
    }
    
    if (typeof window.backToEditorSelect === 'function') {
        window.backToEditorSelect();
    }
}

// ============================================
// ПЛАВАЮЩАЯ КНОПКА "НАВЕРХ"
// ============================================

let fcFishScrollTopBtn = null;
let fcFishScrollTimer = null;

function createFcFishScrollTopButton() {
    const oldBtn = document.getElementById('fcFishScrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        fcFishScrollTopBtn = null;
    }
    
    if (fcFishScrollTimer) {
        clearInterval(fcFishScrollTimer);
        fcFishScrollTimer = null;
    }
    
    fcFishScrollTopBtn = document.createElement('button');
    fcFishScrollTopBtn.id = 'fcFishScrollTopBtn';
    fcFishScrollTopBtn.className = 'scroll-top-btn';
    fcFishScrollTopBtn.innerHTML = '↑';
    fcFishScrollTopBtn.title = 'Наверх';
    
    let isScrolling = false;
    
    fcFishScrollTopBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (isScrolling) return;
        isScrolling = true;
        
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            const scrollContainer = contentArea.querySelector('div:first-child');
            if (scrollContainer) {
                scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => { isScrolling = false; }, 800);
                return;
            }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => { isScrolling = false; }, 800);
    });
    
    document.body.appendChild(fcFishScrollTopBtn);
    console.log('✅ Кнопка "Наверх" для FC Fish Editor создана');
    
    fcFishScrollTimer = setInterval(function() {
        checkFcFishScroll();
    }, 300);
    
    setTimeout(checkFcFishScroll, 200);
}

function checkFcFishScroll() {
    if (!fcFishScrollTopBtn) return;
    
    const contentArea = document.getElementById('contentArea');
    let hasScroll = false;
    
    if (contentArea) {
        const scrollContainer = contentArea.querySelector('div:first-child');
        if (scrollContainer && scrollContainer.scrollTop > 50) {
            hasScroll = true;
        }
    }
    
    if (hasScroll) {
        fcFishScrollTopBtn.classList.add('visible');
    } else {
        fcFishScrollTopBtn.classList.remove('visible');
    }
}

function destroyFcFishScrollTopButton() {
    if (fcFishScrollTimer) {
        clearInterval(fcFishScrollTimer);
        fcFishScrollTimer = null;
    }
    
    const btn = document.getElementById('fcFishScrollTopBtn');
    if (btn) {
        btn.remove();
        fcFishScrollTopBtn = null;
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

window.initFcFishEditor = initFcFishEditor;
window.saveFcFishConfig = saveFcFishConfig;
window.loadFcFishConfig = loadFcFishConfig;
window.fcFishSwitchTab = fcFishSwitchTab;
window.fcFishBackToEditorSelect = fcFishBackToEditorSelect;
window.fcFishAddItem = fcFishAddItem;
window.fcFishSelectItem = fcFishSelectItem;
window.fcFishFilterItems = fcFishFilterItems;
window.fcFishUpdateItemField = fcFishUpdateItemField;
window.fcFishToggleInstrument = fcFishToggleInstrument;
window.fcFishToggleHour = fcFishToggleHour;
window.fcFishToggleRod = fcFishToggleRod;
window.fcFishConfirmDeleteItem = fcFishConfirmDeleteItem;
window.fcFishUpdateConfigField = fcFishUpdateConfigField;
window.fcFishAddRodToGroup = fcFishAddRodToGroup;
window.fcFishRemoveRodFromGroup = fcFishRemoveRodFromGroup;

console.log('🐟 fc_fish_editor.js загружен');