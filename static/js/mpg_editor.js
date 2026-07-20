// ============================================
// MPG SPAWNER EDITOR - ПОЛНЫЙ РЕДАКТОР
// ============================================

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

const MPG_CONFIG = {
    paths: {
        config: 'MPG_Spawner/Config.json',
        points: 'MPG_Spawner/Points/',
        groups: 'MPG_Spawner/Groups/'
    },
    entityTypes: {
        animals: ['Animal_UrsusArctos', 'Animal_CanisLupus_Grey', 'Animal_CervusElaphus', 'Animal_SusScrofa'],
        zombies: ['ZmbF_MechanicNormal_Beige', 'ZmbM_ConstrWorkerNormal_Beige', 'ZmbM_Jacket_Blue', 'ZmbM_Villager_Old'],
        items: ['Apple', 'WaterBottle', 'AKM', 'M4A1', 'Mag_AK101_30Rnd', 'Bandage', 'Morphine']
    },
    weather: ['clear', 'cloudy', 'fog', 'storm', 'rain']
};

// ============================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================

let mpgState = {
    config: null,
    points: [],
    groups: [],
    currentPoint: null,
    currentGroup: null,
    profilesPath: '',
    isLoading: false,
    isDirty: false,
    activeTab: 'points',
    newAdminName: '',
    configFiles: []
};

// ============================================
// ЗАГРУЗКА КАТЕГОРИЙ ИЗ LOOT_CATEGORIES.JSON
// ============================================

let mpgLootData = null;

async function loadMpgLootCategories() {
    try {
        const categoriesPath = mpgState.profilesPath + '/MPG_LootExtractor/Loot_Categories.json';
        console.log(`📂 Загрузка категорий: ${categoriesPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: categoriesPath })
        });
        
        const result = await response.json();
        
        if (result.success && result.content) {
            mpgLootData = JSON.parse(result.content);
            console.log('📚 Загружены категории из Loot_Categories.json:');
            for (const [cat, items] of Object.entries(mpgLootData)) {
                if (items.length > 0) {
                    console.log(`   ${cat}: ${items.length} предметов`);
                }
            }
            return true;
        }
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить Loot_Categories.json:', e);
    }
    
    console.log('🔄 Loot_Categories.json не найден, пробуем загрузить напрямую из Loot.json...');
    return await loadMpgLootFromLootJson();
}

async function loadMpgLootFromLootJson() {
    try {
        const lootPath = mpgState.profilesPath + '/MPG_LootExtractor/Loot.json';
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: lootPath })
        });
        
        const result = await response.json();
        
        if (result.success && result.content) {
            const data = JSON.parse(result.content);
            
            const categories = {
                animals: [],
                zombies: [],
                weapons: [],
                magazines: [],
                ammo: [],
                attachments: [],
                clothing: [],
                vests: [],
                bags: [],
                food: [],
                drinks: [],
                medical: [],
                tools: [],
                materials: [],
                vehicles: [],
                vehicle_parts: [],
                boats: [],
                books: [],
                fish: [],
                items: [],
                other: []
            };
            
            for (const [key, name] of Object.entries(data)) {
                const category = detectMpgCategory(key, name);
                if (categories[category]) {
                    categories[category].push(key);
                } else {
                    categories.items.push(key);
                }
            }
            
            for (const cat of Object.keys(categories)) {
                categories[cat].sort((a, b) => a.localeCompare(b));
            }
            
            mpgLootData = categories;
            console.log('📚 Загружены категории напрямую из Loot.json');
            return true;
        }
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить Loot.json:', e);
    }
    return false;
}

function detectMpgCategory(key, name) {
    const k = key.toLowerCase();
    
    if (k.startsWith('animal_') || k.includes('_animal') || 
        k.includes('ursus') || k.includes('canis') || k.includes('cervus') || 
        k.includes('susscrofa')) {
        return 'animals';
    }
    
    if (k.startsWith('zmb') || k.includes('_zmb') || k.includes('zombie') || 
        k.includes('infected')) {
        return 'zombies';
    }
    
    const weaponKeywords = ['ak', 'm4', 'mosin', 'svd', 'vss', 'mp5', 'glock', 'colt',
        'revolver', 'magnum', 'deagle', 'shotgun', 'rifle', 'carbine', 'pistol', 'smg',
        'aug', 'fal', 'famas', 'fnx', 'lar', 'lemas', 'm16', 'mkii', 'rak', 'sks',
        'saiga', 'scout', 'pioneer', 'blaze', 'winchester', 'crossbow', 'longhorn'];
    for (const w of weaponKeywords) {
        if (k === w || k.startsWith(w + '_') || k.startsWith(w + '-')) return 'weapons';
    }
    
    if (k.startsWith('mag_') || k.includes('_mag_') || 
        (k.includes('mag') && (k.includes('rnd') || k.includes('round') || k.includes('cyl')))) {
        if (!k.includes('azine')) return 'magazines';
    }
    
    if (k.startsWith('ammo_') || k.includes('_ammo') || k.includes('cartridge') || 
        k.includes('bullet') || (k.includes('box') && k.includes('rnd'))) {
        return 'ammo';
    }
    
    const attachKeywords = ['optic', 'scope', 'sight', 'suppressor', 'silencer', 'muzzle', 
        'bttstck', 'stock', 'buttstock', 'hndgrd', 'handguard', 'rail', 'bayonet', 
        'compensator', 'flash', 'grip', 'bipod', 'laser', 'kobra', 'pso', 'acog',
        'holo', 'reflex', 'starlight', 'tlr', 'nvg'];
    for (const a of attachKeywords) {
        if (k.includes(a)) return 'attachments';
    }
    
    const clothingKeywords = ['jacket', 'pants', 'shirt', 'tshirt', 'sweater', 'hoodie', 'coat',
        'hat', 'cap', 'helmet', 'mask', 'goggles', 'glasses', 'boots', 'shoes', 'sneakers', 
        'gloves', 'suit', 'dress', 'skirt', 'uniform', 'bdu', 'raincoat', 'parka', 'anorak',
        'balaclava', 'shemag', 'bandana', 'hood', 'beanie'];
    for (const c of clothingKeywords) {
        if (k.includes(c)) {
            if (k.includes('platecarrier') || k.includes('pressvest') || 
                k.includes('tacticalvest') || k.includes('highcapacity') || 
                k.includes('ukass') || k.includes('smersh') || k.includes('reflex')) {
                return 'vests';
            }
            if (k.includes('bag') || k.includes('backpack') || k.includes('pack') ||
                k.includes('pouch') || k.includes('sack')) {
                return 'bags';
            }
            return 'clothing';
        }
    }
    
    if (k.includes('platecarrier') || k.includes('pressvest') || k.includes('tacticalvest') ||
        k.includes('highcapacityvest') || k.includes('ukassvest') || k.includes('smershvest') ||
        k.includes('reflexvest')) {
        return 'vests';
    }
    
    if (k.includes('bag') || k.includes('backpack') || k.includes('pack') || 
        k.includes('pouch') || k.includes('sack') || k.includes('coyote') ||
        k.includes('taloon') || k.includes('tortilla') || k.includes('drybag') ||
        k.includes('duffel') || k.includes('assault') || k.includes('alice')) {
        return 'bags';
    }
    
    const foodKeywords = ['can', 'mushroom', 'meat', 'steak', 'fillet', 'pate', 'bacon',
        'cereal', 'chips', 'crackers', 'rice', 'pasta', 'honey', 'jam', 'marmalade',
        'apple', 'pear', 'plum', 'tomato', 'potato', 'pumpkin', 'zucchini', 'pepper',
        'bread', 'cake', 'cookie', 'chocolate', 'candy'];
    for (const f of foodKeywords) {
        if (k.includes(f)) return 'food';
    }
    
    if (k.includes('water') || k.includes('soda') || k.includes('kvass') ||
        k.includes('cola') || k.includes('lemonade') || k.includes('canteen') ||
        k.includes('bottle') || k.includes('drink') || k.includes('juice') ||
        k.includes('tea') || k.includes('coffee') || k.includes('beer') ||
        k.includes('wine') || k.includes('vodka')) {
        return 'drinks';
    }
    
    const medKeywords = ['bandage', 'blood', 'morphine', 'epinephrine', 'adrenaline',
        'saline', 'antibiotics', 'vitamins', 'painkiller', 'iodine', 'charcoal',
        'tetracycline', 'defibrillator', 'splint', 'syringe', 'firstaid', 'thermometer',
        'disinfectant', 'purification'];
    for (const m of medKeywords) {
        if (k.includes(m)) return 'medical';
    }
    
    const toolKeywords = ['knife', 'axe', 'saw', 'hammer', 'wrench', 'screwdriver',
        'pliers', 'shovel', 'pickaxe', 'crowbar', 'hacksaw', 'hatchet', 'machete',
        'sickle', 'sword', 'spear', 'mace', 'trap', 'lockpick', 'compass', 'map',
        'radio', 'flashlight', 'lighter', 'matches', 'rope', 'ducttape', 'sewing'];
    for (const t of toolKeywords) {
        if (k.includes(t)) return 'tools';
    }
    
    const matKeywords = ['wood', 'stone', 'metal', 'steel', 'iron', 'burlap', 'leather', 
        'fabric', 'netting', 'feather', 'pelt', 'hide', 'skin', 'gut', 'fur', 'wool',
        'bone', 'nail', 'wire', 'plank', 'log', 'bark', 'lime', 'epoxy', 'plastic'];
    for (const m of matKeywords) {
        if (k.includes(m)) return 'materials';
    }
    
    return 'items';
}

function getLootList(category, fallback) {
    if (mpgLootData && mpgLootData[category] && mpgLootData[category].length > 0) {
        return mpgLootData[category];
    }
    return fallback || [];
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initMpgEditor() {
    console.log('📝 Инициализация MPG Spawner Editor');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadProfilesPath()
        .then(() => {
            return loadMpgLootCategories();
        })
        .then(() => {
            console.log('✅ Путь загружен:', mpgState.profilesPath);
            renderMpgEditor(container);
            return loadAllData();
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
                    mpgState.profilesPath = serverDir + '/profiles';
                    console.log(`📁 Путь к profiles: ${mpgState.profilesPath}`);
                    resolve(mpgState.profilesPath);
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

async function loadAllData() {
    if (!mpgState.profilesPath) {
        console.warn('⚠️ Путь к profiles не загружен, пробуем загрузить...');
        await loadProfilesPath();
    }
    
    mpgState.isLoading = true;
    updateStatus('⏳ Загрузка данных...');
    
    try {
        await loadConfig();
        await loadPoints();
        await loadGroups();
        
        const container = document.getElementById('editorContentArea');
        if (container) {
            renderMpgEditor(container);
        }
        renderPointsList();
        renderGroupsList();
        
        updateStatus('✅ Данные загружены');
        if (typeof notifications !== 'undefined') {
            notifications.success(`Загружено ${mpgState.points.length} точек, ${mpgState.groups.length} групп`);
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        updateStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки: ' + e.message);
        }
    }
    
    mpgState.isLoading = false;
}

async function loadConfig() {
    if (!mpgState.profilesPath) {
        console.warn('⚠️ Путь к profiles не загружен, пробуем загрузить...');
        await loadProfilesPath();
    }
    
    try {
        const path = mpgState.profilesPath + '/' + MPG_CONFIG.paths.config;
        console.log(`📂 Загрузка Config.json: ${path}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });
        const data = await response.json();
        
        if (data.success && data.content) {
            try {
                const parsed = JSON.parse(data.content);
                if (parsed && typeof parsed === 'object') {
                    mpgState.config = parsed;
                    console.log('✅ Config.json загружен успешно');
                    return;
                }
            } catch (parseError) {
                console.warn('⚠️ Ошибка парсинга Config.json:', parseError);
            }
        }
        
        console.warn('⚠️ Config.json не найден или повреждён, создаём новый');
        mpgState.config = {
            configVersion: 6,
            documentation: "https://docs.mpg-dayz.ru/spawner/",
            isModDisabled: 0,
            logLevel: 3,
            pointsConfigs: [],
            admins: []
        };
        
        await mpgSaveConfig();
        
        if (typeof notifications !== 'undefined') {
            notifications.warning('Config.json не найден, создан новый');
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки Config.json:', e);
        mpgState.config = {
            configVersion: 6,
            documentation: "https://docs.mpg-dayz.ru/spawner/",
            isModDisabled: 0,
            logLevel: 3,
            pointsConfigs: [],
            admins: []
        };
        if (typeof notifications !== 'undefined') {
            notifications.warning('Config.json не найден, создан новый');
        }
    }
}

