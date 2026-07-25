// ============================================
// EVENTS.XML EDITOR - СОБЫТИЯ, ЖИВОТНЫЕ, ЗОМБИ
// ============================================

// ============================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================

let eventsState = {
    serverPath: '',
    mapName: '',
    eventsPath: '',
    isLoading: false,
    isDirty: false,
    rawContent: '',
    originalContent: '',
    events: [],
    filteredEvents: [],
    searchTerm: '',
    currentCategory: 'all',
    selectedEvent: null
};

// ============================================
// КАТЕГОРИИ СОБЫТИЙ
// ============================================

const EVENTS_CATEGORIES = {
    all: 'Все',
    animals: '🐾 Животные',
    infected: '🧟 Зомби',
    static: '📍 Статические',
    trajectory: '🌿 Траекторные',
    vehicles: '🚗 Транспорт',
    loot: '📦 Лут',
    other: '📌 Прочее'
};

// ============================================
// ОПРЕДЕЛЕНИЕ КАТЕГОРИИ ПО ИМЕНИ СОБЫТИЯ
// ============================================

function detectEventCategory(name) {
    if (name.startsWith('Animal') || name.startsWith('Ambient')) return 'animals';
    if (name.startsWith('Infected') || name.startsWith('Zombie')) return 'infected';
    if (name.startsWith('Static')) return 'static';
    if (name.startsWith('Trajectory')) return 'trajectory';
    if (name.startsWith('Vehicle')) return 'vehicles';
    if (name.startsWith('Loot') || name.startsWith('Item')) return 'loot';
    return 'other';
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initEventsEditor() {
    console.log('📋 Инициализация редактора events.xml');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadServerPath()
        .then(() => {
            console.log('✅ Путь к серверу загружен:', eventsState.serverPath);
            return loadMapName();
        })
        .then(() => {
            console.log('✅ Карта определена:', eventsState.mapName);
            return buildEventsPath();
        })
        .then(() => {
            console.log('✅ Путь к events.xml:', eventsState.eventsPath);
            renderEventsEditor(container);
            return loadEventsConfig();
        })
        .catch((e) => {
            console.error('❌ Ошибка инициализации:', e);
            if (typeof notifications !== 'undefined') {
                notifications.error('Ошибка загрузки: ' + e.message);
            }
            renderEventsEditor(container);
            eventsState.events = [];
            renderEventsList();
        });
}

function loadServerPath() {
    return new Promise((resolve, reject) => {
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                if (settings.server_exe) {
                    const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
                    eventsState.serverPath = serverDir;
                    console.log(`📁 Путь к серверу: ${eventsState.serverPath}`);
                    resolve(eventsState.serverPath);
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
                eventsState.mapName = template;
                console.log(`📋 Загружена карта из состояния: ${eventsState.mapName}`);
                return;
            }
        }
        
        const configPath = eventsState.serverPath + '/serverDZ.cfg';
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath })
        });
        const data = await response.json();
        
        if (data.success && data.content) {
            const match = data.content.match(/template\s*=\s*"([^"]+)"/);
            if (match) {
                eventsState.mapName = match[1];
                console.log(`📋 Загружена карта из serverDZ.cfg: ${eventsState.mapName}`);
                return;
            }
        }
        
        eventsState.mapName = 'dayzOffline.chernarusplus';
        console.log(`📋 Используем дефолтную карту: ${eventsState.mapName}`);
        
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить карту:', e);
        eventsState.mapName = 'dayzOffline.chernarusplus';
    }
}

function buildEventsPath() {
    if (!eventsState.serverPath || !eventsState.mapName) {
        return Promise.reject(new Error('Путь к серверу или карта не определены'));
    }
    
    eventsState.eventsPath = `${eventsState.serverPath}/mpmissions/${eventsState.mapName}/db/events.xml`;
    console.log(`📂 Путь к events.xml: ${eventsState.eventsPath}`);
    return Promise.resolve(eventsState.eventsPath);
}

// ============================================
// ЗАГРУЗКА КОНФИГА
// ============================================

