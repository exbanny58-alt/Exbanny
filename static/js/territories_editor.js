// ============================================
// TERRITORIES EDITOR - РЕДАКТОР ТЕРРИТОРИЙ ЖИВОТНЫХ
// ============================================

// ============================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================

let territoriesState = {
    serverPath: '',
    mapName: '',
    territoriesPath: '',
    isLoading: false,
    isDirty: false,
    rawContent: '',
    originalContent: '',
    territories: [],
    availableFiles: [],
    currentFile: null,
    selectedTerritoryIndex: null,
    isFileLoaded: false
};

// ============================================
// СПИСОК ВИДОВ ЖИВОТНЫХ
// ============================================

const TERRITORIES_SPECIES = {
    all: 'Все виды',
    bear: '🐻 Медведи',
    cattle: '🐄 Крупный рогатый скот',
    domestic_animals: '🐑 Домашние животные',
    fox: '🦊 Лисы',
    hare: '🐇 Зайцы',
    hen: '🐔 Куры',
    pig: '🐗 Кабаны',
    red_deer: '🦌 Благородные олени',
    roe_deer: '🦌 Косули',
    sheep_goat: '🐐 Овцы/Козы',
    wild_boar: '🐗 Дикие кабаны',
    wolf: '🐺 Волки',
    zombie: '🧟 Зомби'
};

// ============================================
// ТИПЫ ЗОН
// ============================================

const TERRITORY_ZONE_TYPES = {
    Rest: 'Отдых',
    Graze: 'Выпас',
    Water: 'Вода',
    HuntingGround: 'Охотничьи угодья',
    InfectedVillage: 'Заражённая деревня',
    InfectedCity: 'Заражённый город',
    InfectedIndustrial: 'Заражённая промышленность',
    InfectedArmy: 'Заражённая армия',
    InfectedArmyHard: 'Заражённая армия (сложная)',
    InfectedPolice: 'Заражённая полиция',
    InfectedFirefighter: 'Заражённые пожарные',
    InfectedMedic: 'Заражённые медики',
    InfectedNBC: 'Зараженные ХБЗ',
    InfectedPrisoner: 'Зараженные заключённые',
    InfectedReligious: 'Зараженные религиозные',
    InfectedSolitude: 'Зараженные одиночки',
    InfectedSpooky: 'Зараженные страшные',
    InfectedVillageTier1: 'Заражённая деревня (уровень 1)',
    InfectedCityTier1: 'Заражённый город (уровень 1)',
    Zone_fox: 'Зона лисы',
    Zone_Hare: 'Зона зайца',
    Zone_hen: 'Зона курицы'
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ (ОБНОВЛЕННАЯ)
// ============================================

function initTerritoriesEditor() {
    console.log('🗺️ Инициализация редактора территорий животных');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    // Показываем загрузку
    renderTerritoriesEditor(container, true);
    
    loadServerPath()
        .then(() => {
            console.log('✅ Путь к серверу загружен:', territoriesState.serverPath);
            return loadMapName();
        })
        .then(() => {
            console.log('✅ Карта определена:', territoriesState.mapName);
            return buildTerritoriesPath();
        })
        .then(() => {
            console.log('✅ Путь к территориям:', territoriesState.territoriesPath);
            // Загружаем файлы - внутри уже будет автозагрузка первого файла и перерисовка
            return loadAvailableFiles();
        })
        // loadAvailableFiles уже перерисовывает интерфейс, так что здесь ничего не делаем
        .catch((e) => {
            console.error('❌ Ошибка инициализации:', e);
            if (typeof notifications !== 'undefined') {
                notifications.error('Ошибка загрузки: ' + e.message);
            }
            // В случае ошибки показываем интерфейс
            const container = document.getElementById('editorContentArea');
            if (container) {
                renderTerritoriesEditor(container, false);
            }
        });
}

function loadServerPath() {
    return new Promise((resolve, reject) => {
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                if (settings.server_exe) {
                    const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
                    territoriesState.serverPath = serverDir;
                    console.log(`📁 Путь к серверу: ${territoriesState.serverPath}`);
                    resolve(territoriesState.serverPath);
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
        const configPath = territoriesState.serverPath + '/serverDZ.cfg';
        console.log(`📂 Читаем serverDZ.cfg: ${configPath}`);
        
        const cfgResponse = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath })
        });
        const cfgData = await cfgResponse.json();
        
        if (cfgData.success && cfgData.content) {
            const match = cfgData.content.match(/template\s*=\s*"([^"]+)"/);
            if (match) {
                territoriesState.mapName = match[1];
                console.log(`✅ Карта из serverDZ.cfg: ${territoriesState.mapName}`);
                return;
            }
        }
        
        const configJsonPath = 'server_config.json';
        console.log(`📂 serverDZ.cfg не дал результат, пробуем server_config.json из папки проекта`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configJsonPath })
        });
        const data = await response.json();
        
        if (data.success && data.content) {
            try {
                const config = JSON.parse(data.content);
                if (config.mission) {
                    territoriesState.mapName = config.mission;
                    console.log(`✅ Карта из server_config.json (проект): ${territoriesState.mapName}`);
                    return;
                }
            } catch (e) {
                console.warn('⚠️ Ошибка парсинга server_config.json:', e);
            }
        }
        
        territoriesState.mapName = 'dayzOffline.chernarusplus';
        console.log(`📋 Используем дефолтную карту: ${territoriesState.mapName}`);
        
    } catch (e) {
        console.warn('⚠️ Ошибка загрузки карты:', e);
        territoriesState.mapName = 'dayzOffline.chernarusplus';
    }
}