async function mpgSaveConfig() {
    if (!mpgState.profilesPath) {
        console.error('❌ Путь к profiles не загружен');
        return false;
    }
    
    try {
        const configPath = mpgState.profilesPath + '/' + MPG_CONFIG.paths.config;
        const content = JSON.stringify(mpgState.config, null, 4);
        
        const response = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath, content: content })
        });
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Config.json сохранён');
            return true;
        } else {
            console.warn('⚠️ Ошибка сохранения Config.json:', data.message);
            return false;
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения Config.json:', e);
        return false;
    }
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА
// ============================================

function renderMpgEditor(container) {
    container.innerHTML = `
        <div class="mpg-editor">
            <button class="mpg-back-btn" onclick="mpgBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <div class="mpg-header">
                <div class="mpg-header-info">
                    <span class="mpg-header-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="2"/>
                            <line x1="12" y1="2" x2="12" y2="4"/>
                            <line x1="12" y1="20" x2="12" y2="22"/>
                            <line x1="2" y1="12" x2="4" y2="12"/>
                            <line x1="20" y1="12" x2="22" y2="12"/>
                        </svg>
                    </span>
                    <div>
                        <h2 class="mpg-header-title">MPG Spawner Editor</h2>
                        <p class="mpg-header-subtitle">Редактор точек спавна для мода MPG Spawner</p>
                    </div>
                </div>
                <div class="mpg-header-actions">
                    <button class="btn btn-primary" onclick="mpgSaveAll()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Сохранить всё
                    </button>
                    <button class="btn btn-secondary" onclick="mpgReload()">
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

            <div class="mpg-status-bar" id="mpgStatusBar">
                <span class="mpg-status">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Готово
                </span>
                <span class="mpg-path">${mpgState.profilesPath || 'Путь не указан'}</span>
            </div>
            
            <div class="mpg-tabs">
                <button class="mpg-tab ${mpgState.activeTab === 'points' ? 'active' : ''}" onclick="mpgSwitchTab('points')">
                    <span class="mpg-tab-icon">📌</span>
                    Точки
                    <span class="mpg-tab-count">${mpgState.points.length}</span>
                </button>
                <button class="mpg-tab ${mpgState.activeTab === 'groups' ? 'active' : ''}" onclick="mpgSwitchTab('groups')">
                    <span class="mpg-tab-icon">📦</span>
                    Группы
                    <span class="mpg-tab-count">${mpgState.groups.length}</span>
                </button>
                <button class="mpg-tab ${mpgState.activeTab === 'config' ? 'active' : ''}" onclick="mpgSwitchTab('config')">
                    <span class="mpg-tab-icon">⚙️</span>
                    Конфиг
                </button>
            </div>

            <div class="mpg-body">
                <!-- Точки -->
                <div class="mpg-tab-content ${mpgState.activeTab === 'points' ? 'active' : ''}" id="mpgTabPoints">
                    <div class="mpg-sidebar">
                        <div class="mpg-sidebar-header">
                            <h3>Точки спавна</h3>
                            <button class="btn btn-primary btn-sm" onclick="mpgAddPoint()">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Добавить
                            </button>
                        </div>
                        <div class="mpg-points-list" id="mpgPointsList">
                            <div class="mpg-loading">
                                <span class="spinner"></span>
                                Загрузка точек...
                            </div>
                        </div>
                    </div>
                    <div class="mpg-editor-panel">
                        <div class="mpg-editor-empty" id="mpgEditorEmpty">
                            <span class="mpg-empty-icon">📌</span>
                            <p>Выберите точку для редактирования</p>
                            <p class="mpg-empty-hint">Или создайте новую точку</p>
                        </div>
                        <div class="mpg-editor-content" id="mpgEditorContent" style="display:none;"></div>
                    </div>
                </div>

                <!-- Группы -->
                <div class="mpg-tab-content ${mpgState.activeTab === 'groups' ? 'active' : ''}" id="mpgTabGroups">
                    <div class="mpg-sidebar">
                        <div class="mpg-sidebar-header">
                            <h3>Группы</h3>
                            <button class="btn btn-primary btn-sm" onclick="mpgAddGroup()">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Добавить
                            </button>
                        </div>
                        <div class="mpg-points-list" id="mpgGroupsList">
                            <div class="mpg-loading">
                                <span class="spinner"></span>
                                Загрузка групп...
                            </div>
                        </div>
                    </div>
                    <div class="mpg-editor-panel">
                        <div class="mpg-editor-empty" id="mpgGroupEditorEmpty">
                            <span class="mpg-empty-icon">📦</span>
                            <p>Выберите группу для редактирования</p>
                            <p class="mpg-empty-hint">Или создайте новую группу</p>
                        </div>
                        <div class="mpg-editor-content" id="mpgGroupEditorContent" style="display:none;"></div>
                    </div>
                </div>

                <!-- Конфиг -->
                <div class="mpg-tab-content ${mpgState.activeTab === 'config' ? 'active' : ''}" id="mpgTabConfig">
                    <div class="mpg-config-panel">
                        <div class="mpg-config-section">
                            <h4>Основные настройки</h4>
                            <div class="mpg-form-row">
                                <div class="mpg-form-group">
                                    <label>Версия конфига</label>
                                    <input type="number" class="mpg-input" value="${mpgState.config?.configVersion || 6}" 
                                           onchange="mpgUpdateConfigField('configVersion', parseInt(this.value) || 6)">
                                </div>
                                <div class="mpg-form-group">
                                    <label>Мод отключён</label>
                                    <select class="mpg-select" onchange="mpgUpdateConfigField('isModDisabled', parseInt(this.value))">
                                        <option value="0" ${mpgState.config?.isModDisabled === 0 ? 'selected' : ''}>Нет</option>
                                        <option value="1" ${mpgState.config?.isModDisabled === 1 ? 'selected' : ''}>Да</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mpg-form-row">
                                <div class="mpg-form-group">
                                    <label>Уровень логов (0-4)</label>
                                    <input type="number" class="mpg-input" value="${mpgState.config?.logLevel || 3}" 
                                           onchange="mpgUpdateConfigField('logLevel', parseInt(this.value) || 3)"
                                           min="0" max="4">
                                </div>
                                <div class="mpg-form-group">
                                    <label>Документация</label>
                                    <input type="text" class="mpg-input" value="${mpgState.config?.documentation || 'https://docs.mpg-dayz.ru/spawner/'}" 
                                           onchange="mpgUpdateConfigField('documentation', this.value)">
                                </div>
                            </div>
                        </div>

                        <div class="mpg-config-section">
                            <h4>Файлы с точками</h4>
                            <div class="mpg-config-files">
                                <div class="mpg-config-files-list" id="mpgConfigFilesList">
                                    ${(mpgState.config?.pointsConfigs || []).map(file => `
                                        <div class="mpg-config-file-item">
                                            <span class="mpg-config-file-name">📄 ${file}.json</span>
                                            <button class="mpg-config-file-remove" onclick="mpgRemoveConfigFile('${file}')" title="Удалить из конфига">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                                </svg>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="mpg-config-add-file">
                                    <input type="text" class="mpg-input" id="mpgNewConfigFile" placeholder="Имя файла (без .json)" 
                                           onkeydown="if(event.key==='Enter') mpgAddConfigFile()">
                                    <button class="btn btn-primary btn-sm" onclick="mpgAddConfigFile()">➕ Добавить</button>
                                </div>
                            </div>
                        </div>

                        <div class="mpg-config-section">
                            <h4>Администраторы</h4>
                            <div class="mpg-config-admins">
                                <div class="mpg-config-admins-list" id="mpgConfigAdminsList">
                                    ${(mpgState.config?.admins || []).map(admin => `
                                        <div class="mpg-config-admin-item">
                                            <span class="mpg-config-admin-name">👤 ${admin}</span>
                                            <button class="mpg-config-admin-remove" onclick="mpgRemoveAdmin('${admin}')" title="Удалить админа">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                                </svg>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="mpg-config-add-admin">
                                    <input type="text" class="mpg-input" id="mpgNewAdmin" placeholder="SteamID или ник админа" 
                                           onkeydown="if(event.key==='Enter') mpgAddAdmin()">
                                    <button class="btn btn-primary btn-sm" onclick="mpgAddAdmin()">➕ Добавить</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (mpgState.activeTab === 'points' && mpgState.currentPoint !== null) {
        renderPointEditor(mpgState.currentPoint);
    }
    if (mpgState.activeTab === 'groups' && mpgState.currentGroup !== null) {
        renderGroupEditor(mpgState.currentGroup);
    }
    
    setTimeout(createMpgScrollTopButton, 300);
}

// ============================================
// МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ
// ============================================

function mpgShowConfirmModal(title, message, onConfirm, onCancel) {
    const oldModal = document.getElementById('mpgConfirmModal');
    if (oldModal) {
        oldModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'mpgConfirmModal';
    modal.className = 'modal-overlay mpg-confirm-modal';
    modal.innerHTML = `
        <div class="modal-content modal-confirm">
            <div class="modal-confirm-header">
                <div class="modal-confirm-icon">⚠️</div>
                <h3>${title}</h3>
            </div>
            <div class="modal-body modal-confirm-body">
                <p class="modal-confirm-text">${message}</p>
            </div>
            <div class="modal-footer modal-confirm-footer">
                <button class="btn btn-secondary" id="mpgConfirmCancel">Отмена</button>
                <button class="btn btn-danger" id="mpgConfirmOk">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    </svg>
                    Удалить
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    modal.querySelector('#mpgConfirmCancel').addEventListener('click', () => {
        closeMpgConfirmModal();
        if (typeof onCancel === 'function') onCancel();
    });

    modal.querySelector('#mpgConfirmOk').addEventListener('click', () => {
        closeMpgConfirmModal();
        if (typeof onConfirm === 'function') onConfirm();
    });

    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeMpgConfirmModal();
            if (typeof onCancel === 'function') onCancel();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMpgConfirmModal();
            if (typeof onCancel === 'function') onCancel();
        }
    });
}

