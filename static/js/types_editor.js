// ============================================
// TYPES.XML EDITOR - СПИСОК ПО ЦЕНТРУ + МОДАЛЬНОЕ ОКНО
// ============================================

// ============================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================

let typesState = {
    config: null,
    serverPath: '',
    mapName: '',
    typesPath: '',
    isLoading: false,
    isDirty: false,
    rawContent: '',
    originalContent: '',
    items: [],
    filteredItems: [],
    searchTerm: '',
    selectedItem: null,
    currentCategory: 'all'
};

// Категории для фильтрации
const TYPES_CATEGORIES = {
    all: 'Все',
    weapons: 'Оружие',
    magazines: 'Магазины',
    ammo: 'Патроны',
    attachments: 'Обвесы',
    clothes: 'Одежда',
    containers: 'Контейнеры',
    food: 'Еда',
    tools: 'Инструменты',
    explosives: 'Взрывчатка',
    lootdispatch: 'Запчасти',
    other: 'Разное'
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initTypesEditor() {
    console.log('📦 Инициализация редактора types.xml');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadServerPath()
        .then(() => {
            console.log('✅ Путь к серверу загружен:', typesState.serverPath);
            return loadMapName();
        })
        .then(() => {
            console.log('✅ Карта определена:', typesState.mapName);
            return buildTypesPath();
        })
        .then(() => {
            console.log('✅ Путь к types.xml:', typesState.typesPath);
            renderTypesEditor(container);
            return loadTypesConfig();
        })
        .catch((e) => {
            console.error('❌ Ошибка инициализации:', e);
            if (typeof notifications !== 'undefined') {
                notifications.error('Ошибка загрузки: ' + e.message);
            }
            renderTypesEditor(container);
            typesState.config = null;
            renderTypesItems();
        });
}

function loadServerPath() {
    return new Promise((resolve, reject) => {
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                if (settings.server_exe) {
                    const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
                    typesState.serverPath = serverDir;
                    console.log(`📁 Путь к серверу: ${typesState.serverPath}`);
                    resolve(typesState.serverPath);
                } else {
                    reject(new Error('Путь к серверу не указан в настройках'));
                }
            })
            .catch(e => {
                console.warn('⚠️ Не удалось загрузить путь к серверу:', e);
                reject(e);
            });
    });
}

async function loadMapName() {
    try {
        const stateResponse = await fetch('/api/server/config/state');
        const stateData = await stateResponse.json();
        
        if (stateData.success && stateData.state && stateData.state.serverDZ) {
            const template = stateData.state.serverDZ.template;
            if (template) {
                typesState.mapName = template;
                console.log(`📋 Загружена карта из состояния: ${typesState.mapName}`);
                return;
            }
        }
        
        const configPath = typesState.serverPath + '/serverDZ.cfg';
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath })
        });
        const data = await response.json();
        
        if (data.success && data.content) {
            const match = data.content.match(/template\s*=\s*"([^"]+)"/);
            if (match) {
                typesState.mapName = match[1];
                console.log(`📋 Загружена карта из serverDZ.cfg: ${typesState.mapName}`);
                return;
            }
        }
        
        typesState.mapName = 'dayzOffline.chernarusplus';
        console.log(`📋 Используем дефолтную карту: ${typesState.mapName}`);
        
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить карту:', e);
        typesState.mapName = 'dayzOffline.chernarusplus';
    }
}

function buildTypesPath() {
    if (!typesState.serverPath || !typesState.mapName) {
        return Promise.reject(new Error('Путь к серверу или карта не определены'));
    }
    
    typesState.typesPath = `${typesState.serverPath}/mpmissions/${typesState.mapName}/db/types.xml`;
    console.log(`📂 Путь к types.xml: ${typesState.typesPath}`);
    return Promise.resolve(typesState.typesPath);
}

// ============================================
// ЗАГРУЗКА КОНФИГА
// ============================================