function buildTerritoriesPath() {
    if (!territoriesState.serverPath || !territoriesState.mapName) {
        return Promise.reject(new Error('Путь к серверу или карта не определены'));
    }
    
    territoriesState.territoriesPath = `${territoriesState.serverPath}/mpmissions/${territoriesState.mapName}/env`;
    console.log(`📂 Путь к территориям: ${territoriesState.territoriesPath}`);
    return Promise.resolve(territoriesState.territoriesPath);
}

// ============================================
// ЗАГРУЗКА СПИСКА ФАЙЛОВ И АВТОЗАГРУЗКА ПЕРВОГО
// ============================================

async function loadAvailableFiles() {
    if (!territoriesState.territoriesPath) {
        console.warn('⚠️ Путь к территориям не загружен');
        return;
    }
    
    territoriesState.isLoading = true;
    updateTerritoriesStatus('⏳ Загрузка списка файлов...');
    
    try {
        const response = await fetch('/api/file/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                path: territoriesState.territoriesPath,
                pattern: '*.xml'
            })
        });
        const data = await response.json();
        
        if (data.success && data.files) {
            const territoryFiles = data.files.filter(f => 
                f.endsWith('_territories.xml') || 
                f === 'zombie_territories.xml' ||
                f === 'bear_territories.xml'
            );
            
            territoriesState.availableFiles = territoryFiles;
            console.log(`📋 Найдено ${territoryFiles.length} файлов территорий`);
            
            if (territoryFiles.length > 0) {
                // ✅ АВТОМАТИЧЕСКИ ЗАГРУЖАЕМ ПЕРВЫЙ ФАЙЛ
                const firstFile = territoryFiles[0];
                console.log(`🔄 Автозагрузка первого файла: ${firstFile}`);
                
                // Загружаем файл и только после этого обновляем интерфейс
                await loadTerritoriesFile(firstFile);
                
                // Обновляем статус
                updateTerritoriesStatus(`✅ Загружено ${territoriesState.territories.length} территорий из ${firstFile}`);
            } else {
                territoriesState.territories = [];
                territoriesState.currentFile = null;
                territoriesState.isFileLoaded = false;
                updateTerritoriesStatus('⚠️ Файлы территорий не найдены');
                if (typeof notifications !== 'undefined') {
                    notifications.warning('Файлы территорий не найдены в папке env');
                }
            }
            
            // Перерисовываем интерфейс
            const container = document.getElementById('editorContentArea');
            if (container) {
                renderTerritoriesEditor(container, false);
            }
            
        } else {
            territoriesState.availableFiles = [];
            territoriesState.territories = [];
            territoriesState.currentFile = null;
            territoriesState.isFileLoaded = false;
            updateTerritoriesStatus('⚠️ Не удалось получить список файлов');
            
            const container = document.getElementById('editorContentArea');
            if (container) {
                renderTerritoriesEditor(container, false);
            }
        }
        
    } catch (e) {
        console.error('❌ Ошибка загрузки файлов:', e);
        territoriesState.availableFiles = [];
        territoriesState.territories = [];
        territoriesState.currentFile = null;
        territoriesState.isFileLoaded = false;
        updateTerritoriesStatus('❌ Ошибка загрузки');
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки файлов территорий');
        }
        
        const container = document.getElementById('editorContentArea');
        if (container) {
            renderTerritoriesEditor(container, false);
        }
    }
    
    territoriesState.isLoading = false;
}

// ============================================
// ЗАГРУЗКА ФАЙЛА ТЕРРИТОРИЙ
// ============================================

function loadTerritoriesFile(filename) {
    return new Promise((resolve, reject) => {
        if (!territoriesState.territoriesPath) {
            reject(new Error('Путь к территориям не загружен'));
            return;
        }
        
        const fullPath = territoriesState.territoriesPath + '/' + filename;
        territoriesState.currentFile = filename;
        territoriesState.isFileLoaded = false;
        
        updateTerritoriesStatus(`⏳ Загрузка ${filename}...`);
        
        fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fullPath })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.content) {
                territoriesState.rawContent = data.content;
                territoriesState.originalContent = data.content;
                
                const parsed = parseTerritoriesXml(data.content);
                territoriesState.territories = parsed.territories || [];
                territoriesState.isFileLoaded = true;
                
                const species = getSpeciesFromFilename(filename);
                
                console.log(`✅ Загружено ${territoriesState.territories.length} территорий из ${filename}`);
                updateTerritoriesStatus(`✅ Загружено ${territoriesState.territories.length} территорий`);
                
                // Обновляем список файлов
                const container = document.getElementById('editorContentArea');
                if (container) {
                    renderTerritoriesEditor(container, false);
                }
                
                if (typeof notifications !== 'undefined') {
                    notifications.success(`Загружено ${territoriesState.territories.length} территорий из ${filename}`);
                }
                
                resolve();
            } else {
                territoriesState.territories = [];
                territoriesState.isFileLoaded = false;
                updateTerritoriesStatus(`⚠️ Ошибка загрузки ${filename}`);
                
                const container = document.getElementById('editorContentArea');
                if (container) {
                    renderTerritoriesEditor(container, false);
                }
                
                reject(new Error('Файл не найден или пуст'));
            }
        })
        .catch(e => {
            console.error(`❌ Ошибка загрузки ${filename}:`, e);
            territoriesState.territories = [];
            territoriesState.isFileLoaded = false;
            updateTerritoriesStatus(`❌ Ошибка загрузки ${filename}`);
            
            const container = document.getElementById('editorContentArea');
            if (container) {
                renderTerritoriesEditor(container, false);
            }
            
            reject(e);
        });
    });
}