function closeMpgConfirmModal() {
    const modal = document.getElementById('mpgConfirmModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================

function mpgSwitchTab(tab) {
    if (mpgState.isDirty) {
        mpgShowConfirmModal(
            'Несохранённые изменения',
            'Есть несохранённые изменения. Переключить вкладку без сохранения?',
            function() {
                mpgState.isDirty = false;
                mpgState.activeTab = tab;
                const container = document.getElementById('editorContentArea');
                if (container) {
                    renderMpgEditor(container);
                }
                renderPointsList();
                renderGroupsList();
                updateStatus('✅ Готово');
            },
            function() {}
        );
        return;
    }
    
    mpgState.activeTab = tab;
    const container = document.getElementById('editorContentArea');
    if (container) {
        renderMpgEditor(container);
    }
    renderPointsList();
    renderGroupsList();
}

// ============================================
// ВОЗВРАТ К ПЛИТКАМ
// ============================================

function mpgBackToTiles() {
    destroyMpgScrollTopButton();
    
    if (mpgState.isDirty) {
        mpgShowConfirmModal(
            'Несохранённые изменения',
            'Есть несохранённые изменения. Вы уверены, что хотите выйти без сохранения?',
            function() {
                const container = document.getElementById('editorContentArea');
                if (!container) return;
                
                mpgState.currentPoint = null;
                mpgState.currentGroup = null;
                mpgState.isDirty = false;
                isMpgEditorOpen = false;
                
                if (typeof openEditor === 'function') {
                    const select = document.getElementById('editorSelect');
                    if (select) {
                        const value = select.value;
                        if (value && EDITORS_CONFIG[value]) {
                            openEditor(value);
                        }
                    }
                }
            },
            function() {}
        );
        return;
    }
    
    const container = document.getElementById('editorContentArea');
    if (!container) return;
    
    mpgState.currentPoint = null;
    mpgState.currentGroup = null;
    mpgState.isDirty = false;
    isMpgEditorOpen = false;
    
    if (typeof openEditor === 'function') {
        const select = document.getElementById('editorSelect');
        if (select) {
            const value = select.value;
            if (value && EDITORS_CONFIG[value]) {
                openEditor(value);
            }
        }
    }
}

// ============================================
// ЗАГРУЗКА ТОЧЕК
// ============================================

async function loadPoints() {
    mpgState.points = [];
    const pointsDir = mpgState.profilesPath + '/' + MPG_CONFIG.paths.points;
    
    try {
        const response = await fetch('/api/mpg/points/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: pointsDir })
        });
        const data = await response.json();
        
        if (data.success && data.files) {
            for (const file of data.files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = pointsDir + '/' + file;
                        const fileResponse = await fetch('/api/file/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: filePath })
                        });
                        const fileData = await fileResponse.json();
                        if (fileData.success) {
                            const points = JSON.parse(fileData.content);
                            if (Array.isArray(points)) {
                                mpgState.points.push(...points.map(p => ({
                                    ...p,
                                    _file: file
                                })));
                            }
                        }
                    } catch (e) {
                        console.warn(`⚠️ Ошибка загрузки ${file}:`, e);
                    }
                }
            }
        }
        console.log(`✅ Загружено ${mpgState.points.length} точек`);
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить точки:', e);
        if (typeof notifications !== 'undefined') {
            notifications.warning('Не удалось загрузить точки спавна');
        }
    }
}

// ============================================
// ЗАГРУЗКА ГРУПП
// ============================================

async function loadGroups() {
    mpgState.groups = [];
    const groupsDir = mpgState.profilesPath + '/' + MPG_CONFIG.paths.groups;
    
    try {
        const response = await fetch('/api/mpg/points/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: groupsDir })
        });
        const data = await response.json();
        
        if (data.success && data.files) {
            for (const file of data.files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = groupsDir + '/' + file;
                        const fileResponse = await fetch('/api/file/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: filePath })
                        });
                        const fileData = await fileResponse.json();
                        if (fileData.success) {
                            const groups = JSON.parse(fileData.content);
                            if (Array.isArray(groups)) {
                                mpgState.groups.push(...groups.map(g => ({
                                    ...g,
                                    _file: file
                                })));
                            }
                        }
                    } catch (e) {
                        console.warn(`⚠️ Ошибка загрузки ${file}:`, e);
                    }
                }
            }
        }
        console.log(`✅ Загружено ${mpgState.groups.length} групп`);
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить группы:', e);
        if (typeof notifications !== 'undefined') {
            notifications.warning('Не удалось загрузить группы');
        }
    }
}

// ============================================
// ОБНОВЛЕНИЕ СТАТУСА
// ============================================

function updateStatus(message) {
    const statusBar = document.getElementById('mpgStatusBar');
    if (!statusBar) return;
    const statusEl = statusBar.querySelector('.mpg-status');
    if (statusEl) statusEl.textContent = message;
}