async function loadEventsConfig() {
    if (!eventsState.eventsPath) {
        console.warn('⚠️ Путь к events.xml не загружен');
        return;
    }
    
    eventsState.isLoading = true;
    updateEventsStatus('⏳ Загрузка events.xml...');
    
    try {
        console.log(`📂 Загрузка: ${eventsState.eventsPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: eventsState.eventsPath })
        });
        const data = await response.json();
        
        console.log('📄 Ответ сервера:', data.success ? 'success' : 'error');
        
        if (data.success && data.content) {
            eventsState.rawContent = data.content;
            eventsState.originalContent = data.content;
            
            const parsed = parseEventsXml(data.content);
            eventsState.events = parsed.events || [];
            console.log(`✅ events.xml загружен (${eventsState.events.length} событий)`);
            
            updateEventsStatus(`✅ Загружено ${eventsState.events.length} событий`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success(`events.xml загружен (${eventsState.events.length} событий)`);
            }
            
            renderEventsList();
            return;
        }
        
        console.warn('⚠️ events.xml не найден или пуст');
        eventsState.events = [];
        updateEventsStatus('⚠️ Файл не найден');
        
        if (typeof notifications !== 'undefined') {
            notifications.warning('events.xml не найден');
        }
        
        renderEventsList();
        
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        eventsState.events = [];
        updateEventsStatus('❌ Ошибка загрузки');
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки events.xml');
        }
        renderEventsList();
    }
    
    eventsState.isLoading = false;
}

// ============================================
// ПАРСИНГ XML
// ============================================

function parseEventsXml(content) {
    console.log('🔍 Парсинг events.xml...');
    
    const events = [];
    
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('❌ Ошибка парсинга XML:', parserError.textContent);
            return { events: [] };
        }
        
        const eventNodes = xmlDoc.getElementsByTagName('event');
        console.log(`📋 Найдено ${eventNodes.length} элементов <event>`);
        
        for (let i = 0; i < eventNodes.length; i++) {
            const node = eventNodes[i];
            const name = node.getAttribute('name');
            if (!name) continue;
            
            const nominal = getNodeText(node, 'nominal');
            const min = getNodeText(node, 'min');
            const max = getNodeText(node, 'max');
            const lifetime = getNodeText(node, 'lifetime');
            const restock = getNodeText(node, 'restock');
            const saferadius = getNodeText(node, 'saferadius');
            const distanceradius = getNodeText(node, 'distanceradius');
            const cleanupradius = getNodeText(node, 'cleanupradius');
            const position = getNodeText(node, 'position');
            const limit = getNodeText(node, 'limit');
            const active = getNodeText(node, 'active');
            const secondary = getNodeText(node, 'secondary');
            
            // Парсим флаги
            const flagsNode = node.getElementsByTagName('flags')[0];
            const flags = {};
            if (flagsNode) {
                for (let j = 0; j < flagsNode.attributes.length; j++) {
                    const attr = flagsNode.attributes[j];
                    flags[attr.name] = attr.value;
                }
            }
            
            // Парсим детей
            const children = [];
            const childNodes = node.getElementsByTagName('child');
            for (let j = 0; j < childNodes.length; j++) {
                const child = childNodes[j];
                children.push({
                    type: child.getAttribute('type') || '',
                    min: child.getAttribute('min') || '0',
                    max: child.getAttribute('max') || '0',
                    lootmin: child.getAttribute('lootmin') || '0',
                    lootmax: child.getAttribute('lootmax') || '0'
                });
            }
            
            const category = detectEventCategory(name);
            
            events.push({
                name: name,
                nominal: nominal || '0',
                min: min || '0',
                max: max || '0',
                lifetime: lifetime || '0',
                restock: restock || '0',
                saferadius: saferadius || '0',
                distanceradius: distanceradius || '0',
                cleanupradius: cleanupradius || '0',
                position: position || 'fixed',
                limit: limit || 'mixed',
                active: active || '1',
                secondary: secondary || '',
                flags: flags,
                children: children,
                category: category,
                childCount: children.length
            });
        }
        
        console.log(`✅ Успешно спарсено ${events.length} событий`);
        
    } catch (e) {
        console.error('❌ Ошибка парсинга XML:', e);
        return { events: [] };
    }
    
    return { events: events };
}

function getNodeText(parentNode, tagName) {
    const elements = parentNode.getElementsByTagName(tagName);
    if (elements.length > 0 && elements[0].textContent) {
        return elements[0].textContent.trim();
    }
    return null;
}

// ============================================
// СОХРАНЕНИЕ
// ============================================

async function saveEventsConfig() {
    if (!eventsState.eventsPath) {
        console.error('❌ Путь к events.xml не загружен');
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к events.xml не загружен');
        }
        return false;
    }
    
    updateEventsStatus('⏳ Сохранение...');
    
    try {
        const content = generateEventsXml(eventsState.events);
        
        const response = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: eventsState.eventsPath, content: content })
        });
        const data = await response.json();
        
        if (data.success) {
            eventsState.isDirty = false;
            eventsState.originalContent = content;
            updateEventsStatus(`✅ Сохранено (${eventsState.events.length} событий)`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success('events.xml сохранён');
            }
            return true;
        } else {
            throw new Error(data.message || 'Ошибка сохранения');
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        updateEventsStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сохранения: ' + e.message);
        }
        return false;
    }
}

// ============================================
// ГЕНЕРАЦИЯ XML
// ============================================

function generateEventsXml(events) {
    let lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
    lines.push('<events>');
    
    for (const e of events) {
        lines.push(`    <event name="${e.name}">`);
        if (e.nominal) lines.push(`        <nominal>${e.nominal}</nominal>`);
        if (e.min) lines.push(`        <min>${e.min}</min>`);
        if (e.max) lines.push(`        <max>${e.max}</max>`);
        if (e.lifetime) lines.push(`        <lifetime>${e.lifetime}</lifetime>`);
        if (e.restock) lines.push(`        <restock>${e.restock}</restock>`);
        if (e.saferadius) lines.push(`        <saferadius>${e.saferadius}</saferadius>`);
        if (e.distanceradius) lines.push(`        <distanceradius>${e.distanceradius}</distanceradius>`);
        if (e.cleanupradius) lines.push(`        <cleanupradius>${e.cleanupradius}</cleanupradius>`);
        if (e.secondary) lines.push(`        <secondary>${e.secondary}</secondary>`);
        
        if (e.flags && Object.keys(e.flags).length > 0) {
            const flagStr = Object.entries(e.flags)
                .map(([k, v]) => `${k}="${v}"`)
                .join(' ');
            lines.push(`        <flags ${flagStr}/>`);
        }
        
        if (e.position) lines.push(`        <position>${e.position}</position>`);
        if (e.limit) lines.push(`        <limit>${e.limit}</limit>`);
        if (e.active) lines.push(`        <active>${e.active}</active>`);
        
        if (e.children && e.children.length > 0) {
            lines.push(`        <children>`);
            for (const child of e.children) {
                lines.push(`            <child lootmax="${child.lootmax || '0'}" lootmin="${child.lootmin || '0'}" max="${child.max || '0'}" min="${child.min || '0'}" type="${child.type}"/>`);
            }
            lines.push(`        </children>`);
        } else {
            lines.push(`        <children/>`);
        }
        
        lines.push('    </event>');
    }
    
    lines.push('</events>');
    return lines.join('\n');
}

// ============================================
// ОБНОВЛЕНИЕ СТАТУСА
// ============================================

function updateEventsStatus(message) {
    const statusEl = document.getElementById('eventsStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'events-status';
        
        if (message.includes('⚠️')) statusEl.classList.add('warning');
        else if (message.includes('❌')) statusEl.classList.add('error');
        else if (message.includes('✅')) statusEl.classList.add('success');
        else if (message.includes('⏳')) statusEl.classList.add('loading');
    }
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА
// ============================================

function renderEventsEditor(container) {
    container.innerHTML = `
        <div class="events-editor">
            <button class="events-back-btn" onclick="eventsBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <div class="events-header">
                <div class="events-header-info">
                    <span class="events-header-icon">📋</span>
                    <div>
                        <h2 class="events-header-title">Редактор events.xml</h2>
                        <p class="events-header-subtitle">События, животные, зомби и транспорт для карты <strong>${eventsState.mapName || 'не определена'}</strong></p>
                    </div>
                </div>
                <div class="events-header-actions">
                    <button class="btn btn-primary" onclick="saveEventsConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Сохранить
                    </button>
                    <button class="btn btn-secondary" onclick="loadEventsConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                        </svg>
                        Перезагрузить
                    </button>
                    <button class="btn btn-secondary" onclick="eventsOpenRaw()" title="Редактировать как текст">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12,2 2,7 12,12 22,7 12,2"/>
                            <polyline points="2,17 12,22 22,17"/>
                            <polyline points="2,12 12,17 22,12"/>
                        </svg>
                        RAW
                    </button>
                </div>
            </div>

            <div class="events-status-bar">
                <span class="events-status" id="eventsStatus">✅ Готово</span>
                <span class="events-path">${eventsState.eventsPath || 'Путь не указан'}</span>
            </div>

            <!-- СПИСОК СОБЫТИЙ -->
            <div class="events-list-wrapper">
                <div class="events-list-container">
                    <div class="events-list-header">
                        <h3>События (${eventsState.events?.length || 0})</h3>
                        <button class="btn btn-primary btn-sm" onclick="eventsAddEvent()" title="Добавить событие">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="events-search">
                        <input type="text" id="eventsSearch" placeholder="🔍 Поиск события..." 
                               oninput="eventsFilterEvents()" class="events-search-input">
                        <select id="eventsCategoryFilter" onchange="eventsFilterEvents()" class="events-filter-select">
                            ${Object.entries(EVENTS_CATEGORIES).map(([key, label]) => 
                                `<option value="${key}" ${key === eventsState.currentCategory ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="events-list" id="eventsList">
                        <div class="events-loading">
                            <span class="spinner"></span>
                            Загрузка...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (eventsState.events && eventsState.events.length > 0) {
        renderEventsList();
    }
    
    setTimeout(createEventsScrollTopButton, 300);
}

// ============================================
// ОТРИСОВКА СПИСКА СОБЫТИЙ
// ============================================

function renderEventsList() {
    const container = document.getElementById('eventsList');
    if (!container) return;
    
    const events = eventsState.events || [];
    const searchTerm = eventsState.searchTerm.toLowerCase().trim();
    const category = eventsState.currentCategory;
    
    let filtered = events;
    
    if (searchTerm) {
        filtered = filtered.filter(e => 
            e.name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (category !== 'all') {
        filtered = filtered.filter(e => e.category === category);
    }
    
    eventsState.filteredEvents = filtered;
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="events-empty-list">
                <span class="events-empty-icon">📭</span>
                <p>${events.length === 0 ? 'Нет событий' : 'Ничего не найдено'}</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach((e, index) => {
        const categoryLabel = EVENTS_CATEGORIES[e.category] || 'Прочее';
        const activeText = e.active === '1' ? '🟢 Активно' : '🔴 Неактивно';
        const childInfo = e.children && e.children.length > 0 ? `${e.children.length} детей` : 'Нет детей';
        
        html += `
            <div class="events-item" onclick="eventsOpenEventModal(${index})">
                <div class="events-item-info">
                    <span class="events-item-name">${e.name}</span>
                    <span class="events-item-short-desc">${activeText} • ${childInfo}</span>
                </div>
                <div class="events-item-details">
                    <span class="events-item-category ${e.category}">${categoryLabel}</span>
                    <span class="events-item-value">${e.nominal || '0'}</span>
                </div>
                <div class="events-item-actions">
                    <button class="events-item-delete" onclick="event.stopPropagation(); eventsConfirmDeleteEvent(${index})" title="Удалить событие">
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

function eventsFilterEvents() {
    const search = document.getElementById('eventsSearch');
    const filter = document.getElementById('eventsCategoryFilter');
    
    if (search) eventsState.searchTerm = search.value;
    if (filter) eventsState.currentCategory = filter.value;
    
    renderEventsList();
}

// ============================================
// МОДАЛЬНОЕ ОКНО РЕДАКТОРА
// ============================================

function eventsOpenEventModal(index) {
    const e = eventsState.events?.[index];
    if (!e) return;
    
    eventsState.selectedEvent = index;
    
    const oldModal = document.getElementById('eventsEventModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    const categoryOptions = Object.entries(EVENTS_CATEGORIES)
        .filter(([key]) => key !== 'all')
        .map(([key, label]) => 
            `<option value="${key}" ${e.category === key ? 'selected' : ''}>${label}</option>`
        ).join('');
    
    // Генерируем HTML для детей
    let childrenHtml = '';
    if (e.children && e.children.length > 0) {
        e.children.forEach((child, childIndex) => {
            childrenHtml += `
                <div class="events-child-item" style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(255,255,255,0.02);border-radius:4px;margin-bottom:2px;">
                    <span style="font-size:0.65rem;color:rgba(255,255,255,0.4);">${child.type}</span>
                    <span style="font-size:0.5rem;color:rgba(255,255,255,0.15);">min:${child.min} max:${child.max} loot:${child.lootmin}-${child.lootmax}</span>
                    <button class="events-child-remove" onclick="eventsRemoveChild(${index}, ${childIndex})" style="background:none;border:none;color:rgba(255,255,255,0.1);cursor:pointer;font-size:0.8rem;">✕</button>
                </div>
            `;
        });
    } else {
        childrenHtml = `<div style="color:rgba(255,255,255,0.15);font-size:0.7rem;">Нет дочерних элементов</div>`;
    }
    
    const modal = document.createElement('div');
    modal.id = 'eventsEventModal';
    modal.className = 'modal-overlay events-event-modal';
    modal.innerHTML = `
        <div class="modal-content events-modal-content">
            <div class="modal-header events-modal-header">
                <h3>
                    <span class="events-modal-icon">📋</span>
                    ${e.name}
                </h3>
                <button class="modal-close" onclick="eventsCloseEventModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body events-modal-body">
                <div class="events-editor-form">
                    <!-- Основные настройки -->
                    <div class="events-form-section">
                        <h4>Основные настройки</h4>
                        <div class="events-form-group">
                            <label>Название (name)</label>
                            <input type="text" class="events-input" value="${e.name || ''}" 
                                   onchange="eventsUpdateEventField(${index}, 'name', this.value)">
                        </div>
                        <div class="events-form-row">
                            <div class="events-form-group">
                                <label>Категория</label>
                                <select class="events-select" onchange="eventsUpdateEventField(${index}, 'category', this.value)">
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div class="events-form-group">
                                <label>Активен</label>
                                <select class="events-select" onchange="eventsUpdateEventField(${index}, 'active', this.value)">
                                    <option value="1" ${e.active === '1' ? 'selected' : ''}>Да</option>
                                    <option value="0" ${e.active === '0' ? 'selected' : ''}>Нет</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Количества и время -->
                    <div class="events-form-section">
                        <h4>Количества и время</h4>
                        <div class="events-form-row">
                            <div class="events-form-group">
                                <label>Nominal</label>
                                <input type="number" class="events-input" value="${e.nominal || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'nominal', parseInt(this.value) || 0)">
                            </div>
                            <div class="events-form-group">
                                <label>Min</label>
                                <input type="number" class="events-input" value="${e.min || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'min', parseInt(this.value) || 0)">
                            </div>
                            <div class="events-form-group">
                                <label>Max</label>
                                <input type="number" class="events-input" value="${e.max || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'max', parseInt(this.value) || 0)">
                            </div>
                        </div>
                        <div class="events-form-row">
                            <div class="events-form-group">
                                <label>Lifetime (сек)</label>
                                <input type="number" class="events-input" value="${e.lifetime || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'lifetime', parseInt(this.value) || 0)">
                            </div>
                            <div class="events-form-group">
                                <label>Restock (сек)</label>
                                <input type="number" class="events-input" value="${e.restock || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'restock', parseInt(this.value) || 0)">
                            </div>
                        </div>
                    </div>

                    <!-- Радиусы -->
                    <div class="events-form-section">
                        <h4>Радиусы</h4>
                        <div class="events-form-row">
                            <div class="events-form-group">
                                <label>Safe Radius</label>
                                <input type="number" class="events-input" value="${e.saferadius || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'saferadius', parseInt(this.value) || 0)">
                            </div>
                            <div class="events-form-group">
                                <label>Distance Radius</label>
                                <input type="number" class="events-input" value="${e.distanceradius || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'distanceradius', parseInt(this.value) || 0)">
                            </div>
                            <div class="events-form-group">
                                <label>Cleanup Radius</label>
                                <input type="number" class="events-input" value="${e.cleanupradius || 0}" 
                                       onchange="eventsUpdateEventField(${index}, 'cleanupradius', parseInt(this.value) || 0)">
                            </div>
                        </div>
                    </div>

                    <!-- Позиция и лимит -->
                    <div class="events-form-section">
                        <h4>Позиция и лимит</h4>
                        <div class="events-form-row">
                            <div class="events-form-group">
                                <label>Position</label>
                                <select class="events-select" onchange="eventsUpdateEventField(${index}, 'position', this.value)">
                                    <option value="fixed" ${e.position === 'fixed' ? 'selected' : ''}>Fixed</option>
                                    <option value="player" ${e.position === 'player' ? 'selected' : ''}>Player</option>
                                    <option value="uniform" ${e.position === 'uniform' ? 'selected' : ''}>Uniform</option>
                                </select>
                            </div>
                            <div class="events-form-group">
                                <label>Limit</label>
                                <select class="events-select" onchange="eventsUpdateEventField(${index}, 'limit', this.value)">
                                    <option value="mixed" ${e.limit === 'mixed' ? 'selected' : ''}>Mixed</option>
                                    <option value="child" ${e.limit === 'child' ? 'selected' : ''}>Child</option>
                                    <option value="parent" ${e.limit === 'parent' ? 'selected' : ''}>Parent</option>
                                    <option value="custom" ${e.limit === 'custom' ? 'selected' : ''}>Custom</option>
                                </select>
                            </div>
                        </div>
                        <div class="events-form-group">
                            <label>Secondary (связанное событие)</label>
                            <input type="text" class="events-input" value="${e.secondary || ''}" 
                                   onchange="eventsUpdateEventField(${index}, 'secondary', this.value)" 
                                   placeholder="Имя связанного события">
                        </div>
                    </div>

                    <!-- Дочерние элементы -->
                    <div class="events-form-section">
                        <h4>Дочерние элементы (${e.children?.length || 0})</h4>
                        <div class="events-children-list" style="margin-bottom:8px;">
                            ${childrenHtml}
                        </div>
                        <div class="events-add-child" style="display:flex;gap:4px;flex-wrap:wrap;">
                            <input type="text" id="eventsChildType" placeholder="Тип" style="flex:1;min-width:100px;padding:4px 8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;color:#e5e5e5;font-size:0.7rem;outline:none;">
                            <input type="number" id="eventsChildMin" placeholder="Min" style="width:50px;padding:4px 8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;color:#e5e5e5;font-size:0.7rem;outline:none;" value="0">
                            <input type="number" id="eventsChildMax" placeholder="Max" style="width:50px;padding:4px 8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;color:#e5e5e5;font-size:0.7rem;outline:none;" value="0">
                            <button class="btn btn-primary btn-sm" onclick="eventsAddChild(${index})" style="padding:4px 10px;font-size:0.6rem;">+</button>
                        </div>
                    </div>

                    <!-- Флаги -->
                    <div class="events-form-section">
                        <h4>Флаги</h4>
                        <div class="events-form-row">
                            <div class="events-form-group">
                                <label>Deletable</label>
                                <select class="events-select" onchange="eventsUpdateFlag(${index}, 'deletable', this.value)">
                                    <option value="0" ${e.flags?.deletable === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${e.flags?.deletable === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                            <div class="events-form-group">
                                <label>Init Random</label>
                                <select class="events-select" onchange="eventsUpdateFlag(${index}, 'init_random', this.value)">
                                    <option value="0" ${e.flags?.init_random === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${e.flags?.init_random === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                            <div class="events-form-group">
                                <label>Remove Damaged</label>
                                <select class="events-select" onchange="eventsUpdateFlag(${index}, 'remove_damaged', this.value)">
                                    <option value="0" ${e.flags?.remove_damaged === '0' ? 'selected' : ''}>Нет</option>
                                    <option value="1" ${e.flags?.remove_damaged === '1' ? 'selected' : ''}>Да</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer events-modal-footer">
                <button class="btn btn-secondary" onclick="eventsCloseEventModal()">Закрыть</button>
                <button class="btn btn-primary" onclick="eventsCloseEventModal(); saveEventsConfig();">
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
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            eventsCloseEventModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            eventsCloseEventModal();
        }
    });
}

function eventsCloseEventModal() {
    const modal = document.getElementById('eventsEventModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// ОБНОВЛЕНИЕ ПОЛЕЙ
// ============================================

function eventsUpdateEventField(index, field, value) {
    if (!eventsState.events?.[index]) return;
    eventsState.events[index][field] = value;
    eventsState.isDirty = true;
    updateEventsStatus('⚠️ Есть несохранённые изменения');
    renderEventsList();
}

function eventsUpdateFlag(index, flag, value) {
    if (!eventsState.events?.[index]) return;
    if (!eventsState.events[index].flags) {
        eventsState.events[index].flags = {};
    }
    eventsState.events[index].flags[flag] = value;
    eventsState.isDirty = true;
    updateEventsStatus('⚠️ Есть несохранённые изменения');
}

function eventsAddChild(index) {
    const typeInput = document.getElementById('eventsChildType');
    const minInput = document.getElementById('eventsChildMin');
    const maxInput = document.getElementById('eventsChildMax');
    
    if (!typeInput || !typeInput.value.trim()) {
        if (typeof notifications !== 'undefined') {
            notifications.warning('Введите тип дочернего элемента');
        }
        return;
    }
    
    const child = {
        type: typeInput.value.trim(),
        min: minInput?.value || '0',
        max: maxInput?.value || '0',
        lootmin: '0',
        lootmax: '0'
    };
    
    if (!eventsState.events[index].children) {
        eventsState.events[index].children = [];
    }
    
    eventsState.events[index].children.push(child);
    eventsState.isDirty = true;
    updateEventsStatus('⚠️ Есть несохранённые изменения');
    
    typeInput.value = '';
    if (minInput) minInput.value = '0';
    if (maxInput) maxInput.value = '0';
    
    eventsOpenEventModal(index);
}

function eventsRemoveChild(eventIndex, childIndex) {
    if (!eventsState.events?.[eventIndex]?.children) return;
    eventsState.events[eventIndex].children.splice(childIndex, 1);
    eventsState.isDirty = true;
    updateEventsStatus('⚠️ Есть несохранённые изменения');
    eventsOpenEventModal(eventIndex);
}

// ============================================
// ДОБАВЛЕНИЕ/УДАЛЕНИЕ СОБЫТИЯ
// ============================================

function eventsAddEvent() {
    if (!eventsState.events) eventsState.events = [];
    
    const newEvent = {
        name: `NewEvent_${eventsState.events.length + 1}`,
        nominal: '0',
        min: '0',
        max: '0',
        lifetime: '0',
        restock: '0',
        saferadius: '0',
        distanceradius: '0',
        cleanupradius: '0',
        position: 'fixed',
        limit: 'mixed',
        active: '1',
        secondary: '',
        flags: { deletable: '0', init_random: '0', remove_damaged: '0' },
        children: [],
        category: 'other',
        childCount: 0
    };
    
    eventsState.events.push(newEvent);
    eventsState.isDirty = true;
    updateEventsStatus('⚠️ Есть несохранённые изменения');
    
    renderEventsList();
    eventsOpenEventModal(eventsState.events.length - 1);
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Добавлено событие: ${newEvent.name}`);
    }
}

function eventsConfirmDeleteEvent(index) {
    const e = eventsState.events?.[index];
    if (!e) return;
    
    eventsCloseEventModal();
    
    if (typeof mpgShowConfirmModal !== 'undefined') {
        mpgShowConfirmModal(
            'Удаление события',
            `Вы уверены, что хотите удалить "<strong>${e.name}</strong>"?<br>Это действие нельзя отменить.`,
            function() {
                eventsExecuteDeleteEvent(index);
            },
            function() {}
        );
    } else {
        if (confirm(`Удалить событие "${e.name}"?`)) {
            eventsExecuteDeleteEvent(index);
        }
    }
}

function eventsExecuteDeleteEvent(index) {
    const e = eventsState.events?.[index];
    if (!e) return;
    
    const name = e.name;
    
    eventsState.events.splice(index, 1);
    if (eventsState.selectedEvent === index) {
        eventsState.selectedEvent = null;
    } else if (eventsState.selectedEvent > index) {
        eventsState.selectedEvent--;
    }
    eventsState.isDirty = true;
    
    renderEventsList();
    updateEventsStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалено событие: ${name}`);
    }
}

// ============================================
// RAW РЕДАКТОР
// ============================================

function eventsOpenRaw() {
    const content = generateEventsXml(eventsState.events);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay events-raw-modal';
    modal.id = 'eventsRawModal';
    modal.innerHTML = `
        <div class="modal-content modal-confirm" style="max-width:800px;width:90%;">
            <div class="modal-confirm-header">
                <div class="modal-confirm-icon">📝</div>
                <h3>RAW редактор events.xml</h3>
            </div>
            <div class="modal-body" style="padding:16px 20px;">
                <textarea id="eventsRawTextarea" style="width:100%;min-height:400px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e5;font-family:'Courier New',monospace;font-size:0.8rem;padding:12px;resize:vertical;outline:none;box-sizing:border-box;">${content}</textarea>
            </div>
            <div class="modal-footer" style="padding:12px 20px;border-top:1px solid rgba(255,255,255,0.04);display:flex;justify-content:flex-end;gap:10px;">
                <button class="btn btn-secondary" onclick="eventsCloseRaw()">Отмена</button>
                <button class="btn btn-primary" onclick="eventsApplyRaw()">Применить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function eventsCloseRaw() {
    const modal = document.getElementById('eventsRawModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function eventsApplyRaw() {
    const textarea = document.getElementById('eventsRawTextarea');
    if (!textarea) return;
    
    try {
        const content = textarea.value;
        const parsed = parseEventsXml(content);
        eventsState.events = parsed.events || [];
        eventsState.isDirty = true;
        updateEventsStatus('⚠️ Есть несохранённые изменения');
        renderEventsList();
        eventsCloseRaw();
        
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

function eventsBackToTiles() {
    destroyEventsScrollTopButton();
    eventsCloseEventModal();
    
    if (eventsState.isDirty) {
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

let eventsScrollTopBtn = null;
let eventsScrollTimer = null;

function createEventsScrollTopButton() {
    const oldBtn = document.getElementById('eventsScrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        eventsScrollTopBtn = null;
    }
    
    if (eventsScrollTimer) {
        clearInterval(eventsScrollTimer);
        eventsScrollTimer = null;
    }
    
    eventsScrollTopBtn = document.createElement('button');
    eventsScrollTopBtn.id = 'eventsScrollTopBtn';
    eventsScrollTopBtn.className = 'scroll-top-btn';
    eventsScrollTopBtn.innerHTML = '↑';
    eventsScrollTopBtn.title = 'Наверх';
    
    let isScrolling = false;
    
    eventsScrollTopBtn.addEventListener('click', function(e) {
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
    
    document.body.appendChild(eventsScrollTopBtn);
    console.log('✅ Кнопка "Наверх" для events.xml создана');
    
    eventsScrollTimer = setInterval(function() {
        checkEventsScroll();
    }, 300);
    
    setTimeout(checkEventsScroll, 200);
}

function checkEventsScroll() {
    if (!eventsScrollTopBtn) return;
    
    const contentArea = document.getElementById('contentArea');
    let hasScroll = false;
    
    if (contentArea) {
        const scrollContainer = contentArea.querySelector('div:first-child');
        if (scrollContainer && scrollContainer.scrollTop > 50) {
            hasScroll = true;
        }
    }
    
    if (hasScroll) {
        eventsScrollTopBtn.classList.add('visible');
    } else {
        eventsScrollTopBtn.classList.remove('visible');
    }
}

function destroyEventsScrollTopButton() {
    if (eventsScrollTimer) {
        clearInterval(eventsScrollTimer);
        eventsScrollTimer = null;
    }
    
    const btn = document.getElementById('eventsScrollTopBtn');
    if (btn) {
        btn.remove();
        eventsScrollTopBtn = null;
    }
}

// ============================================
// ЭКСПОРТ
// ============================================

window.initEventsEditor = initEventsEditor;
window.saveEventsConfig = saveEventsConfig;
window.loadEventsConfig = loadEventsConfig;
window.eventsBackToTiles = eventsBackToTiles;
window.eventsFilterEvents = eventsFilterEvents;
window.eventsAddEvent = eventsAddEvent;
window.eventsConfirmDeleteEvent = eventsConfirmDeleteEvent;
window.eventsUpdateEventField = eventsUpdateEventField;
window.eventsUpdateFlag = eventsUpdateFlag;
window.eventsAddChild = eventsAddChild;
window.eventsRemoveChild = eventsRemoveChild;
window.eventsOpenRaw = eventsOpenRaw;
window.eventsCloseRaw = eventsCloseRaw;
window.eventsApplyRaw = eventsApplyRaw;
window.eventsOpenEventModal = eventsOpenEventModal;
window.eventsCloseEventModal = eventsCloseEventModal;

console.log('📋 events_editor.js загружен');