// ============================================
// ОПРЕДЕЛЕНИЕ ВИДА ЖИВОТНОГО ПО ИМЕНИ ФАЙЛА
// ============================================

function getSpeciesFromFilename(filename) {
    if (filename.includes('bear')) return 'bear';
    if (filename.includes('cattle')) return 'cattle';
    if (filename.includes('domestic_animals')) return 'domestic_animals';
    if (filename.includes('fox')) return 'fox';
    if (filename.includes('hare')) return 'hare';
    if (filename.includes('hen')) return 'hen';
    if (filename.includes('pig')) return 'pig';
    if (filename.includes('red_deer')) return 'red_deer';
    if (filename.includes('roe_deer')) return 'roe_deer';
    if (filename.includes('sheep_goat')) return 'sheep_goat';
    if (filename.includes('wild_boar')) return 'wild_boar';
    if (filename.includes('wolf')) return 'wolf';
    if (filename.includes('zombie')) return 'zombie';
    return 'all';
}

// ============================================
// ПАРСИНГ XML
// ============================================

function parseTerritoriesXml(content) {
    console.log('🔍 Парсинг территорий...');
    
    const territories = [];
    
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('❌ Ошибка парсинга XML:', parserError.textContent);
            return { territories: [] };
        }
        
        const territoryNodes = xmlDoc.getElementsByTagName('territory');
        console.log(`📋 Найдено ${territoryNodes.length} элементов <territory>`);
        
        for (let i = 0; i < territoryNodes.length; i++) {
            const node = territoryNodes[i];
            const color = node.getAttribute('color');
            
            const zones = [];
            const zoneNodes = node.getElementsByTagName('zone');
            
            for (let j = 0; j < zoneNodes.length; j++) {
                const zone = zoneNodes[j];
                zones.push({
                    name: zone.getAttribute('name') || '',
                    smin: zone.getAttribute('smin') || '0',
                    smax: zone.getAttribute('smax') || '0',
                    dmin: zone.getAttribute('dmin') || '0',
                    dmax: zone.getAttribute('dmax') || '0',
                    x: zone.getAttribute('x') || '0',
                    z: zone.getAttribute('z') || '0',
                    r: zone.getAttribute('r') || '0'
                });
            }
            
            territories.push({
                color: color || '0',
                zones: zones,
                zoneCount: zones.length
            });
        }
        
        console.log(`✅ Успешно спарсено ${territories.length} территорий`);
        
    } catch (e) {
        console.error('❌ Ошибка парсинга XML:', e);
        return { territories: [] };
    }
    
    return { territories: territories };
}

// ============================================
// ГЕНЕРАЦИЯ XML
// ============================================

function generateTerritoriesXml(territories) {
    let lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<territory-type>');
    
    for (const t of territories) {
        lines.push(`    <territory color="${t.color}">`);
        for (const zone of t.zones) {
            lines.push(`        <zone name="${zone.name}" smin="${zone.smin}" smax="${zone.smax}" dmin="${zone.dmin}" dmax="${zone.dmax}" x="${zone.x}" z="${zone.z}" r="${zone.r}"/>`);
        }
        lines.push('    </territory>');
    }
    
    lines.push('</territory-type>');
    return lines.join('\n');
}

// ============================================
// СОХРАНЕНИЕ
// ============================================

async function saveTerritoriesConfig() {
    if (!territoriesState.territoriesPath || !territoriesState.currentFile) {
        console.error('❌ Путь к территориям не загружен');
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к территориям не загружен');
        }
        return false;
    }
    
    updateTerritoriesStatus('⏳ Сохранение...');
    
    try {
        const fullPath = territoriesState.territoriesPath + '/' + territoriesState.currentFile;
        const content = generateTerritoriesXml(territoriesState.territories);
        
        const response = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: fullPath, content: content })
        });
        const data = await response.json();
        
        if (data.success) {
            territoriesState.isDirty = false;
            territoriesState.originalContent = content;
            updateTerritoriesStatus(`✅ Сохранено (${territoriesState.territories.length} территорий)`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success('Файл территорий сохранён');
            }
            return true;
        } else {
            throw new Error(data.message || 'Ошибка сохранения');
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        updateTerritoriesStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сохранения: ' + e.message);
        }
        return false;
    }
}

// ============================================
// ОБНОВЛЕНИЕ СТАТУСА
// ============================================

function updateTerritoriesStatus(message) {
    const statusEl = document.getElementById('territoriesStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'territories-status';
        
        if (message.includes('⚠️')) statusEl.classList.add('warning');
        else if (message.includes('❌')) statusEl.classList.add('error');
        else if (message.includes('✅')) statusEl.classList.add('success');
        else if (message.includes('⏳')) statusEl.classList.add('loading');
    }
}

// ============================================
// ВЫБОР ФАЙЛА
// ============================================