// ============================================
// ГРУППЫ - ВСЕ ФУНКЦИИ
// ============================================

function renderGroupsList() {
    const container = document.getElementById('mpgGroupsList');
    if (!container) return;
    
    if (mpgState.groups.length === 0) {
        container.innerHTML = `
            <div class="mpg-empty-list">
                <span class="mpg-empty-icon">📭</span>
                <p>Нет групп</p>
                <button class="btn btn-primary btn-sm" onclick="mpgAddGroup()">Создать первую группу</button>
            </div>
        `;
        return;
    }
    
    let html = '';
    mpgState.groups.forEach((group, index) => {
        const isActive = mpgState.currentGroup === index;
        const disabled = group.isDisabled ? '⛔' : '✅';
        const spawnCount = (group.spawnList || []).length;
        
        html += `
            <div class="mpg-point-item ${isActive ? 'active' : ''}" onclick="mpgSelectGroup(${index})">
                <div class="mpg-point-info">
                    <span class="mpg-point-id">${group.groupName || 'Без имени'}</span>
                    <span class="mpg-point-entity-count">${spawnCount}</span>
                </div>
                <div class="mpg-point-status">${disabled}</div>
                <div class="mpg-point-actions">
                    <button class="mpg-point-delete" onclick="event.stopPropagation(); mpgConfirmDeleteGroup(${index})" title="Удалить группу">
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

function mpgSelectGroup(index) {
    destroyMpgScrollTopButton();
    mpgState.currentGroup = index;
    renderGroupsList();
    renderGroupEditor(index);
}

function renderGroupEditor(index) {
    const container = document.getElementById('mpgGroupEditorContent');
    const empty = document.getElementById('mpgGroupEditorEmpty');
    const group = mpgState.groups[index];
    
    if (!group) {
        if (container) container.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    if (container) container.style.display = 'block';
    
    const weatherOptions = MPG_CONFIG.weather.map(w => 
        `<option value="${w}" ${group.weather && group.weather.includes(w) ? 'selected' : ''}>${w}</option>`
    ).join('');
    
    const animalList = getLootList('animals', MPG_CONFIG.entityTypes.animals);
    const zombieList = getLootList('zombies', MPG_CONFIG.entityTypes.zombies);
    
    const animalOptions = animalList.map(a => 
        `<option value="${a}">${a}</option>`
    ).join('');
    
    const zombieOptions = zombieList.map(z => 
        `<option value="${z}">${z}</option>`
    ).join('');
    
    container.innerHTML = `
        <div class="mpg-editor-form">
            <div class="mpg-form-section">
                <h4>Основные настройки</h4>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Название группы</label>
                    <input type="text" class="mpg-input" value="${group.groupName || ''}" 
                           onchange="mpgUpdateGroupField(${index}, 'groupName', this.value)">
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Отключена</label>
                        <select class="mpg-select" onchange="mpgUpdateGroupField(${index}, 'isDisabled', parseInt(this.value))">
                            <option value="0" ${group.isDisabled === 0 ? 'selected' : ''}>Нет</option>
                            <option value="1" ${group.isDisabled === 1 ? 'selected' : ''}>Да</option>
                        </select>
                    </div>
                    <div class="mpg-form-group">
                        <label>Шанс появления</label>
                        <input type="number" step="0.1" class="mpg-input" value="${group.chance || 1.0}" 
                               onchange="mpgUpdateGroupField(${index}, 'chance', parseFloat(this.value) || 1.0)">
                    </div>
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Время спавна</label>
                        <input type="text" class="mpg-input" value="${group.spawnTime || '0-24'}" 
                               onchange="mpgUpdateGroupField(${index}, 'spawnTime', this.value)"
                               placeholder="6-18 или 18-6">
                    </div>
                    <div class="mpg-form-group">
                        <label>Спавн один раз</label>
                        <select class="mpg-select" onchange="mpgUpdateGroupField(${index}, 'spawnOnce', parseInt(this.value))">
                            <option value="0" ${group.spawnOnce === 0 ? 'selected' : ''}>Нет</option>
                            <option value="1" ${group.spawnOnce === 1 ? 'selected' : ''}>Да</option>
                        </select>
                    </div>
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Погода (выберите несколько)</label>
                    <select class="mpg-select mpg-select-multiple" multiple size="4" 
                           onchange="mpgUpdateGroupWeather(${index}, this)">
                        ${weatherOptions}
                    </select>
                </div>
            </div>

            <div class="mpg-form-section">
                <h4>Сущности группы</h4>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Добавить животное</label>
                        <div class="mpg-add-entity">
                            <select class="mpg-select" id="mpgGroupAnimalSelect">
                                ${animalOptions}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="mpgAddGroupEntity(${index}, 'animals')">➕</button>
                        </div>
                    </div>
                    <div class="mpg-form-group">
                        <label>Добавить зомби</label>
                        <div class="mpg-add-entity">
                            <select class="mpg-select" id="mpgGroupZombieSelect">
                                ${zombieOptions}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="mpgAddGroupEntity(${index}, 'zombies')">➕</button>
                        </div>
                    </div>
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Текущий список</label>
                    <div class="mpg-tag-list" id="mpgGroupTagList_${index}">
                        ${(group.spawnList || []).map(s => `
                            <span class="mpg-tag">
                                ${s}
                                <span class="mpg-tag-remove" onclick="mpgRemoveFromGroupList(${index}, '${s.replace(/'/g, "\\'")}')">×</span>
                            </span>
                        `).join('')}
                    </div>
                    <input type="text" class="mpg-input" placeholder="Или введите вручную и нажмите Enter" 
                           onkeydown="if(event.key==='Enter') mpgAddCustomGroupEntity(${index}, this)">
                </div>
            </div>
        </div>
    `;
    
    setTimeout(createMpgScrollTopButton, 300);
}

// ============================================
// ТОЧКИ - ВСЕ ФУНКЦИИ
// ============================================

function renderPointsList() {
    const container = document.getElementById('mpgPointsList');
    if (!container) return;
    
    if (mpgState.points.length === 0) {
        container.innerHTML = `
            <div class="mpg-empty-list">
                <span class="mpg-empty-icon">📭</span>
                <p>Нет точек спавна</p>
                <button class="btn btn-primary btn-sm" onclick="mpgAddPoint()">Создать первую точку</button>
            </div>
        `;
        return;
    }
    
    let html = '';
    mpgState.points.forEach((point, index) => {
        const isActive = mpgState.currentPoint === index;
        const disabled = point.isDisabled ? '⛔' : '✅';
        const id = point.pointId || index + 1;
        const entityCount = (point.spawnList || []).length;
        
        html += `
            <div class="mpg-point-item ${isActive ? 'active' : ''}" onclick="mpgSelectPoint(${index})">
                <div class="mpg-point-info">
                    <span class="mpg-point-id">#${id}</span>
                    <span class="mpg-point-title">${point.notificationTitle || 'Без названия'}</span>
                    <span class="mpg-point-entity-count">${entityCount}</span>
                </div>
                <div class="mpg-point-status">${disabled}</div>
                <div class="mpg-point-actions">
                    <button class="mpg-point-delete" onclick="event.stopPropagation(); mpgConfirmDeletePoint(${index})" title="Удалить точку">
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

function mpgSelectPoint(index) {
    destroyMpgScrollTopButton();
    mpgState.currentPoint = index;
    renderPointsList();
    renderPointEditor(index);
}

function renderPointEditor(index) {
    const container = document.getElementById('mpgEditorContent');
    const empty = document.getElementById('mpgEditorEmpty');
    const point = mpgState.points[index];
    
    if (!point) {
        if (container) container.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    if (container) container.style.display = 'block';
    
    const animalList = getLootList('animals', MPG_CONFIG.entityTypes.animals);
    const zombieList = getLootList('zombies', MPG_CONFIG.entityTypes.zombies);
    const itemList = getLootList('items', MPG_CONFIG.entityTypes.items);
    
    const animalOptions = animalList.map(a => 
        `<option value="${a}">${a}</option>`
    ).join('');
    
    const zombieOptions = zombieList.map(z => 
        `<option value="${z}">${z}</option>`
    ).join('');
    
    const itemOptions = itemList.map(i => 
        `<option value="${i}">${i}</option>`
    ).join('');
    
    container.innerHTML = `
        <div class="mpg-editor-form">
            <div class="mpg-form-section">
                <h4>Основные настройки</h4>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>ID точки</label>
                        <input type="number" class="mpg-input" value="${point.pointId || ''}" 
                               onchange="mpgUpdatePointField(${index}, 'pointId', parseInt(this.value) || 0)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Отключена</label>
                        <select class="mpg-select" onchange="mpgUpdatePointField(${index}, 'isDisabled', parseInt(this.value))">
                            <option value="0" ${point.isDisabled === 0 ? 'selected' : ''}>Нет</option>
                            <option value="1" ${point.isDisabled === 1 ? 'selected' : ''}>Да</option>
                        </select>
                    </div>
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Название</label>
                    <input type="text" class="mpg-input" value="${point.notificationTitle || ''}" 
                           onchange="mpgUpdatePointField(${index}, 'notificationTitle', this.value)">
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Радиус триггера</label>
                        <input type="text" class="mpg-input" value="${point.triggerRadius || '50.0'}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerRadius', this.value)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Цвет дебага</label>
                        <select class="mpg-select" onchange="mpgUpdatePointField(${index}, 'triggerDebugColor', this.value)">
                            <option value="red" ${point.triggerDebugColor === 'red' ? 'selected' : ''}>🔴 Красный</option>
                            <option value="green" ${point.triggerDebugColor === 'green' ? 'selected' : ''}>🟢 Зелёный</option>
                            <option value="blue" ${point.triggerDebugColor === 'blue' ? 'selected' : ''}>🔵 Синий</option>
                            <option value="yellow" ${point.triggerDebugColor === 'yellow' ? 'selected' : ''}>🟡 Жёлтый</option>
                        </select>
                    </div>
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Позиция (X Y Z)</label>
                    <input type="text" class="mpg-input" value="${point.triggerPosition || ''}" 
                           onchange="mpgUpdatePointField(${index}, 'triggerPosition', this.value)"
                           placeholder="4246.0 333.7 5586.7">
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Высота триггера</label>
                        <input type="text" class="mpg-input" value="${point.triggerHeight || ''}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerHeight', this.value)"
                               placeholder="15.0">
                    </div>
                    <div class="mpg-form-group">
                        <label>Ширина X</label>
                        <input type="text" class="mpg-input" value="${point.triggerWidthX || ''}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerWidthX', this.value)"
                               placeholder="20.0">
                    </div>
                    <div class="mpg-form-group">
                        <label>Ширина Y</label>
                        <input type="text" class="mpg-input" value="${point.triggerWidthY || ''}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerWidthY', this.value)"
                               placeholder="10.0">
                    </div>
                </div>
            </div>

            <div class="mpg-form-section">
                <h4>Уведомления</h4>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Текст входа</label>
                    <input type="text" class="mpg-input" value="${point.notificationTextEnter || ''}" 
                           onchange="mpgUpdatePointField(${index}, 'notificationTextEnter', this.value)">
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Текст выхода</label>
                    <input type="text" class="mpg-input" value="${point.notificationTextExit || ''}" 
                           onchange="mpgUpdatePointField(${index}, 'notificationTextExit', this.value)">
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Текст спавна</label>
                    <input type="text" class="mpg-input" value="${point.notificationTextSpawn || ''}" 
                           onchange="mpgUpdatePointField(${index}, 'notificationTextSpawn', this.value)">
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Текст победы</label>
                    <input type="text" class="mpg-input" value="${point.notificationTextWin || ''}" 
                           onchange="mpgUpdatePointField(${index}, 'notificationTextWin', this.value)">
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Время уведомления (сек)</label>
                        <input type="number" class="mpg-input" value="${point.notificationTime || 8}" 
                               onchange="mpgUpdatePointField(${index}, 'notificationTime', parseInt(this.value) || 8)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Иконка уведомления</label>
                        <input type="text" class="mpg-input" value="${point.notificationIcon || 'set:dayz_gui image:iconSkull'}" 
                               onchange="mpgUpdatePointField(${index}, 'notificationIcon', this.value)">
                    </div>
                </div>
            </div>

            <div class="mpg-form-section">
                <h4>Настройки спавна</h4>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Минимальное количество</label>
                        <input type="number" class="mpg-input" value="${point.spawnMin || 1}" 
                               onchange="mpgUpdatePointField(${index}, 'spawnMin', parseInt(this.value) || 1)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Максимальное количество</label>
                        <input type="number" class="mpg-input" value="${point.spawnMax || 5}" 
                               onchange="mpgUpdatePointField(${index}, 'spawnMax', parseInt(this.value) || 5)">
                    </div>
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Радиус спавна</label>
                        <input type="text" class="mpg-input" value="${point.spawnRadius || '50.0'}" 
                               onchange="mpgUpdatePointField(${index}, 'spawnRadius', this.value)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Лимит спавна</label>
                        <input type="number" class="mpg-input" value="${point.spawnCountLimit || 30}" 
                               onchange="mpgUpdatePointField(${index}, 'spawnCountLimit', parseInt(this.value) || 30)">
                    </div>
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Задержка первого спавна</label>
                        <input type="text" class="mpg-input" value="${point.triggerFirstDelay || '10-15'}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerFirstDelay', this.value)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Кулдаун</label>
                        <input type="text" class="mpg-input" value="${point.triggerCooldown || '60-70'}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerCooldown', this.value)">
                    </div>
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Безопасное расстояние</label>
                        <input type="text" class="mpg-input" value="${point.triggerSafeDistance || 25.0}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerSafeDistance', parseFloat(this.value) || 0)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Задержка входа</label>
                        <input type="number" class="mpg-input" value="${point.triggerEnterDelay || 0}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerEnterDelay', parseInt(this.value) || 0)">
                    </div>
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Позиции спавна (каждая с новой строки)</label>
                    <textarea class="mpg-textarea mpg-textarea-large" 
                           onchange="mpgUpdatePointField(${index}, 'spawnPositions', this.value.split('\\n').filter(s => s.trim()))">${(point.spawnPositions || ['0.0 0.0 0.0']).join('\n')}</textarea>
                </div>
            </div>

            <div class="mpg-form-section">
                <h4>Сущности для спавна</h4>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Добавить животное</label>
                        <div class="mpg-add-entity">
                            <select class="mpg-select" id="mpgAnimalSelect">
                                ${animalOptions}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="mpgAddEntity(${index}, 'animals')">➕</button>
                        </div>
                    </div>
                    <div class="mpg-form-group">
                        <label>Добавить зомби</label>
                        <div class="mpg-add-entity">
                            <select class="mpg-select" id="mpgZombieSelect">
                                ${zombieOptions}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="mpgAddEntity(${index}, 'zombies')">➕</button>
                        </div>
                    </div>
                    <div class="mpg-form-group">
                        <label>Добавить предмет</label>
                        <div class="mpg-add-entity">
                            <select class="mpg-select" id="mpgItemSelect">
                                ${itemOptions}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="mpgAddEntity(${index}, 'items')">➕</button>
                        </div>
                    </div>
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Текущий список спавна</label>
                    <div class="mpg-tag-list" id="mpgTagList_${index}">
                        ${(point.spawnList || []).map(s => `
                            <span class="mpg-tag">
                                ${s}
                                <span class="mpg-tag-remove" onclick="mpgRemoveFromSpawnList(${index}, '${s.replace(/'/g, "\\'")}')">×</span>
                            </span>
                        `).join('')}
                    </div>
                    <input type="text" class="mpg-input" placeholder="Или введите вручную и нажмите Enter" 
                           onkeydown="if(event.key==='Enter') mpgAddCustomEntity(${index}, this)">
                </div>
            </div>

            <div class="mpg-form-section">
                <h4>Очистка и зависимости</h4>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Очищать убитых животных</label>
                        <select class="mpg-select" onchange="mpgUpdatePointField(${index}, 'clearDeathAnimals', parseInt(this.value))">
                            <option value="0" ${point.clearDeathAnimals === 0 ? 'selected' : ''}>Нет</option>
                            <option value="1" ${point.clearDeathAnimals === 1 ? 'selected' : ''}>Да</option>
                        </select>
                    </div>
                    <div class="mpg-form-group">
                        <label>Очищать убитых зомби</label>
                        <select class="mpg-select" onchange="mpgUpdatePointField(${index}, 'clearDeathZombies', parseInt(this.value))">
                            <option value="0" ${point.clearDeathZombies === 0 ? 'selected' : ''}>Нет</option>
                            <option value="1" ${point.clearDeathZombies === 1 ? 'selected' : ''}>Да</option>
                        </select>
                    </div>
                </div>
                <div class="mpg-form-group mpg-form-group-full">
                    <label>Зависимости (ID точек через запятую)</label>
                    <input type="text" class="mpg-input" value="${(point.triggerDependencies || []).join(', ')}" 
                           onchange="mpgUpdatePointField(${index}, 'triggerDependencies', this.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)))">
                </div>
                <div class="mpg-form-row">
                    <div class="mpg-form-group">
                        <label>Время работы (часы)</label>
                        <input type="text" class="mpg-input" value="${point.triggerWorkingTime || '0-24'}" 
                               onchange="mpgUpdatePointField(${index}, 'triggerWorkingTime', this.value)">
                    </div>
                    <div class="mpg-form-group">
                        <label>Отключить при победе</label>
                        <select class="mpg-select" onchange="mpgUpdatePointField(${index}, 'triggerDisableOnWin', parseInt(this.value))">
                            <option value="0" ${point.triggerDisableOnWin === 0 ? 'selected' : ''}>Нет</option>
                            <option value="1" ${point.triggerDisableOnWin === 1 ? 'selected' : ''}>Да</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(createMpgScrollTopButton, 300);
}

// ============================================
// ГРУППЫ - ОСТАЛЬНЫЕ ФУНКЦИИ
// ============================================

function mpgUpdateGroupField(index, field, value) {
    if (!mpgState.groups[index]) return;
    mpgState.groups[index][field] = value;
    mpgState.isDirty = true;
    updateStatus('⚠️ Есть несохранённые изменения');
    renderGroupsList();
}

function mpgUpdateGroupWeather(index, select) {
    const selected = Array.from(select.selectedOptions).map(o => o.value);
    if (!mpgState.groups[index]) return;
    mpgState.groups[index].weather = selected;
    mpgState.isDirty = true;
    updateStatus('⚠️ Есть несохранённые изменения');
}

function mpgAddGroupEntity(index, type) {
    const selectId = type === 'animals' ? 'mpgGroupAnimalSelect' : 'mpgGroupZombieSelect';
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const value = select.value;
    if (!value) return;
    
    const group = mpgState.groups[index];
    if (!group) return;
    
    if (!group.spawnList) group.spawnList = [];
    if (!group.spawnList.includes(value)) {
        group.spawnList.push(value);
        mpgState.isDirty = true;
        updateStatus('⚠️ Есть несохранённые изменения');
        renderGroupEditor(index);
        renderGroupsList();
        if (typeof notifications !== 'undefined') {
            notifications.success(`Добавлено: ${value}`);
        }
    } else {
        if (typeof notifications !== 'undefined') {
            notifications.warning(`"${value}" уже есть в списке`);
        }
    }
}

function mpgAddCustomGroupEntity(index, input) {
    const value = input.value.trim();
    if (!value) return;
    
    const group = mpgState.groups[index];
    if (!group) return;
    
    if (!group.spawnList) group.spawnList = [];
    if (!group.spawnList.includes(value)) {
        group.spawnList.push(value);
        mpgState.isDirty = true;
        updateStatus('⚠️ Есть несохранённые изменения');
        renderGroupEditor(index);
        renderGroupsList();
        if (typeof notifications !== 'undefined') {
            notifications.success(`Добавлено: ${value}`);
        }
    } else {
        if (typeof notifications !== 'undefined') {
            notifications.warning(`"${value}" уже есть в списке`);
        }
    }
    input.value = '';
}

function mpgRemoveFromGroupList(index, value) {
    const group = mpgState.groups[index];
    if (!group) return;
    
    group.spawnList = (group.spawnList || []).filter(s => s !== value);
    mpgState.isDirty = true;
    updateStatus('⚠️ Есть несохранённые изменения');
    renderGroupEditor(index);
    renderGroupsList();
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалено: ${value}`);
    }
}

function mpgAddGroup() {
    const newGroup = {
        groupName: `Группа ${mpgState.groups.length + 1}`,
        isDisabled: 0,
        spawnTime: "0-24",
        chance: 1.0,
        weather: ["clear", "cloudy"],
        spawnList: [],
        isAiBandits: 0,
        spawnOnce: 0,
        notificationTextSpawn: "",
        _file: `Groups_${String(mpgState.groups.length + 1).padStart(2, '0')}.json`
    };
    
    mpgState.groups.push(newGroup);
    mpgState.currentGroup = mpgState.groups.length - 1;
    mpgState.isDirty = true;
    
    renderGroupsList();
    renderGroupEditor(mpgState.currentGroup);
    updateStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Создана новая группа: ${newGroup.groupName}`);
    }
}

function mpgConfirmDeleteGroup(index) {
    const group = mpgState.groups[index];
    if (!group) return;
    
    mpgShowConfirmModal(
        'Удаление группы',
        `Вы уверены, что хотите удалить группу "<strong>${group.groupName}</strong>"?<br>Это действие нельзя отменить.`,
        function() {
            mpgExecuteDeleteGroup(index);
        },
        function() {}
    );
}

function mpgExecuteDeleteGroup(index) {
    const group = mpgState.groups[index];
    if (!group) return;
    
    const groupName = group.groupName;
    
    mpgState.groups.splice(index, 1);
    if (mpgState.currentGroup === index) {
        mpgState.currentGroup = null;
    } else if (mpgState.currentGroup > index) {
        mpgState.currentGroup--;
    }
    mpgState.isDirty = true;
    
    renderGroupsList();
    renderGroupEditor(mpgState.currentGroup);
    updateStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалена группа: ${groupName}`);
    }
}