async function loadTypesConfig() {
    if (!typesState.typesPath) {
        console.warn('⚠️ Путь к types.xml не загружен');
        return;
    }
    
    typesState.isLoading = true;
    updateTypesStatus('⏳ Загрузка types.xml...');
    
    try {
        console.log(`📂 Загрузка: ${typesState.typesPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: typesState.typesPath })
        });
        const data = await response.json();
        
        console.log('📄 Ответ сервера:', data.success ? 'success' : 'error');
        
        if (data.success && data.content) {
            typesState.rawContent = data.content;
            typesState.originalContent = data.content;
            
            const parsed = parseTypesXml(data.content);
            typesState.items = parsed.items || [];
            console.log(`✅ types.xml загружен (${typesState.items.length} предметов)`);
            
            updateTypesStatus(`✅ Загружено ${typesState.items.length} предметов`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success(`types.xml загружен (${typesState.items.length} предметов)`);
            }
            
            renderTypesItems();
            return;
        }
        
        console.warn('⚠️ types.xml не найден или пуст');
        typesState.items = [];
        updateTypesStatus('⚠️ Файл не найден');
        
        if (typeof notifications !== 'undefined') {
            notifications.warning('types.xml не найден');
        }
        
        renderTypesItems();
        
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        typesState.items = [];
        updateTypesStatus('❌ Ошибка загрузки');
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки types.xml');
        }
        renderTypesItems();
    }
    
    typesState.isLoading = false;
}

// ============================================
// ПАРСИНГ XML
// ============================================

function parseTypesXml(content) {
    console.log('🔍 Парсинг types.xml...');
    
    const items = [];
    
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('❌ Ошибка парсинга XML:', parserError.textContent);
            return { items: [] };
        }
        
        const typeNodes = xmlDoc.getElementsByTagName('type');
        console.log(`📋 Найдено ${typeNodes.length} элементов <type>`);
        
        for (let i = 0; i < typeNodes.length; i++) {
            const node = typeNodes[i];
            const name = node.getAttribute('name');
            if (!name) continue;
            
            const nominal = getNodeText(node, 'nominal');
            const lifetime = getNodeText(node, 'lifetime');
            const restock = getNodeText(node, 'restock');
            const min = getNodeText(node, 'min');
            const quantmin = getNodeText(node, 'quantmin');
            const quantmax = getNodeText(node, 'quantmax');
            const cost = getNodeText(node, 'cost');
            
            const flagsNode = node.getElementsByTagName('flags')[0];
            const flags = {};
            if (flagsNode) {
                for (let j = 0; j < flagsNode.attributes.length; j++) {
                    const attr = flagsNode.attributes[j];
                    flags[attr.name] = attr.value;
                }
            }
            
            const categories = getTagNames(node, 'category');
            const usages = getTagNames(node, 'usage');
            const values = getTagNames(node, 'value');
            const tags = getTagNames(node, 'tag');
            
            const category = detectCategoryFromNode(name, categories, usages);
            
            items.push({
                name: name,
                nominal: nominal || '0',
                lifetime: lifetime || '14400',
                restock: restock || '0',
                min: min || '0',
                quantmin: quantmin || '-1',
                quantmax: quantmax || '-1',
                cost: cost || '100',
                flags: flags,
                categories: categories,
                usages: usages,
                values: values,
                tags: tags,
                category: category
            });
        }
        
        console.log(`✅ Успешно спарсено ${items.length} предметов`);
        
    } catch (e) {
        console.error('❌ Ошибка парсинга XML:', e);
        return { items: [] };
    }
    
    return { items: items };
}

function getNodeText(parentNode, tagName) {
    const elements = parentNode.getElementsByTagName(tagName);
    if (elements.length > 0 && elements[0].textContent) {
        return elements[0].textContent.trim();
    }
    return null;
}

function getTagNames(parentNode, tagName) {
    const elements = parentNode.getElementsByTagName(tagName);
    const names = [];
    for (let i = 0; i < elements.length; i++) {
        const name = elements[i].getAttribute('name');
        if (name) {
            names.push(name);
        }
    }
    return names;
}

function detectCategoryFromNode(name, categories, usages) {
    const nameLower = name.toLowerCase();
    
    if (categories.includes('weapons')) return 'weapons';
    if (categories.includes('containers')) return 'containers';
    if (categories.includes('food')) return 'food';
    if (categories.includes('clothes')) return 'clothes';
    if (categories.includes('tools')) return 'tools';
    if (categories.includes('explosives')) return 'explosives';
    if (categories.includes('lootdispatch')) return 'lootdispatch';
    
    if (nameLower.startsWith('mag_') || nameLower.includes('_mag_')) return 'magazines';
    if (nameLower.startsWith('ammo_') || nameLower.includes('_ammo')) return 'ammo';
    if (nameLower.includes('optic') || nameLower.includes('scope') || nameLower.includes('sight')) return 'attachments';
    if (nameLower.includes('suppressor') || nameLower.includes('silencer')) return 'attachments';
    if (nameLower.includes('bag') || nameLower.includes('backpack') || nameLower.includes('pack')) return 'containers';
    if (nameLower.includes('vest') || nameLower.includes('jacket') || nameLower.includes('pants') || nameLower.includes('shirt')) return 'clothes';
    if (nameLower.includes('can') || nameLower.includes('meat') || nameLower.includes('food') || nameLower.includes('mushroom')) return 'food';
    if (nameLower.includes('knife') || nameLower.includes('axe') || nameLower.includes('hammer') || nameLower.includes('saw')) return 'tools';
    if (nameLower.includes('grenade') || nameLower.includes('explosive') || nameLower.includes('mine')) return 'explosives';
    if (nameLower.includes('wheel') || nameLower.includes('door') || nameLower.includes('hood') || nameLower.includes('trunk')) return 'lootdispatch';
    
    return 'other';
}

// ============================================
// СОХРАНЕНИЕ
// ============================================

async function saveTypesConfig() {
    if (!typesState.typesPath) {
        console.error('❌ Путь к types.xml не загружен');
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к types.xml не загружен');
        }
        return false;
    }
    
    updateTypesStatus('⏳ Сохранение...');
    
    try {
        const content = generateTypesXml(typesState.items);
        
        const response = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: typesState.typesPath, content: content })
        });
        const data = await response.json();
        
        if (data.success) {
            typesState.isDirty = false;
            typesState.originalContent = content;
            updateTypesStatus(`✅ Сохранено (${typesState.items.length} предметов)`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success('types.xml сохранён');
            }
            return true;
        } else {
            throw new Error(data.message || 'Ошибка сохранения');
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        updateTypesStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сохранения: ' + e.message);
        }
        return false;
    }
}

// ============================================
// ГЕНЕРАЦИЯ XML
// ============================================

function generateTypesXml(items) {
    let lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
    lines.push('<types>');
    
    for (const item of items) {
        lines.push(`    <type name="${item.name}">`);
        if (item.nominal) lines.push(`        <nominal>${item.nominal}</nominal>`);
        if (item.lifetime) lines.push(`        <lifetime>${item.lifetime}</lifetime>`);
        if (item.restock) lines.push(`        <restock>${item.restock}</restock>`);
        if (item.min) lines.push(`        <min>${item.min}</min>`);
        if (item.quantmin) lines.push(`        <quantmin>${item.quantmin}</quantmin>`);
        if (item.quantmax) lines.push(`        <quantmax>${item.quantmax}</quantmax>`);
        if (item.cost) lines.push(`        <cost>${item.cost}</cost>`);
        
        if (item.flags && Object.keys(item.flags).length > 0) {
            const flagStr = Object.entries(item.flags)
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ');
            lines.push(`        <flags ${flagStr}/>`);
        }
        
        for (const cat of (item.categories || [])) {
            lines.push(`        <category name="${cat}"/>`);
        }
        for (const usage of (item.usages || [])) {
            lines.push(`        <usage name="${usage}"/>`);
        }
        for (const value of (item.values || [])) {
            lines.push(`        <value name="${value}"/>`);
        }
        for (const tag of (item.tags || [])) {
            lines.push(`        <tag name="${tag}"/>`);
        }
        
        lines.push('    </type>');
    }
    
    lines.push('</types>');
    return lines.join('\n');
}

// ============================================
// ОБНОВЛЕНИЕ СТАТУСА
// ============================================

function updateTypesStatus(message) {
    const statusEl = document.getElementById('typesStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'types-status';
        
        if (message.includes('⚠️')) statusEl.classList.add('warning');
        else if (message.includes('❌')) statusEl.classList.add('error');
        else if (message.includes('✅')) statusEl.classList.add('success');
        else if (message.includes('⏳')) statusEl.classList.add('loading');
    }
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА - СПИСОК ПО ЦЕНТРУ
// ============================================

function renderTypesEditor(container) {
    container.innerHTML = `
        <div class="types-editor">
            <button class="types-back-btn" onclick="typesBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <div class="types-header">
                <div class="types-header-info">
                    <span class="types-header-icon">📦</span>
                    <div>
                        <h2 class="types-header-title">Редактор types.xml</h2>
                        <p class="types-header-subtitle">Настройки лута для карты <strong>${typesState.mapName || 'не определена'}</strong></p>
                    </div>
                </div>
                <div class="types-header-actions">
                    <button class="btn btn-primary" onclick="saveTypesConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Сохранить
                    </button>
                    <button class="btn btn-secondary" onclick="loadTypesConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                        </svg>
                        Перезагрузить
                    </button>
                    <button class="btn btn-secondary" onclick="typesOpenRaw()" title="Редактировать как текст">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12,2 2,7 12,12 22,7 12,2"/>
                            <polyline points="2,17 12,22 22,17"/>
                            <polyline points="2,12 12,17 22,12"/>
                        </svg>
                        RAW
                    </button>
                </div>
            </div>

            <div class="types-status-bar">
                <span class="types-status" id="typesStatus">✅ Готово</span>
                <span class="types-path">${typesState.typesPath || 'Путь не указан'}</span>
            </div>

            <!-- СПИСОК ПО ЦЕНТРУ -->
            <div class="types-list-wrapper">
                <div class="types-list-container">
                    <div class="types-list-header">
                        <h3>Предметы (${typesState.items?.length || 0})</h3>
                        <button class="btn btn-primary btn-sm" onclick="typesAddItem()" title="Добавить предмет">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="types-search">
                        <input type="text" id="typesSearch" placeholder="🔍 Поиск предмета..." 
                               oninput="typesFilterItems()" class="types-search-input">
                        <select id="typesCategoryFilter" onchange="typesFilterItems()" class="types-filter-select">
                            ${Object.entries(TYPES_CATEGORIES).map(([key, label]) => 
                                `<option value="${key}" ${key === typesState.currentCategory ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="types-items-list" id="typesItemsList">
                        <div class="types-loading">
                            <span class="spinner"></span>
                            Загрузка...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (typesState.items && typesState.items.length > 0) {
        renderTypesItems();
    }
    
    setTimeout(createTypesScrollTopButton, 300);
}

// ============================================
// ОТРИСОВКА СПИСКА ПРЕДМЕТОВ
// ============================================

function renderTypesItems() {
    const container = document.getElementById('typesItemsList');
    if (!container) return;
    
    const items = typesState.items || [];
    const searchTerm = typesState.searchTerm.toLowerCase().trim();
    const category = typesState.currentCategory;
    
    let filtered = items;
    
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (category !== 'all') {
        filtered = filtered.filter(item => item.category === category);
    }
    
    typesState.filteredItems = filtered;
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="types-empty-list">
                <span class="types-empty-icon">📭</span>
                <p>${items.length === 0 ? 'Нет предметов' : 'Ничего не найдено'}</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach((item, index) => {
        const categoryLabel = TYPES_CATEGORIES[item.category] || 'Разное';
        const nominal = item.nominal || '0';
        
        html += `
            <div class="types-item" onclick="typesOpenItemModal(${index})">
                <div class="types-item-info">
                    <span class="types-item-name">${item.name}</span>
                </div>
                <div class="types-item-details">
                    <span class="types-item-category ${item.category}">${categoryLabel}</span>
                    <span class="types-item-nominal">${nominal}</span>
                </div>
                <div class="types-item-actions">
                    <button class="types-item-delete" onclick="event.stopPropagation(); typesConfirmDeleteItem(${index})" title="Удалить предмет">
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
// ФИЛЬТРАЦИЯ
// ============================================

function typesFilterItems() {
    const search = document.getElementById('typesSearch');
    const filter = document.getElementById('typesCategoryFilter');
    
    if (search) typesState.searchTerm = search.value;
    if (filter) typesState.currentCategory = filter.value;
    
    renderTypesItems();
}

// ============================================
// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА С НАСТРОЙКАМИ
// ============================================

function typesOpenItemModal(index) {
    const item = typesState.items?.[index];
    if (!item) return;
    
    typesState.selectedItem = index;
    
    // Удаляем старый модал
    const oldModal = document.getElementById('typesItemModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    const categoryOptions = Object.entries(TYPES_CATEGORIES)
        .filter(([key]) => key !== 'all')
        .map(([key, label]) => 
            `<option value="${key}" ${item.category === key ? 'selected' : ''}>${label}</option>`
        ).join('');
    
    const flags = item.flags || {};
    
    const modal = document.createElement('div');
    modal.id = 'typesItemModal';
    modal.className = 'modal-overlay types-item-modal';
    modal.innerHTML = `
        <div class="modal-content types-modal-content">
            <div class="modal-header types-modal-header">
                <h3>
                    <span class="types-modal-icon">📦</span>
                    Редактирование: ${item.name}
                </h3>
                <button class="modal-close" onclick="typesCloseItemModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body types-modal-body">
                <div class="types-editor-form">
                    <div class="types-form-section">
                        <h4>Основные настройки</h4>
                        <div class="types-form-group">
                            <label>Название (classname)</label>
                            <input type="text" class="types-input" value="${item.name || ''}" 
                                   onchange="typesUpdateItemField(${index}, 'name', this.value)">
                        </div>
                        <div class="types-form-row">
                            <div class="types-form-group">
                                <label>Категория</label>
                                <select class="types-select" onchange="typesUpdateItemField(${index}, 'category', this.value)">
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div class="types-form-group">
                                <label>Cost</label>
                                <input type="number" class="types-input" value="${item.cost || 100}" 
                                       onchange="typesUpdateItemField(${index}, 'cost', parseInt(this.value) || 100)">
                            </div>
                        </div>
                    </div>

                    <div class="types-form-section">
                        <h4>Количество и время</h4>
                        <div class="types-form-row">
                            <div class="types-form-group">
                                <label>Nominal (базовое количество)</label>
                                <input type="number" class="types-input" value="${item.nominal || 0}" 
                                       onchange="typesUpdateItemField(${index}, 'nominal', parseInt(this.value) || 0)">
                            </div>
                            <div class="types-form-group">
                                <label>Min (минимум)</label>
                                <input type="number" class="types-input" value="${item.min || 0}" 
                                       onchange="typesUpdateItemField(${index}, 'min', parseInt(this.value) || 0)">
                            </div>
                        </div>
                        <div class="types-form-row">
                            <div class="types-form-group">
                                <label>Lifetime (время жизни в секундах)</label>
                                <input type="number" class="types-input" value="${item.lifetime || 14400}" 
                                       onchange="typesUpdateItemField(${index}, 'lifetime', parseInt(this.value) || 14400)">
                            </div>
                            <div class="types-form-group">
                                <label>Restock (перезаполнение в секундах)</label>
                                <input type="number" class="types-input" value="${item.restock || 0}" 
                                       onchange="typesUpdateItemField(${index}, 'restock', parseInt(this.value) || 0)">
                            </div>
                        </div>
                    </div>

                    <div class="types-form-section">
                        <h4>Количество в контейнерах</h4>
                        <div class="types-form-row">
                            <div class="types-form-group">
                                <label>Quantmin (минимум)</label>
                                <input type="number" class="types-input" value="${item.quantmin || -1}" 
                                       onchange="typesUpdateItemField(${index}, 'quantmin', parseInt(this.value) || -1)">
                            </div>
                            <div class="types-form-group">
                                <label>Quantmax (максимум)</label>
                                <input type="number" class="types-input" value="${item.quantmax || -1}" 
                                       onchange="typesUpdateItemField(${index}, 'quantmax', parseInt(this.value) || -1)">
                            </div>
                        </div>
                    </div>

                    <div class="types-form-section">
                        <h4>Флаги (count_in_*)</h4>
                        <div class="types-form-row">
                            <div class="types-form-group">
                                <label>В грузе</label>
                                <select class="types-select" onchange="typesUpdateFlag(${index}, 'count_in_cargo', this.value)">
                                    <option value="0" ${flags.count_in_cargo === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${flags.count_in_cargo === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                            <div class="types-form-group">
                                <label>В хранилище</label>
                                <select class="types-select" onchange="typesUpdateFlag(${index}, 'count_in_hoarder', this.value)">
                                    <option value="0" ${flags.count_in_hoarder === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${flags.count_in_hoarder === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                        </div>
                        <div class="types-form-row">
                            <div class="types-form-group">
                                <label>На карте</label>
                                <select class="types-select" onchange="typesUpdateFlag(${index}, 'count_in_map', this.value)">
                                    <option value="0" ${flags.count_in_map === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${flags.count_in_map === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                            <div class="types-form-group">
                                <label>У игрока</label>
                                <select class="types-select" onchange="typesUpdateFlag(${index}, 'count_in_player', this.value)">
                                    <option value="0" ${flags.count_in_player === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${flags.count_in_player === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                        </div>
                        <div class="types-form-row">
                            <div class="types-form-group">
                                <label>Crafted (крафт)</label>
                                <select class="types-select" onchange="typesUpdateFlag(${index}, 'crafted', this.value)">
                                    <option value="0" ${flags.crafted === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${flags.crafted === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                            <div class="types-form-group">
                                <label>Deloot (удалять при луте)</label>
                                <select class="types-select" onchange="typesUpdateFlag(${index}, 'deloot', this.value)">
                                    <option value="0" ${flags.deloot === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${flags.deloot === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="types-form-section">
                        <h4>Usage, Value, Tag (через запятую)</h4>
                        <div class="types-form-group">
                            <label>Usage</label>
                            <input type="text" class="types-input" value="${(item.usages || []).join(', ')}" 
                                   placeholder="Military, Police, Town"
                                   onchange="typesUpdateTags(${index}, 'usages', this.value)">
                        </div>
                        <div class="types-form-group" style="margin-top:6px;">
                            <label>Value</label>
                            <input type="text" class="types-input" value="${(item.values || []).join(', ')}" 
                                   placeholder="Tier1, Tier2, Tier3"
                                   onchange="typesUpdateTags(${index}, 'values', this.value)">
                        </div>
                        <div class="types-form-group" style="margin-top:6px;">
                            <label>Tag</label>
                            <input type="text" class="types-input" value="${(item.tags || []).join(', ')}" 
                                   placeholder="shelves, floor"
                                   onchange="typesUpdateTags(${index}, 'tags', this.value)">
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer types-modal-footer">
                <button class="btn btn-secondary" onclick="typesCloseItemModal()">Закрыть</button>
                <button class="btn btn-primary" onclick="typesCloseItemModal(); saveTypesConfig();">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Сохранить
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    // Закрытие по клику на фон
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            typesCloseItemModal();
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            typesCloseItemModal();
        }
    });
}

function typesCloseItemModal() {
    const modal = document.getElementById('typesItemModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// ОБНОВЛЕНИЕ ПОЛЯ ПРЕДМЕТА
// ============================================

function typesUpdateItemField(index, field, value) {
    if (!typesState.items?.[index]) return;
    typesState.items[index][field] = value;
    typesState.isDirty = true;
    updateTypesStatus('⚠️ Есть несохранённые изменения');
    renderTypesItems();
}

function typesUpdateFlag(index, flag, value) {
    if (!typesState.items?.[index]) return;
    if (!typesState.items[index].flags) {
        typesState.items[index].flags = {};
    }
    typesState.items[index].flags[flag] = value;
    typesState.isDirty = true;
    updateTypesStatus('⚠️ Есть несохранённые изменения');
}

function typesUpdateTags(index, field, value) {
    if (!typesState.items?.[index]) return;
    const tags = value.split(',').map(s => s.trim()).filter(s => s);
    typesState.items[index][field] = tags;
    typesState.isDirty = true;
    updateTypesStatus('⚠️ Есть несохранённые изменения');
}

// ============================================
// ДОБАВЛЕНИЕ/УДАЛЕНИЕ ПРЕДМЕТА
// ============================================

function typesAddItem() {
    if (!typesState.items) typesState.items = [];
    
    const newItem = {
        name: `NewItem_${typesState.items.length + 1}`,
        nominal: '10',
        lifetime: '14400',
        restock: '0',
        min: '5',
        quantmin: '-1',
        quantmax: '-1',
        cost: '100',
        flags: {
            count_in_cargo: '0',
            count_in_hoarder: '0',
            count_in_map: '1',
            count_in_player: '0',
            crafted: '0',
            deloot: '0'
        },
        categories: ['other'],
        usages: [],
        values: [],
        tags: [],
        category: 'other'
    };
    
    typesState.items.push(newItem);
    typesState.isDirty = true;
    updateTypesStatus('⚠️ Есть несохранённые изменения');
    
    renderTypesItems();
    typesOpenItemModal(typesState.items.length - 1);
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Добавлен предмет: ${newItem.name}`);
    }
}

function typesConfirmDeleteItem(index) {
    const item = typesState.items?.[index];
    if (!item) return;
    
    typesCloseItemModal();
    
    if (typeof mpgShowConfirmModal !== 'undefined') {
        mpgShowConfirmModal(
            'Удаление предмета',
            `Вы уверены, что хотите удалить "<strong>${item.name}</strong>"?<br>Это действие нельзя отменить.`,
            function() {
                typesExecuteDeleteItem(index);
            },
            function() {}
        );
    } else {
        if (confirm(`Удалить предмет "${item.name}"?`)) {
            typesExecuteDeleteItem(index);
        }
    }
}

function typesExecuteDeleteItem(index) {
    const item = typesState.items?.[index];
    if (!item) return;
    
    const name = item.name;
    
    typesState.items.splice(index, 1);
    if (typesState.selectedItem === index) {
        typesState.selectedItem = null;
    } else if (typesState.selectedItem > index) {
        typesState.selectedItem--;
    }
    typesState.isDirty = true;
    
    renderTypesItems();
    updateTypesStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалён предмет: ${name}`);
    }
}

// ============================================
// RAW РЕДАКТОР
// ============================================

function typesOpenRaw() {
    const content = generateTypesXml(typesState.items);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay types-raw-modal';
    modal.id = 'typesRawModal';
    modal.innerHTML = `
        <div class="modal-content modal-confirm" style="max-width:800px;width:90%;">
            <div class="modal-confirm-header">
                <div class="modal-confirm-icon">📝</div>
                <h3>RAW редактор types.xml</h3>
            </div>
            <div class="modal-body" style="padding:16px 20px;">
                <textarea id="typesRawTextarea" style="width:100%;min-height:400px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e5;font-family:'Courier New',monospace;font-size:0.8rem;padding:12px;resize:vertical;outline:none;box-sizing:border-box;">${content}</textarea>
            </div>
            <div class="modal-footer" style="padding:12px 20px;border-top:1px solid rgba(255,255,255,0.04);display:flex;justify-content:flex-end;gap:10px;">
                <button class="btn btn-secondary" onclick="typesCloseRaw()">Отмена</button>
                <button class="btn btn-primary" onclick="typesApplyRaw()">Применить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function typesCloseRaw() {
    const modal = document.getElementById('typesRawModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function typesApplyRaw() {
    const textarea = document.getElementById('typesRawTextarea');
    if (!textarea) return;
    
    try {
        const content = textarea.value;
        const parsed = parseTypesXml(content);
        typesState.items = parsed.items || [];
        typesState.isDirty = true;
        updateTypesStatus('⚠️ Есть несохранённые изменения');
        renderTypesItems();
        typesCloseRaw();
        
        if (typeof notifications !== 'undefined') {
            notifications.success('RAW изменения применены');
        }
    } catch (e) {
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка применения: ' + e.message);
        }
    }
}

// ============================================
// ВОЗВРАТ К ПЛИТКАМ
// ============================================

function typesBackToTiles() {
    destroyTypesScrollTopButton();
    typesCloseItemModal();
    
    if (typesState.isDirty) {
        if (typeof mpgShowConfirmModal !== 'undefined') {
            mpgShowConfirmModal(
                'Несохранённые изменения',
                'Есть несохранённые изменения. Вы уверены, что хотите выйти без сохранения?',
                function() {
                    if (typeof window.backToServerTiles === 'function') {
                        window.backToServerTiles();
                    }
                },
                function() {}
            );
        } else {
            if (confirm('Есть несохранённые изменения. Выйти без сохранения?')) {
                if (typeof window.backToServerTiles === 'function') {
                    window.backToServerTiles();
                }
            }
        }
        return;
    }
    
    if (typeof window.backToServerTiles === 'function') {
        window.backToServerTiles();
    }
}

// ============================================
// ПЛАВАЮЩАЯ КНОПКА "НАВЕРХ"
// ============================================

let typesScrollTopBtn = null;
let typesScrollTimer = null;

function createTypesScrollTopButton() {
    const oldBtn = document.getElementById('typesScrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        typesScrollTopBtn = null;
    }
    
    if (typesScrollTimer) {
        clearInterval(typesScrollTimer);
        typesScrollTimer = null;
    }
    
    typesScrollTopBtn = document.createElement('button');
    typesScrollTopBtn.id = 'typesScrollTopBtn';
    typesScrollTopBtn.className = 'scroll-top-btn';
    typesScrollTopBtn.innerHTML = '↑';
    typesScrollTopBtn.title = 'Наверх';
    
    let isScrolling = false;
    
    typesScrollTopBtn.addEventListener('click', function(e) {
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
    
    document.body.appendChild(typesScrollTopBtn);
    console.log('✅ Кнопка "Наверх" для types.xml создана');
    
    typesScrollTimer = setInterval(function() {
        checkTypesScroll();
    }, 300);
    
    setTimeout(checkTypesScroll, 200);
}

function checkTypesScroll() {
    if (!typesScrollTopBtn) return;
    
    const contentArea = document.getElementById('contentArea');
    let hasScroll = false;
    
    if (contentArea) {
        const scrollContainer = contentArea.querySelector('div:first-child');
        if (scrollContainer && scrollContainer.scrollTop > 50) {
            hasScroll = true;
        }
    }
    
    if (hasScroll) {
        typesScrollTopBtn.classList.add('visible');
    } else {
        typesScrollTopBtn.classList.remove('visible');
    }
}

function destroyTypesScrollTopButton() {
    if (typesScrollTimer) {
        clearInterval(typesScrollTimer);
        typesScrollTimer = null;
    }
    
    const btn = document.getElementById('typesScrollTopBtn');
    if (btn) {
        btn.remove();
        typesScrollTopBtn = null;
    }
}

// ============================================
// ЭКСПОРТ
// ============================================

window.initTypesEditor = initTypesEditor;
window.saveTypesConfig = saveTypesConfig;
window.loadTypesConfig = loadTypesConfig;
window.typesBackToTiles = typesBackToTiles;
window.typesFilterItems = typesFilterItems;
window.typesAddItem = typesAddItem;
window.typesConfirmDeleteItem = typesConfirmDeleteItem;
window.typesUpdateItemField = typesUpdateItemField;
window.typesUpdateFlag = typesUpdateFlag;
window.typesUpdateTags = typesUpdateTags;
window.typesOpenRaw = typesOpenRaw;
window.typesCloseRaw = typesCloseRaw;
window.typesApplyRaw = typesApplyRaw;
window.typesOpenItemModal = typesOpenItemModal;
window.typesCloseItemModal = typesCloseItemModal;

console.log('📦 types_editor.js загружен');