function territoriesSelectFile(filename) {
    console.log(`📂 Выбран файл: ${filename}`);
    
    if (filename === territoriesState.currentFile && territoriesState.isFileLoaded) {
        // Если файл уже загружен - просто открываем модалку
        showTerritoriesFileModal(filename);
        return;
    }
    
    // Показываем модальное окно с загрузкой
    showTerritoriesFileModal(filename);
}
// ============================================
// МОДАЛЬНОЕ ОКНО С НАСТРОЙКАМИ ФАЙЛА
// ============================================

function showTerritoriesFileModal(filename) {
    const oldModal = document.getElementById('territoriesFileModal');
    if (oldModal) {
        oldModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'territoriesFileModal';
    modal.className = 'modal-overlay territories-file-modal';
    modal.innerHTML = `
        <div class="modal-content territories-modal-content" style="max-width: 750px; width: 92%; max-height: 85vh;">
            <div class="modal-header territories-modal-header">
                <h3>
                    <span class="territories-modal-icon">🗺️</span>
                    ${filename}
                    <span style="font-size: 0.6rem; font-weight: 400; color: rgba(255,255,255,0.3); margin-left: 8px;">
                        ${territoriesState.isFileLoaded ? `${territoriesState.territories.length} территорий` : 'Загрузка...'}
                    </span>
                </h3>
                <button class="modal-close" onclick="territoriesCloseFileModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body territories-modal-body" id="territoriesFileModalBody">
                <div class="territories-loading">
                    <span class="spinner"></span>
                    Загрузка файла...
                </div>
            </div>
            <div class="modal-footer territories-modal-footer">
                <button class="btn btn-secondary" onclick="territoriesCloseFileModal()">Закрыть</button>
                <button class="btn btn-primary" onclick="territoriesCloseFileModal(); saveTerritoriesConfig();">
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

    // Загружаем файл
    loadTerritoriesFile(filename)
        .then(() => {
            renderTerritoriesFileContent();
        })
        .catch((e) => {
            const body = document.getElementById('territoriesFileModalBody');
            if (body) {
                body.innerHTML = `
                    <div class="territories-empty-list">
                        <span class="territories-empty-icon">❌</span>
                        <p>Ошибка загрузки: ${e.message}</p>
                    </div>
                `;
            }
        });

    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            territoriesCloseFileModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            territoriesCloseFileModal();
        }
    });
}

function territoriesCloseFileModal() {
    const modal = document.getElementById('territoriesFileModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// ОТРИСОВКА КОНТЕНТА В МОДАЛЬНОМ ОКНЕ
// ============================================

function renderTerritoriesFileContent() {
    const body = document.getElementById('territoriesFileModalBody');
    if (!body) return;
    
    const territories = territoriesState.territories || [];
    
    if (territories.length === 0) {
        body.innerHTML = `
            <div class="territories-empty-list">
                <span class="territories-empty-icon">🗺️</span>
                <p>Нет территорий в файле</p>
                <button class="btn btn-primary btn-sm" onclick="territoriesAddTerritoryFromModal()" style="margin-top: 10px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Добавить территорию
                </button>
            </div>
        `;
        return;
    }
    
    let html = `<div class="territories-modal-list">`;
    territories.forEach((t, index) => {
        const zoneTypes = {};
        t.zones.forEach(z => {
            zoneTypes[z.name] = (zoneTypes[z.name] || 0) + 1;
        });
        
        const zoneSummary = Object.entries(zoneTypes)
            .map(([name, count]) => {
                const label = TERRITORY_ZONE_TYPES[name] || name;
                return `${label}: ${count}`;
            })
            .join(', ');
        
        const colorHex = t.color ? '#' + parseInt(t.color).toString(16).padStart(8, '0').slice(2) : '#ffffff';
        
        html += `
            <div class="territories-modal-item" onclick="territoriesOpenTerritoryModalFromModal(${index})">
                <div class="territories-modal-item-info">
                    <span class="territories-modal-item-color" style="background:${colorHex};"></span>
                    <span class="territories-modal-item-name">Территория #${index + 1}</span>
                    <span class="territories-modal-item-badge">${t.zones.length} зон</span>
                </div>
                <div class="territories-modal-item-details">
                    <span class="territories-modal-item-zones">${zoneSummary || 'Нет зон'}</span>
                </div>
                <div class="territories-modal-item-actions">
                    <button class="territories-modal-item-delete" onclick="event.stopPropagation(); territoriesConfirmDeleteTerritoryFromModal(${index})" title="Удалить территорию">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    });
    html += `
        <div style="padding: 8px 0; text-align: center;">
            <button class="btn btn-primary btn-sm" onclick="territoriesAddTerritoryFromModal()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Добавить территорию
            </button>
        </div>
    </div>`;
    
    body.innerHTML = html;
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА (СПИСОК ФАЙЛОВ)
// ============================================