// ============================================
// ТОЧКИ - ОСТАЛЬНЫЕ ФУНКЦИИ
// ============================================

function mpgUpdatePointField(index, field, value) {
    if (!mpgState.points[index]) return;
    mpgState.points[index][field] = value;
    mpgState.isDirty = true;
    updateStatus('⚠️ Есть несохранённые изменения');
}

function mpgAddEntity(index, type) {
    const selectId = type === 'animals' ? 'mpgAnimalSelect' : 
                     type === 'zombies' ? 'mpgZombieSelect' : 'mpgItemSelect';
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const value = select.value;
    if (!value) return;
    
    const point = mpgState.points[index];
    if (!point) return;
    
    if (!point.spawnList) point.spawnList = [];
    if (!point.spawnList.includes(value)) {
        point.spawnList.push(value);
        mpgState.isDirty = true;
        updateStatus('⚠️ Есть несохранённые изменения');
        renderPointEditor(index);
        if (typeof notifications !== 'undefined') {
            notifications.success(`Добавлено: ${value}`);
        }
    } else {
        if (typeof notifications !== 'undefined') {
            notifications.warning(`"${value}" уже есть в списке`);
        }
    }
}

function mpgAddCustomEntity(index, input) {
    const value = input.value.trim();
    if (!value) return;
    
    const point = mpgState.points[index];
    if (!point) return;
    
    if (!point.spawnList) point.spawnList = [];
    if (!point.spawnList.includes(value)) {
        point.spawnList.push(value);
        mpgState.isDirty = true;
        updateStatus('⚠️ Есть несохранённые изменения');
        renderPointEditor(index);
        if (typeof notifications !== 'undefined') {
            notifications.success(`Добавлено: ${value}`);
        }
    } else {
        if (typeof notifications !== 'undefined') {
            notifications.warning(`"${value}" уже есть в списке`);
        }
    }
    input.value = '';
}

function mpgRemoveFromSpawnList(index, value) {
    const point = mpgState.points[index];
    if (!point) return;
    
    point.spawnList = (point.spawnList || []).filter(s => s !== value);
    mpgState.isDirty = true;
    updateStatus('⚠️ Есть несохранённые изменения');
    renderPointEditor(index);
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалено: ${value}`);
    }
}

function mpgAddPoint() {
    const nextId = mpgState.points.reduce((max, p) => Math.max(max, p.pointId || 0), 0) + 1;
    
    const newPoint = {
        pointId: nextId,
        isLogsEnabled: 1,
        isDisabled: 0,
        showVisualisation: 0,
        showEntityLabels: 0,
        notificationTitle: `Точка ${nextId}`,
        notificationTextEnter: `Вы вошли в точку ${nextId}`,
        notificationTextExit: `Вы покинули точку ${nextId}`,
        notificationTextSpawn: "Где-то рядом появились новые сущности.",
        notificationTextWin: "Замечательно! Вы убили всех врагов!",
        notificationTime: 8,
        notificationIcon: "set:dayz_gui image:iconSkull",
        triggerDependencies: [],
        triggerDependenciesAnyOf: 0,
        triggersToEnableOnEnter: [],
        triggersToEnableOnFirstSpawn: [],
        triggersToEnableOnWin: [],
        triggersToEnableOnLeave: [],
        triggerPosition: "0.0 0.0 0.0",
        triggerDebugColor: "red",
        triggerRadius: "50.0",
        triggerHeight: "",
        triggerWidthX: "",
        triggerWidthY: "",
        triggerFirstDelay: "10-15",
        triggerCooldown: "60-70",
        triggerSafeDistance: 25.0,
        triggerEnterDelay: 0,
        triggerCleanupOnLeave: 0,
        triggerCleanupOnLunchTime: 0,
        triggerCleanupImmersive: 0,
        triggerCleanupDelay: 0,
        triggerInactiveResetDelay: 0,
        triggerWorkingTime: "0-24",
        triggerDisableOnWin: 0,
        triggerDisableOnLeave: 0,
        spawnPositions: ["0.0 0.0 0.0"],
        spawnRadius: "50.0",
        spawnMin: 2,
        spawnMax: 5,
        spawnCountLimit: 30,
        spawnLoopInside: 1,
        spawnQueueDelay: 0,
        triggerRequireItem: {},
        enableEquipCE: 0,
        spawnList: [],
        clearDeathAnimals: 0,
        clearDeathZombies: 0,
        mappingData: [],
        _file: `Point_${String(nextId).padStart(2, '0')}.json`
    };
    
    mpgState.points.push(newPoint);
    mpgState.currentPoint = mpgState.points.length - 1;
    mpgState.isDirty = true;
    
    renderPointsList();
    renderPointEditor(mpgState.currentPoint);
    updateStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Создана новая точка #${nextId}`);
    }
}

function mpgConfirmDeletePoint(index) {
    const point = mpgState.points[index];
    if (!point) return;
    
    const pointName = point.notificationTitle || `Точка #${point.pointId}`;
    
    mpgShowConfirmModal(
        'Удаление точки',
        `Вы уверены, что хотите удалить точку "<strong>${pointName}</strong>"?<br>Это действие нельзя отменить.`,
        function() {
            mpgExecuteDeletePoint(index);
        },
        function() {}
    );
}