function renderTerritoriesEditor(container, isLoading = false) {
    let filesListHtml = '';
    if (territoriesState.availableFiles.length > 0) {
        filesListHtml = territoriesState.availableFiles.map(f => {
            const isActive = f === territoriesState.currentFile;
            const species = getSpeciesFromFilename(f);
            const speciesLabel = TERRITORIES_SPECIES[species] || 'Неизвестно';
            const count = (f === territoriesState.currentFile && territoriesState.isFileLoaded) ? 
                territoriesState.territories.length : '—';
            return `
                <div class="territories-file-item ${isActive ? 'active' : ''}" onclick="territoriesSelectFile('${f}')">
                    <span class="territories-file-item-icon">📄</span>
                    <span class="territories-file-item-name">${f}</span>
                    <span class="territories-file-item-species">${speciesLabel}</span>
                    <span class="territories-file-item-count">${count}</span>
                    ${isActive ? '<span class="territories-file-item-badge">✅</span>' : ''}
                </div>
            `;
        }).join('');
    } else {
        filesListHtml = `
            <div class="territories-empty-files">
                <span class="territories-empty-icon">📭</span>
                <p>Нет файлов территорий</p>
                <p class="territories-empty-hint">Проверьте папку env на сервере</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="territories-editor">
            <button class="territories-back-btn" onclick="territoriesBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <div class="territories-header">
                <div class="territories-header-info">
                    <span class="territories-header-icon">🗺️</span>
                    <div>
                        <h2 class="territories-header-title">Редактор территорий животных</h2>
                        <p class="territories-header-subtitle">Карта <strong>${territoriesState.mapName || 'не определена'}</strong> • ${territoriesState.availableFiles.length} файлов</p>
                    </div>
                </div>
                <div class="territories-header-actions">
                    <button class="btn btn-secondary" onclick="loadAvailableFiles()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                        </svg>
                        Обновить
                    </button>
                </div>
            </div>

            <div class="territories-status-bar">
                <span class="territories-status" id="territoriesStatus">${isLoading ? '⏳ Загрузка...' : '✅ Готово'}</span>
                <span class="territories-path">${territoriesState.territoriesPath || 'Путь не указан'}</span>
            </div>

            <!-- СПИСОК ФАЙЛОВ -->
            <div class="territories-files-container">
                <div class="territories-files-header">
                    <h3>📄 Файлы территорий</h3>
                    <span class="territories-files-count">${territoriesState.availableFiles.length}</span>
                </div>
                <div class="territories-files-list">
                    ${filesListHtml}
                </div>
            </div>
        </div>
    `;
    
    setTimeout(createTerritoriesScrollTopButton, 300);
}

// ============================================
// ОТКРЫТИЕ ТЕРРИТОРИИ ИЗ МОДАЛЬНОГО ОКНА
// ============================================

function territoriesOpenTerritoryModalFromModal(index) {
    territoriesOpenTerritoryModal(index);
}

function territoriesAddTerritoryFromModal() {
    territoriesAddTerritory();
    // Обновляем содержимое модала
    setTimeout(() => {
        renderTerritoriesFileContent();
    }, 300);
}

function territoriesConfirmDeleteTerritoryFromModal(index) {
    territoriesConfirmDeleteTerritory(index);
}

// ============================================
// МОДАЛЬНОЕ ОКНО РЕДАКТОРА ТЕРРИТОРИИ
// ============================================

function territoriesOpenTerritoryModal(index) {
    const t = territoriesState.territories?.[index];
    if (!t) return;
    
    territoriesState.selectedTerritoryIndex = index;
    
    const oldModal = document.getElementById('territoriesTerritoryModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    const zoneTypeOptions = Object.entries(TERRITORY_ZONE_TYPES)
        .map(([key, label]) => 
            `<option value="${key}">${label}</option>`
        ).join('');
    
    let zonesHtml = '';
    t.zones.forEach((zone, zoneIndex) => {
        const zoneLabel = TERRITORY_ZONE_TYPES[zone.name] || zone.name;
        zonesHtml += `
            <div class="territories-zone-item">
                <div style="flex:1;min-width:0;">
                    <span style="font-size:0.75rem;font-weight:600;color:rgba(255,255,255,0.7);">${zoneLabel}</span>
                    <span style="font-size:0.55rem;color:rgba(255,255,255,0.2);margin-left:6px;">
                        x:${zone.x} z:${zone.z} r:${zone.r}
                    </span>
                </div>
                <div style="display:flex;gap:4px;">
                    <button class="btn btn-secondary btn-sm" onclick="territoriesEditZone(${index}, ${zoneIndex})" style="padding:2px 8px;font-size:0.5rem;">✏️</button>
                    <button class="territories-zone-remove" onclick="territoriesRemoveZone(${index}, ${zoneIndex})" style="background:none;border:none;color:rgba(255,255,255,0.1);cursor:pointer;font-size:0.8rem;padding:2px 4px;">✕</button>
                </div>
            </div>
        `;
    });
    
    const modal = document.createElement('div');
    modal.id = 'territoriesTerritoryModal';
    modal.className = 'modal-overlay territories-territory-modal';
    modal.innerHTML = `
        <div class="modal-content territories-modal-content" style="max-width:680px; width:92%; max-height:85vh;">
            <div class="modal-header territories-modal-header">
                <h3>
                    <span class="territories-modal-icon">🗺️</span>
                    Территория #${index + 1}
                </h3>
                <button class="modal-close" onclick="territoriesCloseTerritoryModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body territories-modal-body">
                <div class="territories-editor-form">
                    <div class="territories-form-section">
                        <h4>Основные настройки</h4>
                        <div class="territories-form-group">
                            <label>Цвет (color)</label>
                            <input type="text" class="territories-input" value="${t.color || '0'}" 
                                   onchange="territoriesUpdateTerritoryField(${index}, 'color', this.value)"
                                   placeholder="Например: 864420070">
                            <span class="territories-hint">Числовое значение цвета территории</span>
                        </div>
                        <div class="territories-form-group">
                            <label>Количество зон: ${t.zones.length}</label>
                        </div>
                    </div>

                    <div class="territories-form-section">
                        <h4>Зоны (${t.zones.length})</h4>
                        <div class="territories-zones-list" style="margin-bottom:8px;max-height:200px;overflow-y:auto;">
                            ${zonesHtml || '<div style="color:rgba(255,255,255,0.15);font-size:0.7rem;">Нет зон</div>'}
                        </div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                            <select id="territoriesZoneType" class="territories-select" style="flex:1;min-width:120px;">
                                ${zoneTypeOptions}
                            </select>
                            <button class="btn btn-primary btn-sm" onclick="territoriesAddZone(${index})" style="padding:4px 12px;font-size:0.65rem;">➕ Добавить зону</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer territories-modal-footer">
                <button class="btn btn-secondary" onclick="territoriesCloseTerritoryModal()">Закрыть</button>
                <button class="btn btn-primary" onclick="territoriesCloseTerritoryModal(); saveTerritoriesConfig(); renderTerritoriesFileContent();">
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
            territoriesCloseTerritoryModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            territoriesCloseTerritoryModal();
        }
    });
}

function territoriesCloseTerritoryModal() {
    const modal = document.getElementById('territoriesTerritoryModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// МОДАЛЬНОЕ ОКНО РЕДАКТОРА ЗОНЫ
// ============================================

function territoriesEditZone(territoryIndex, zoneIndex) {
    const t = territoriesState.territories?.[territoryIndex];
    const z = t?.zones?.[zoneIndex];
    if (!z) return;
    
    const oldModal = document.getElementById('territoriesZoneModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    const zoneTypeOptions = Object.entries(TERRITORY_ZONE_TYPES)
        .map(([key, label]) => 
            `<option value="${key}" ${key === z.name ? 'selected' : ''}>${label}</option>`
        ).join('');
    
    const modal = document.createElement('div');
    modal.id = 'territoriesZoneModal';
    modal.className = 'modal-overlay territories-zone-modal';
    modal.innerHTML = `
        <div class="modal-content territories-modal-content" style="max-width:500px;">
            <div class="modal-header territories-modal-header">
                <h3>
                    <span class="territories-modal-icon">📍</span>
                    Редактирование зоны
                </h3>
                <button class="modal-close" onclick="territoriesCloseZoneModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body territories-modal-body">
                <div class="territories-editor-form">
                    <div class="territories-form-section">
                        <h4>Параметры зоны</h4>
                        <div class="territories-form-group">
                            <label>Тип зоны (name)</label>
                            <select class="territories-select" id="territoriesZoneEditType" onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'name', this.value)">
                                ${zoneTypeOptions}
                            </select>
                        </div>
                        <div class="territories-form-row">
                            <div class="territories-form-group">
                                <label>X</label>
                                <input type="text" class="territories-input" value="${z.x || '0'}" 
                                       onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'x', this.value)">
                            </div>
                            <div class="territories-form-group">
                                <label>Z</label>
                                <input type="text" class="territories-input" value="${z.z || '0'}" 
                                       onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'z', this.value)">
                            </div>
                            <div class="territories-form-group">
                                <label>R (радиус)</label>
                                <input type="text" class="territories-input" value="${z.r || '0'}" 
                                       onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'r', this.value)">
                            </div>
                        </div>
                        <div class="territories-form-row">
                            <div class="territories-form-group">
                                <label>smin</label>
                                <input type="text" class="territories-input" value="${z.smin || '0'}" 
                                       onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'smin', this.value)">
                            </div>
                            <div class="territories-form-group">
                                <label>smax</label>
                                <input type="text" class="territories-input" value="${z.smax || '0'}" 
                                       onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'smax', this.value)">
                            </div>
                        </div>
                        <div class="territories-form-row">
                            <div class="territories-form-group">
                                <label>dmin</label>
                                <input type="text" class="territories-input" value="${z.dmin || '0'}" 
                                       onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'dmin', this.value)">
                            </div>
                            <div class="territories-form-group">
                                <label>dmax</label>
                                <input type="text" class="territories-input" value="${z.dmax || '0'}" 
                                       onchange="territoriesUpdateZoneField(${territoryIndex}, ${zoneIndex}, 'dmax', this.value)">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer territories-modal-footer">
                <button class="btn btn-secondary" onclick="territoriesCloseZoneModal()">Закрыть</button>
                <button class="btn btn-primary" onclick="territoriesCloseZoneModal(); territoriesOpenTerritoryModal(${territoryIndex});">
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
            territoriesCloseZoneModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            territoriesCloseZoneModal();
        }
    });
}