function mpgExecuteDeletePoint(index) {
    const point = mpgState.points[index];
    if (!point) return;
    
    const pointName = point.notificationTitle || `Точка #${point.pointId}`;
    
    mpgState.points.splice(index, 1);
    if (mpgState.currentPoint === index) {
        mpgState.currentPoint = null;
    } else if (mpgState.currentPoint > index) {
        mpgState.currentPoint--;
    }
    mpgState.isDirty = true;
    
    renderPointsList();
    renderPointEditor(mpgState.currentPoint);
    updateStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалена точка: ${pointName}`);
    }
}

// ============================================
// КОНФИГ - УПРАВЛЕНИЕ
// ============================================

function mpgUpdateConfigField(field, value) {
    if (!mpgState.config) return;
    mpgState.config[field] = value;
    mpgState.isDirty = true;
    updateStatus('⚠️ Есть несохранённые изменения');
}

function mpgAddConfigFile() {
    const input = document.getElementById('mpgNewConfigFile');
    if (!input) return;
    
    const fileName = input.value.trim();
    if (!fileName) {
        if (typeof notifications !== 'undefined') {
            notifications.warning('Введите имя файла');
        }
        return;
    }
    
    if (!mpgState.config.pointsConfigs) {
        mpgState.config.pointsConfigs = [];
    }
    
    if (mpgState.config.pointsConfigs.includes(fileName)) {
        if (typeof notifications !== 'undefined') {
            notifications.warning(`Файл "${fileName}.json" уже есть в списке`);
        }
        return;
    }
    
    mpgState.config.pointsConfigs.push(fileName);
    mpgState.isDirty = true;
    input.value = '';
    updateStatus('⚠️ Есть несохранённые изменения');
    renderMpgEditor(document.getElementById('editorContentArea'));
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Добавлен файл: ${fileName}.json`);
    }
}

function mpgRemoveConfigFile(fileName) {
    mpgShowConfirmModal(
        'Удаление файла из конфига',
        `Удалить файл "<strong>${fileName}.json</strong>" из конфига?<br>Сам файл не будет удалён.`,
        function() {
            mpgState.config.pointsConfigs = mpgState.config.pointsConfigs.filter(f => f !== fileName);
            mpgState.isDirty = true;
            updateStatus('⚠️ Есть несохранённые изменения');
            renderMpgEditor(document.getElementById('editorContentArea'));
            if (typeof notifications !== 'undefined') {
                notifications.info(`Файл удалён из конфига: ${fileName}.json`);
            }
        },
        function() {}
    );
}

function mpgAddAdmin() {
    const input = document.getElementById('mpgNewAdmin');
    if (!input) return;
    
    const admin = input.value.trim();
    if (!admin) {
        if (typeof notifications !== 'undefined') {
            notifications.warning('Введите SteamID или ник админа');
        }
        return;
    }
    
    if (!mpgState.config.admins) {
        mpgState.config.admins = [];
    }
    
    if (mpgState.config.admins.includes(admin)) {
        if (typeof notifications !== 'undefined') {
            notifications.warning(`Админ "${admin}" уже есть в списке`);
        }
        return;
    }
    
    mpgState.config.admins.push(admin);
    mpgState.isDirty = true;
    input.value = '';
    updateStatus('⚠️ Есть несохранённые изменения');
    renderMpgEditor(document.getElementById('editorContentArea'));
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Добавлен админ: ${admin}`);
    }
}

function mpgRemoveAdmin(admin) {
    mpgShowConfirmModal(
        'Удаление администратора',
        `Удалить администратора "<strong>${admin}</strong>"?`,
        function() {
            mpgState.config.admins = mpgState.config.admins.filter(a => a !== admin);
            mpgState.isDirty = true;
            updateStatus('⚠️ Есть несохранённые изменения');
            renderMpgEditor(document.getElementById('editorContentArea'));
            if (typeof notifications !== 'undefined') {
                notifications.info(`Админ удалён: ${admin}`);
            }
        },
        function() {}
    );
}

// ============================================
// СОХРАНЕНИЕ
// ============================================

async function mpgSaveAll() {
    updateStatus('⏳ Сохранение...');
    
    try {
        const pointsDir = mpgState.profilesPath + '/' + MPG_CONFIG.paths.points;
        const pointFiles = {};
        
        mpgState.points.forEach(point => {
            const file = point._file || `Point_${String(point.pointId || 1).padStart(2, '0')}.json`;
            if (!pointFiles[file]) pointFiles[file] = [];
            pointFiles[file].push(point);
        });
        
        for (const [file, points] of Object.entries(pointFiles)) {
            const path = pointsDir + '/' + file;
            const content = JSON.stringify(points, null, 4);
            
            const response = await fetch('/api/file/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path, content: content })
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(`Ошибка сохранения ${file}: ${data.message}`);
            }
            console.log(`✅ Сохранён: ${file}`);
        }
        
        const groupsDir = mpgState.profilesPath + '/' + MPG_CONFIG.paths.groups;
        const groupFiles = {};
        
        mpgState.groups.forEach(group => {
            const file = group._file || `Groups_${String(mpgState.groups.indexOf(group) + 1).padStart(2, '0')}.json`;
            if (!groupFiles[file]) groupFiles[file] = [];
            groupFiles[file].push(group);
        });
        
        for (const [file, groups] of Object.entries(groupFiles)) {
            const path = groupsDir + '/' + file;
            const content = JSON.stringify(groups, null, 4);
            
            const response = await fetch('/api/file/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: path, content: content })
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(`Ошибка сохранения ${file}: ${data.message}`);
            }
            console.log(`✅ Сохранён: ${file}`);
        }
        
        await mpgSaveConfig();
        
        mpgState.isDirty = false;
        const totalPoints = mpgState.points.length;
        const totalGroups = mpgState.groups.length;
        updateStatus(`✅ Сохранено ${totalPoints} точек, ${totalGroups} групп, Config.json`);
        
        if (typeof notifications !== 'undefined') {
            notifications.success(`Сохранено ${totalPoints} точек, ${totalGroups} групп и Config.json`);
        }
        
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        updateStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сохранения: ' + e.message);
        }
    }
}

function mpgReload() {
    if (mpgState.isDirty) {
        mpgShowConfirmModal(
            'Несохранённые изменения',
            'Есть несохранённые изменения. Перезагрузить без сохранения?',
            function() {
                loadAllData();
            },
            function() {}
        );
        return;
    }
    loadAllData();
}

// ============================================
// ПЛАВАЮЩАЯ КНОПКА "НАВЕРХ" ДЛЯ MPG EDITOR
// ============================================

let mpgScrollTopBtn = null;
let mpgScrollCheckTimer = null;

function createMpgScrollTopButton() {
    const oldBtn = document.getElementById('mpgScrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        mpgScrollTopBtn = null;
    }
    
    if (mpgScrollCheckTimer) {
        clearInterval(mpgScrollCheckTimer);
        mpgScrollCheckTimer = null;
    }
    
    mpgScrollTopBtn = document.createElement('button');
    mpgScrollTopBtn.id = 'mpgScrollTopBtn';
    mpgScrollTopBtn.innerHTML = '↑';
    mpgScrollTopBtn.title = 'Наверх';
    
    let isScrolling = false;
    
    mpgScrollTopBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (isScrolling) return;
        isScrolling = true;
        
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            const scrollContainer = contentArea.querySelector('div:first-child');
            if (scrollContainer) {
                scrollContainer.scrollTo({ 
                    top: 0, 
                    behavior: 'smooth' 
                });
                
                setTimeout(function() {
                    isScrolling = false;
                }, 800);
                return;
            }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(function() {
            isScrolling = false;
        }, 800);
    });
    
    document.body.appendChild(mpgScrollTopBtn);
    console.log('✅ Кнопка "Наверх" для MPG Editor создана');
    
    mpgScrollCheckTimer = setInterval(function() {
        checkMpgScroll();
    }, 300);
    
    setTimeout(checkMpgScroll, 200);
}

function checkMpgScroll() {
    if (!mpgScrollTopBtn) return;
    
    const contentArea = document.getElementById('contentArea');
    let hasScroll = false;
    
    if (contentArea) {
        const scrollContainer = contentArea.querySelector('div:first-child');
        if (scrollContainer && scrollContainer.scrollTop > 50) {
            hasScroll = true;
        }
    }
    
    if (hasScroll) {
        mpgScrollTopBtn.classList.add('visible');
    } else {
        mpgScrollTopBtn.classList.remove('visible');
    }
}

function destroyMpgScrollTopButton() {
    if (mpgScrollCheckTimer) {
        clearInterval(mpgScrollCheckTimer);
        mpgScrollCheckTimer = null;
    }
    
    const btn = document.getElementById('mpgScrollTopBtn');
    if (btn) {
        btn.remove();
        mpgScrollTopBtn = null;
    }
}

// ============================================
// КАСТОМНЫЙ SELECT - ОКНО ВЫБОРА
// ============================================

let activeSelectModal = null;

function initCustomSelects(container) {
    console.log('🔍 [initCustomSelects] Вызвана');
    
    if (!container) return;
    
    // Находим только селекты для добавления сущностей
    const selectIds = ['mpgAnimalSelect', 'mpgZombieSelect', 'mpgItemSelect', 'mpgGroupAnimalSelect', 'mpgGroupZombieSelect'];
    
    selectIds.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        if (select.dataset.customized === 'true') return;
        
        console.log(`✅ Обрабатываю селект: ${id}`);
        select.dataset.customized = 'true';
        
        const parent = select.parentNode;
        if (!parent) return;
        
        const options = Array.from(select.options).map(opt => ({
            value: opt.value,
            text: opt.textContent
        }));
        
        // Создаём кнопку-триггер
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'mpg-custom-select-trigger';
        trigger.innerHTML = `
            <span class="mpg-custom-select-text">${select.value ? select.options[select.selectedIndex]?.text || 'Выберите...' : 'Выберите...'}</span>
            <span class="mpg-custom-select-arrow">▼</span>
        `;
        trigger.style.cssText = `
            flex: 1;
            min-width: 0;
            padding: 8px 12px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 6px;
            color: #e5e5e5;
            font-size: 0.8rem;
            font-family: "Nunito", sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            min-height: 36px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;
        `;
        
        trigger.addEventListener('mouseenter', () => {
            trigger.style.background = 'rgba(255,255,255,0.07)';
            trigger.style.borderColor = 'rgba(255,255,255,0.12)';
        });
        
        trigger.addEventListener('mouseleave', () => {
            trigger.style.background = 'rgba(255,255,255,0.04)';
            trigger.style.borderColor = 'rgba(255,255,255,0.08)';
        });
        
        // Создаём выпадающий список
        const dropdown = document.createElement('div');
        dropdown.className = 'mpg-custom-select-dropdown';
        dropdown.style.cssText = `
            display: none;
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            background: #1a1a2e;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;
        
        // Поле поиска
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Поиск...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: rgba(255,255,255,0.05);
            border: none;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            color: #e5e5e5;
            font-size: 0.8rem;
            font-family: "Nunito", sans-serif;
            outline: none;
            box-sizing: border-box;
        `;
        dropdown.appendChild(searchInput);
        
        // Список опций
        const optionsList = document.createElement('div');
        optionsList.className = 'mpg-custom-select-options';
        optionsList.style.cssText = `
            padding: 4px 0;
        `;
        dropdown.appendChild(optionsList);
        
        function renderOptions(filter = '') {
            const filtered = options.filter(opt => 
                opt.text.toLowerCase().includes(filter.toLowerCase()) ||
                opt.value.toLowerCase().includes(filter.toLowerCase())
            );
            
            optionsList.innerHTML = filtered.map(opt => `
                <div class="mpg-custom-select-option" data-value="${opt.value}" style="
                    padding: 8px 12px;
                    cursor: pointer;
                    color: #e5e5e5;
                    font-size: 0.8rem;
                    transition: background 0.2s;
                    ${opt.value === select.value ? 'background: rgba(59,130,246,0.2);' : ''}
                ">
                    ${opt.text}
                </div>
            `).join('');
            
            optionsList.querySelectorAll('.mpg-custom-select-option').forEach(el => {
                el.addEventListener('click', () => {
                    const value = el.dataset.value;
                    select.value = value;
                    const text = options.find(o => o.value === value)?.text || 'Выберите...';
                    trigger.querySelector('.mpg-custom-select-text').textContent = text;
                    dropdown.style.display = 'none';
                    
                    // Триггерим событие change
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                });
                
                el.addEventListener('mouseenter', () => {
                    el.style.background = 'rgba(255,255,255,0.05)';
                });
                
                el.addEventListener('mouseleave', () => {
                    el.style.background = el.dataset.value === select.value ? 'rgba(59,130,246,0.2)' : '';
                });
            });
        }
        
        renderOptions();
        
        searchInput.addEventListener('input', () => {
            renderOptions(searchInput.value);
        });
        
        // Позиционируем dropdown
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: relative;
            flex: 1;
            min-width: 0;
        `;
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(dropdown);
        
        // Заменяем select на wrapper
        select.style.display = 'none';
        parent.replaceChild(wrapper, select);
        wrapper.prepend(select);
        
        // Открытие/закрытие
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            
            if (!isOpen) {
                setTimeout(() => searchInput.focus(), 100);
                renderOptions(searchInput.value || '');
            }
        });
        
        // Закрытие при клике вне
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        // Обновление текста при изменении select
        select.addEventListener('change', () => {
            const text = select.value ? select.options[select.selectedIndex]?.text || 'Выберите...' : 'Выберите...';
            trigger.querySelector('.mpg-custom-select-text').textContent = text;
        });
        
        console.log(`✅ Селект ${id} успешно заменён на кастомный`);
    });
}
function openSelectModal(select, trigger, options) {
    if (activeSelectModal) {
        closeSelectModal();
    }
    
    const selectedValue = select.value || options[0]?.value || '';
    
    const overlay = document.createElement('div');
    overlay.className = 'select-modal-overlay';
    document.body.appendChild(overlay);
    
    const modal = document.createElement('div');
    modal.className = 'select-modal-window';
    modal.innerHTML = `
        <div class="select-modal-header">
            <span class="modal-title">Выберите значение</span>
            <button class="modal-close-btn">✕</button>
        </div>
        <div class="select-modal-search">
            <div class="search-wrap">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="Поиск..." autofocus>
            </div>
        </div>
        <div class="select-modal-list">
            ${renderModalOptions(options, selectedValue)}
        </div>
    `;
    document.body.appendChild(modal);
    
    activeSelectModal = {
        select: select,
        trigger: trigger,
        modal: modal,
        overlay: overlay,
        options: options
    };
    
    requestAnimationFrame(() => {
        overlay.classList.add('show');
        modal.classList.add('show');
        const search = modal.querySelector('input');
        if (search) {
            setTimeout(() => search.focus(), 150);
        }
    });
    
    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSelectModal);
    }
    
    overlay.addEventListener('click', closeSelectModal);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSelectModal();
        }
    });
    
    const searchInput = modal.querySelector('input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const list = modal.querySelector('.select-modal-list');
            if (!list) return;
            const searchValue = this.value.toLowerCase().trim();
            const filtered = options.filter(opt => 
                opt.text.toLowerCase().includes(searchValue) || 
                opt.value.toLowerCase().includes(searchValue)
            );
            list.innerHTML = renderModalOptions(filtered, selectedValue);
            list.querySelectorAll('.select-modal-option').forEach(el => {
                el.addEventListener('click', function() {
                    selectOption(this.dataset.value);
                });
            });
        });
    }
    
    modal.querySelectorAll('.select-modal-option').forEach(el => {
        el.addEventListener('click', function() {
            selectOption(this.dataset.value);
        });
    });
    
    function selectOption(value) {
        select.value = value;
        const newText = options.find(opt => opt.value === value)?.text || 'Выберите...';
        const textSpan = trigger.querySelector('.trigger-text');
        if (textSpan) textSpan.textContent = newText;
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
        closeSelectModal();
    }
}

function renderModalOptions(options, selectedValue) {
    if (!options || options.length === 0) {
        return `
            <div class="select-modal-empty">
                <span class="empty-icon">📭</span>
                <span class="empty-text">Нет доступных опций</span>
            </div>
        `;
    }
    
    return options.map(opt => `
        <div class="select-modal-option ${opt.value === selectedValue ? 'selected' : ''}" data-value="${opt.value}">
            <span class="option-check">${opt.value === selectedValue ? '✓' : ''}</span>
            ${opt.text}
        </div>
    `).join('');
}

function closeSelectModal() {
    if (!activeSelectModal) return;
    
    const { modal, overlay } = activeSelectModal;
    
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 300);
    }
    
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 300);
    }
    
    activeSelectModal = null;
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

window.initMpgEditor = initMpgEditor;
window.mpgSaveAll = mpgSaveAll;
window.mpgReload = mpgReload;
window.mpgSwitchTab = mpgSwitchTab;
window.mpgBackToTiles = mpgBackToTiles;

window.mpgAddPoint = mpgAddPoint;
window.mpgConfirmDeletePoint = mpgConfirmDeletePoint;
window.mpgSelectPoint = mpgSelectPoint;
window.mpgUpdatePointField = mpgUpdatePointField;
window.mpgAddEntity = mpgAddEntity;
window.mpgAddCustomEntity = mpgAddCustomEntity;
window.mpgRemoveFromSpawnList = mpgRemoveFromSpawnList;

window.mpgAddGroup = mpgAddGroup;
window.mpgConfirmDeleteGroup = mpgConfirmDeleteGroup;
window.mpgSelectGroup = mpgSelectGroup;
window.mpgUpdateGroupField = mpgUpdateGroupField;
window.mpgUpdateGroupWeather = mpgUpdateGroupWeather;
window.mpgAddGroupEntity = mpgAddGroupEntity;
window.mpgAddCustomGroupEntity = mpgAddCustomGroupEntity;
window.mpgRemoveFromGroupList = mpgRemoveFromGroupList;

window.mpgUpdateConfigField = mpgUpdateConfigField;
window.mpgAddConfigFile = mpgAddConfigFile;
window.mpgRemoveConfigFile = mpgRemoveConfigFile;
window.mpgAddAdmin = mpgAddAdmin;
window.mpgRemoveAdmin = mpgRemoveAdmin;

console.log('📝 mpg_editor.js загружен');