function territoriesCloseZoneModal() {
    const modal = document.getElementById('territoriesZoneModal');
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

function territoriesUpdateTerritoryField(index, field, value) {
    if (!territoriesState.territories?.[index]) return;
    territoriesState.territories[index][field] = value;
    territoriesState.isDirty = true;
    updateTerritoriesStatus('⚠️ Есть несохранённые изменения');
}

function territoriesUpdateZoneField(territoryIndex, zoneIndex, field, value) {
    const t = territoriesState.territories?.[territoryIndex];
    if (!t?.zones?.[zoneIndex]) return;
    t.zones[zoneIndex][field] = value;
    territoriesState.isDirty = true;
    updateTerritoriesStatus('⚠️ Есть несохранённые изменения');
}

// ============================================
// ДОБАВЛЕНИЕ/УДАЛЕНИЕ ЗОНЫ
// ============================================

function territoriesAddZone(territoryIndex) {
    const t = territoriesState.territories?.[territoryIndex];
    if (!t) return;
    
    const typeSelect = document.getElementById('territoriesZoneType');
    const zoneType = typeSelect ? typeSelect.value : 'Graze';
    
    t.zones.push({
        name: zoneType,
        smin: '0',
        smax: '0',
        dmin: '0',
        dmax: '0',
        x: '0.0',
        z: '0.0',
        r: '50.0'
    });
    
    territoriesState.isDirty = true;
    updateTerritoriesStatus('⚠️ Есть несохранённые изменения');
    territoriesOpenTerritoryModal(territoryIndex);
}

function territoriesRemoveZone(territoryIndex, zoneIndex) {
    const t = territoriesState.territories?.[territoryIndex];
    if (!t?.zones) return;
    
    t.zones.splice(zoneIndex, 1);
    territoriesState.isDirty = true;
    updateTerritoriesStatus('⚠️ Есть несохранённые изменения');
    territoriesOpenTerritoryModal(territoryIndex);
}

// ============================================
// ДОБАВЛЕНИЕ/УДАЛЕНИЕ ТЕРРИТОРИИ
// ============================================

function territoriesAddTerritory() {
    if (!territoriesState.territories) territoriesState.territories = [];
    
    territoriesState.territories.push({
        color: '864420070',
        zones: [],
        zoneCount: 0
    });
    
    territoriesState.isDirty = true;
    updateTerritoriesStatus('⚠️ Есть несохранённые изменения');
    
    // Обновляем список в модальном окне
    renderTerritoriesFileContent();
    
    const newIndex = territoriesState.territories.length - 1;
    territoriesOpenTerritoryModal(newIndex);
    
    if (typeof notifications !== 'undefined') {
        notifications.success('Добавлена новая территория');
    }
}

function territoriesConfirmDeleteTerritory(index) {
    const t = territoriesState.territories?.[index];
    if (!t) return;
    
    territoriesCloseTerritoryModal();
    
    territoriesShowConfirmModal(
        'Удаление территории',
        `Вы уверены, что хотите удалить территорию #${index + 1} (${t.zones.length} зон)?<br>Это действие нельзя отменить.`,
        function() {
            territoriesExecuteDeleteTerritory(index);
        },
        function() {}
    );
}

function territoriesExecuteDeleteTerritory(index) {
    const t = territoriesState.territories?.[index];
    if (!t) return;
    
    territoriesState.territories.splice(index, 1);
    if (territoriesState.selectedTerritoryIndex === index) {
        territoriesState.selectedTerritoryIndex = null;
    } else if (territoriesState.selectedTerritoryIndex > index) {
        territoriesState.selectedTerritoryIndex--;
    }
    territoriesState.isDirty = true;
    
    renderTerritoriesFileContent();
    updateTerritoriesStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.info('Территория удалена');
    }
}

// ============================================
// МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ
// ============================================

function territoriesShowConfirmModal(title, message, onConfirm, onCancel) {
    const oldModal = document.getElementById('territoriesConfirmModal');
    if (oldModal) {
        oldModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'territoriesConfirmModal';
    modal.className = 'modal-overlay territories-confirm-modal';
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
                <button class="btn btn-secondary" id="territoriesConfirmCancel">Отмена</button>
                <button class="btn btn-danger" id="territoriesConfirmOk">
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

    modal.querySelector('#territoriesConfirmCancel').addEventListener('click', () => {
        closeTerritoriesConfirmModal();
        if (typeof onCancel === 'function') onCancel();
    });

    modal.querySelector('#territoriesConfirmOk').addEventListener('click', () => {
        closeTerritoriesConfirmModal();
        if (typeof onConfirm === 'function') onConfirm();
    });

    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeTerritoriesConfirmModal();
            if (typeof onCancel === 'function') onCancel();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTerritoriesConfirmModal();
            if (typeof onCancel === 'function') onCancel();
        }
    });
}

function closeTerritoriesConfirmModal() {
    const modal = document.getElementById('territoriesConfirmModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// RAW РЕДАКТОР
// ============================================

function territoriesOpenRaw() {
    const content = generateTerritoriesXml(territoriesState.territories);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay territories-raw-modal';
    modal.id = 'territoriesRawModal';
    modal.innerHTML = `
        <div class="modal-content modal-confirm" style="max-width:800px;width:90%;">
            <div class="modal-confirm-header">
                <div class="modal-confirm-icon">📝</div>
                <h3>RAW редактор территорий</h3>
            </div>
            <div class="modal-body" style="padding:16px 20px;">
                <textarea id="territoriesRawTextarea" style="width:100%;min-height:400px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e5;font-family:'Courier New',monospace;font-size:0.8rem;padding:12px;resize:vertical;outline:none;box-sizing:border-box;">${content}</textarea>
            </div>
            <div class="modal-footer" style="padding:12px 20px;border-top:1px solid rgba(255,255,255,0.04);display:flex;justify-content:flex-end;gap:10px;">
                <button class="btn btn-secondary" onclick="territoriesCloseRaw()">Отмена</button>
                <button class="btn btn-primary" onclick="territoriesApplyRaw()">Применить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function territoriesCloseRaw() {
    const modal = document.getElementById('territoriesRawModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function territoriesApplyRaw() {
    const textarea = document.getElementById('territoriesRawTextarea');
    if (!textarea) return;
    
    try {
        const content = textarea.value;
        const parsed = parseTerritoriesXml(content);
        territoriesState.territories = parsed.territories || [];
        territoriesState.isDirty = true;
        updateTerritoriesStatus('⚠️ Есть несохранённые изменения');
        renderTerritoriesFileContent();
        territoriesCloseRaw();
        
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

function territoriesBackToTiles() {
    destroyTerritoriesScrollTopButton();
    territoriesCloseTerritoryModal();
    territoriesCloseZoneModal();
    territoriesCloseFileModal();
    
    if (territoriesState.isDirty) {
        territoriesShowConfirmModal(
            'Несохранённые изменения',
            'Есть несохранённые изменения. Вы уверены, что хотите выйти без сохранения?',
            function() {
                if (typeof window.backToServerTiles === 'function') {
                    window.backToServerTiles();
                }
            },
            function() {}
        );
        return;
    }
    
    if (typeof window.backToServerTiles === 'function') {
        window.backToServerTiles();
    }
}

// ============================================
// ПЛАВАЮЩАЯ КНОПКА "НАВЕРХ"
// ============================================

let territoriesScrollTopBtn = null;
let territoriesScrollTimer = null;

function createTerritoriesScrollTopButton() {
    const oldBtn = document.getElementById('territoriesScrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        territoriesScrollTopBtn = null;
    }
    
    if (territoriesScrollTimer) {
        clearInterval(territoriesScrollTimer);
        territoriesScrollTimer = null;
    }
    
    territoriesScrollTopBtn = document.createElement('button');
    territoriesScrollTopBtn.id = 'territoriesScrollTopBtn';
    territoriesScrollTopBtn.className = 'scroll-top-btn';
    territoriesScrollTopBtn.innerHTML = '↑';
    territoriesScrollTopBtn.title = 'Наверх';
    
    let isScrolling = false;
    
    territoriesScrollTopBtn.addEventListener('click', function(e) {
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
    
    document.body.appendChild(territoriesScrollTopBtn);
    console.log('✅ Кнопка "Наверх" для редактора территорий создана');
    
    territoriesScrollTimer = setInterval(function() {
        checkTerritoriesScroll();
    }, 300);
    
    setTimeout(checkTerritoriesScroll, 200);
}

function checkTerritoriesScroll() {
    if (!territoriesScrollTopBtn) return;
    
    const contentArea = document.getElementById('contentArea');
    let hasScroll = false;
    
    if (contentArea) {
        const scrollContainer = contentArea.querySelector('div:first-child');
        if (scrollContainer && scrollContainer.scrollTop > 50) {
            hasScroll = true;
        }
    }
    
    if (hasScroll) {
        territoriesScrollTopBtn.classList.add('visible');
    } else {
        territoriesScrollTopBtn.classList.remove('visible');
    }
}

function destroyTerritoriesScrollTopButton() {
    if (territoriesScrollTimer) {
        clearInterval(territoriesScrollTimer);
        territoriesScrollTimer = null;
    }
    
    const btn = document.getElementById('territoriesScrollTopBtn');
    if (btn) {
        btn.remove();
        territoriesScrollTopBtn = null;
    }
}

// ============================================
// ЭКСПОРТ
// ============================================

window.initTerritoriesEditor = initTerritoriesEditor;
window.saveTerritoriesConfig = saveTerritoriesConfig;
window.loadAvailableFiles = loadAvailableFiles;
window.territoriesBackToTiles = territoriesBackToTiles;
window.territoriesSelectFile = territoriesSelectFile;
window.territoriesAddTerritory = territoriesAddTerritory;
window.territoriesConfirmDeleteTerritory = territoriesConfirmDeleteTerritory;
window.territoriesOpenTerritoryModal = territoriesOpenTerritoryModal;
window.territoriesCloseTerritoryModal = territoriesCloseTerritoryModal;
window.territoriesEditZone = territoriesEditZone;
window.territoriesCloseZoneModal = territoriesCloseZoneModal;
window.territoriesAddZone = territoriesAddZone;
window.territoriesRemoveZone = territoriesRemoveZone;
window.territoriesUpdateTerritoryField = territoriesUpdateTerritoryField;
window.territoriesUpdateZoneField = territoriesUpdateZoneField;
window.territoriesOpenRaw = territoriesOpenRaw;
window.territoriesCloseRaw = territoriesCloseRaw;
window.territoriesApplyRaw = territoriesApplyRaw;
window.territoriesCloseFileModal = territoriesCloseFileModal;
window.territoriesOpenTerritoryModalFromModal = territoriesOpenTerritoryModalFromModal;
window.territoriesAddTerritoryFromModal = territoriesAddTerritoryFromModal;
window.territoriesConfirmDeleteTerritoryFromModal = territoriesConfirmDeleteTerritoryFromModal;

console.log('🗺️ territories_editor.js загружен (список файлов + модальное окно)');