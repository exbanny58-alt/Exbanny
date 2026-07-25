// ============================================
// GLOBALS.XML EDITOR - ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СЕРВЕРА
// ============================================

// ============================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================

let globalsState = {
    config: null,
    serverPath: '',
    mapName: '',
    globalsPath: '',
    isLoading: false,
    isDirty: false,
    rawContent: '',
    originalContent: '',
    variables: [],
    filteredVariables: [],
    searchTerm: '',
    currentCategory: 'all',
    selectedVariable: null
};

// ============================================
// БАЗА ЗНАНИЙ ПО ПАРАМЕТРАМ
// ============================================

const GLOBALS_KNOWLEDGE = {
    'AnimalMaxCount': {
        category: 'animals',
        label: 'Максимальное количество животных',
        description: 'Максимальное количество животных, которое может одновременно находиться на карте. Влияет на популяцию оленей, кабанов, кроликов и других животных.',
        effect: 'Увеличение числа создаёт более живую природу, но нагружает сервер. Уменьшение — снижает нагрузку, делает мир более пустынным.',
        recommended: '150–250 для стандартных серверов',
        type: 'int',
        range: '50-500'
    },
    'CleanupAvoidance': {
        category: 'cleanup',
        label: 'Дистанция очистки',
        description: 'Расстояние (в метрах), на которое система очистки "отодвигается" от игроков. Предметы не удаляются, если игрок находится ближе этого расстояния.',
        effect: 'Защищает предметы рядом с игроком от автоматического удаления. Чем больше значение — тем больше зона вокруг игрока, где предметы не очищаются.',
        recommended: '50–150 метров',
        type: 'int',
        range: '10-300'
    },
    'CleanupLifetimeDeadAnimal': {
        category: 'cleanup',
        label: 'Время жизни трупа животного',
        description: 'Время в секундах, через которое труп животного удаляется с карты.',
        effect: 'Можно использовать для шкур и мяса — если игроки не успевают разделать тушу за это время, она пропадает.',
        recommended: '600–1800 секунд',
        type: 'int',
        range: '300-3600'
    },
    'CleanupLifetimeDeadInfected': {
        category: 'cleanup',
        label: 'Время жизни трупа зомби',
        description: 'Время в секундах, через которое труп зомби/инфицированного удаляется с карты.',
        effect: 'Влияет на то, сколько времени лежат трупы после боя.',
        recommended: '180–600 секунд',
        type: 'int',
        range: '60-1200'
    },
    'CleanupLifetimeDeadPlayer': {
        category: 'cleanup',
        label: 'Время жизни трупа игрока',
        description: 'Время в секундах, через которое труп игрока удаляется с карты.',
        effect: 'Важно для PvP — враги могут обыскивать труп в течение этого времени.',
        recommended: '1800–7200 секунд (30 мин – 2 часа)',
        type: 'int',
        range: '600-14400'
    },
    'CleanupLifetimeDefault': {
        category: 'cleanup',
        label: 'Стандартное время жизни предметов',
        description: 'Стандартное время жизни для большинства предметов на земле (в секундах).',
        effect: 'Обычные предметы (не лут, не трупы) удаляются через указанное время после того, как оказались на земле. Влияет на производительность сервера.',
        recommended: '30–120 секунд',
        type: 'int',
        range: '15-300'
    },
    'CleanupLifetimeLimit': {
        category: 'cleanup',
        label: 'Лимит предметов на земле',
        description: 'Максимальное количество предметов на земле в одной зоне, после которого начинается принудительная очистка.',
        effect: 'Если в радиусе скапливается больше указанного числа предметов, система начинает удалять старые, чтобы не перегружать сервер.',
        recommended: '30–80',
        type: 'int',
        range: '20-150'
    },
    'CleanupLifetimeRuined': {
        category: 'cleanup',
        label: 'Время жизни сломанных предметов',
        description: 'Время в секундах, через которое уничтоженный (ruined) предмет удаляется с земли.',
        effect: 'Сломанные предметы (0% прочности) исчезают через указанное время. Помогает поддерживать чистоту на сервере.',
        recommended: '180–600 секунд',
        type: 'int',
        range: '60-1200'
    },
    'FlagRefreshFrequency': {
        category: 'flags',
        label: 'Частота обновления флага',
        description: 'Частота обновления защиты флага (в секундах). 432000 сек = 5 суток.',
        effect: 'Определяет, как часто флаг (на базе) "обновляется" для поддержания зоны защиты. После этого времени защита может ослабнуть.',
        recommended: '432000 (5 дней) — стандарт для DayZ',
        type: 'int',
        range: '86400-604800'
    },
    'FlagRefreshMaxDuration': {
        category: 'flags',
        label: 'Максимальное время защиты флага',
        description: 'Максимальное время, в течение которого флаг может поддерживать защиту без обновления. 3456000 сек = 40 суток.',
        effect: 'Если игроки не обновляют флаг в течение указанного времени, защита базы снимается полностью.',
        recommended: '3456000 (40 дней) — стандарт',
        type: 'int',
        range: '604800-15552000'
    },
    'FoodDecay': {
        category: 'other',
        label: 'Порча еды',
        description: 'Включает/выключает порчу еды. 1 — включено, 0 — выключено.',
        effect: 'Еда начинает портиться со временем (гнить), что делает выживание сложнее и реалистичнее.',
        recommended: '1 (включено) для хардкорных серверов, 0 для упрощённых',
        type: 'int',
        range: '0-1'
    },
    'IdleModeCountdown': {
        category: 'time',
        label: 'Таймер режима ожидания',
        description: 'Время в секундах бездействия сервера перед переходом в режим ожидания (Idle Mode).',
        effect: 'Если на сервере нет игроков, он переходит в режим ожидания через указанное время для экономии ресурсов.',
        recommended: '30–120 секунд',
        type: 'int',
        range: '10-600'
    },
    'IdleModeStartup': {
        category: 'time',
        label: 'Режим ожидания при старте',
        description: 'Включение режима ожидания при запуске сервера. 1 — включен, 0 — выключен.',
        effect: 'Сервер запускается в режиме ожидания, пока не появится первый игрок.',
        recommended: '1 (включено)',
        type: 'int',
        range: '0-1'
    },
    'InitialSpawn': {
        category: 'spawn',
        label: 'Начальный спавн',
        description: 'Количество предметов, которые появляются при первом запуске карты (при инициализации).',
        effect: 'Определяет, сколько лута будет на карте при первом старте. Влияет на начальную наполненность сервера.',
        recommended: '50-200',
        type: 'int',
        range: '10-500'
    },
    'LootDamageMax': {
        category: 'loot',
        label: 'Максимальный урон лута',
        description: 'Максимальный уровень повреждения, который может быть у предмета при спавне (0.82 = 82%).',
        effect: 'Определяет, насколько повреждёнными могут быть предметы при появлении. Чем выше значение, тем более сломанные предметы спавнятся.',
        recommended: '0.6–0.9',
        type: 'float',
        range: '0.0-1.0'
    },
    'LootDamageMin': {
        category: 'loot',
        label: 'Минимальный урон лута',
        description: 'Минимальный уровень повреждения, который может быть у предмета при спавне (0.0 = 0%).',
        effect: 'Определяет, насколько целыми могут быть предметы при появлении. 0.0 означает, что предметы могут спавниться в идеальном состоянии.',
        recommended: '0.0–0.3',
        type: 'float',
        range: '0.0-0.5'
    },
    'LootProxyPlacement': {
        category: 'loot',
        label: 'Размещение прокси-лута',
        description: 'Включает/выключает размещение лута через прокси-объекты. 1 — включено, 0 — выключено.',
        effect: 'Определяет, будут ли предметы появляться внутри контейнеров и зданий через прокси-систему.',
        recommended: '1 (включено)',
        type: 'int',
        range: '0-1'
    },
    'LootSpawnAvoidance': {
        category: 'spawn',
        label: 'Дистанция спавна лута от игроков',
        description: 'Расстояние в метрах, на котором лут не спавнится рядом с игроком.',
        effect: 'Предотвращает появление лута прямо перед игроком. Чем больше значение, тем дальше от игрока появляется лут.',
        recommended: '50–200 метров',
        type: 'int',
        range: '10-500'
    },
    'RespawnAttempt': {
        category: 'spawn',
        label: 'Попытки респавна',
        description: 'Количество попыток респавна предмета перед тем, как система переключится на другой тип.',
        effect: 'Влияет на то, как часто система пытается заспавнить предмет. Больше попыток = выше шанс появления.',
        recommended: '1–5',
        type: 'int',
        range: '1-20'
    },
    'RespawnLimit': {
        category: 'spawn',
        label: 'Лимит респавна',
        description: 'Максимальное количество предметов одного типа, которые могут быть на карте.',
        effect: 'Ограничивает количество одинаковых предметов на карте. Помогает избежать перенасыщения сервера однотипным лутом.',
        recommended: '10–50',
        type: 'int',
        range: '5-100'
    },
    'RespawnTypes': {
        category: 'spawn',
        label: 'Типы респавна',
        description: 'Количество различных типов предметов, которые могут респавниться одновременно.',
        effect: 'Определяет разнообразие лута на карте. Больше типов = разнообразнее лут.',
        recommended: '8–20',
        type: 'int',
        range: '4-50'
    },
    'RestartSpawn': {
        category: 'spawn',
        label: 'Респавн при рестарте',
        description: 'Количество предметов, которые респавнятся при перезапуске сервера. 0 — отключено.',
        effect: 'При перезапуске сервера добавляется указанное количество предметов. Может использоваться для "обновления" лута.',
        recommended: '0–50',
        type: 'int',
        range: '0-200'
    },
    'SpawnInitial': {
        category: 'spawn',
        label: 'Начальный спавн при старте',
        description: 'Количество предметов, которые спавнятся при каждом запуске сервера.',
        effect: 'При каждом старте сервера добавляется указанное количество предметов. Влияет на наполненность карты.',
        recommended: '500–2000',
        type: 'int',
        range: '100-5000'
    },
    'TimeHopping': {
        category: 'time',
        label: 'Прыжок времени',
        description: 'Время в секундах, через которое игра проверяет изменение времени.',
        effect: 'Частота обновления игрового времени. Влияет на то, как часто синхронизируется время на сервере.',
        recommended: '30–120 секунд',
        type: 'int',
        range: '10-300'
    },
    'TimeLogin': {
        category: 'time',
        label: 'Время входа',
        description: 'Время в секундах, которое даётся игроку на вход в сервер.',
        effect: 'Максимальное время на загрузку в сервер. Если превышено — игрок получает ошибку.',
        recommended: '15–60 секунд',
        type: 'int',
        range: '5-120'
    },
    'TimeLogout': {
        category: 'time',
        label: 'Время выхода',
        description: 'Время в секундах, которое даётся игроку на выход из сервера (игрок остаётся в мире).',
        effect: 'Защищает от "логаута" в бою. Игрок остаётся в мире указанное время после выхода.',
        recommended: '10–30 секунд',
        type: 'int',
        range: '5-60'
    },
    'TimePenalty': {
        category: 'time',
        label: 'Штраф времени',
        description: 'Время в секундах, которое добавляется к переподключению после частой смены серверов.',
        effect: 'Защита от "сервер-хоппинга" — частого переключения между серверами для сбора лута.',
        recommended: '10–60 секунд',
        type: 'int',
        range: '5-120'
    },
    'WorldWetTempUpdate': {
        category: 'other',
        label: 'Обновление влажности/температуры',
        description: 'Частота обновления глобальной влажности и температуры мира. 1 — включено, 0 — выключено.',
        effect: 'Влияет на погодные условия и их влияние на игроков (замерзание, перегрев).',
        recommended: '1 (включено)',
        type: 'int',
        range: '0-1'
    },
    'ZombieMaxCount': {
        category: 'zombies',
        label: 'Максимум зомби',
        description: 'Максимальное количество зомби, которое может одновременно находиться на карте.',
        effect: 'Влияет на сложность игры. Больше зомби — сложнее выживание, но больше нагрузки на сервер.',
        recommended: '500–1500',
        type: 'int',
        range: '100-3000'
    },
    'ZoneSpawnDist': {
        category: 'spawn',
        label: 'Дистанция спавна в зоне',
        description: 'Расстояние в метрах, на котором предметы спавнятся в зонах (города, военные базы и т.д.).',
        effect: 'Определяет радиус, в котором появляется лут в зонах. Влияет на распределение лута по карте.',
        recommended: '100–500 метров',
        type: 'int',
        range: '50-1000'
    }
};

// ============================================
// КАТЕГОРИИ ПЕРЕМЕННЫХ
// ============================================

const GLOBALS_CATEGORIES = {
    all: 'Все',
    spawn: 'Спавн',
    cleanup: 'Очистка',
    loot: 'Лут',
    zombies: 'Зомби',
    animals: 'Животные',
    time: 'Время',
    flags: 'Флаги',
    other: 'Разное'
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initGlobalsEditor() {
    console.log('🌍 Инициализация редактора globals.xml');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadServerPath()
        .then(() => {
            console.log('✅ Путь к серверу загружен:', globalsState.serverPath);
            return loadMapName();
        })
        .then(() => {
            console.log('✅ Карта определена:', globalsState.mapName);
            return buildGlobalsPath();
        })
        .then(() => {
            console.log('✅ Путь к globals.xml:', globalsState.globalsPath);
            renderGlobalsEditor(container);
            return loadGlobalsConfig();
        })
        .catch((e) => {
            console.error('❌ Ошибка инициализации:', e);
            if (typeof notifications !== 'undefined') {
                notifications.error('Ошибка загрузки: ' + e.message);
            }
            renderGlobalsEditor(container);
            globalsState.config = null;
            renderGlobalsVariables();
        });
}

function loadServerPath() {
    return new Promise((resolve, reject) => {
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                if (settings.server_exe) {
                    const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
                    globalsState.serverPath = serverDir;
                    console.log(`📁 Путь к серверу: ${globalsState.serverPath}`);
                    resolve(globalsState.serverPath);
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
                globalsState.mapName = template;
                console.log(`📋 Загружена карта из состояния: ${globalsState.mapName}`);
                return;
            }
        }
        
        const configPath = globalsState.serverPath + '/serverDZ.cfg';
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath })
        });
        const data = await response.json();
        
        if (data.success && data.content) {
            const match = data.content.match(/template\s*=\s*"([^"]+)"/);
            if (match) {
                globalsState.mapName = match[1];
                console.log(`📋 Загружена карта из serverDZ.cfg: ${globalsState.mapName}`);
                return;
            }
        }
        
        globalsState.mapName = 'dayzOffline.chernarusplus';
        console.log(`📋 Используем дефолтную карту: ${globalsState.mapName}`);
        
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить карту:', e);
        globalsState.mapName = 'dayzOffline.chernarusplus';
    }
}

function buildGlobalsPath() {
    if (!globalsState.serverPath || !globalsState.mapName) {
        return Promise.reject(new Error('Путь к серверу или карта не определены'));
    }
    
    globalsState.globalsPath = `${globalsState.serverPath}/mpmissions/${globalsState.mapName}/db/globals.xml`;
    console.log(`📂 Путь к globals.xml: ${globalsState.globalsPath}`);
    return Promise.resolve(globalsState.globalsPath);
}

// ============================================
// ЗАГРУЗКА КОНФИГА
// ============================================

async function loadGlobalsConfig() {
    if (!globalsState.globalsPath) {
        console.warn('⚠️ Путь к globals.xml не загружен');
        return;
    }
    
    globalsState.isLoading = true;
    updateGlobalsStatus('⏳ Загрузка globals.xml...');
    
    try {
        console.log(`📂 Загрузка: ${globalsState.globalsPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: globalsState.globalsPath })
        });
        const data = await response.json();
        
        console.log('📄 Ответ сервера:', data.success ? 'success' : 'error');
        
        if (data.success && data.content) {
            globalsState.rawContent = data.content;
            globalsState.originalContent = data.content;
            
            const parsed = parseGlobalsXml(data.content);
            globalsState.variables = parsed.variables || [];
            console.log(`✅ globals.xml загружен (${globalsState.variables.length} переменных)`);
            
            updateGlobalsStatus(`✅ Загружено ${globalsState.variables.length} переменных`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success(`globals.xml загружен (${globalsState.variables.length} переменных)`);
            }
            
            renderGlobalsVariables();
            return;
        }
        
        console.warn('⚠️ globals.xml не найден или пуст');
        globalsState.variables = [];
        updateGlobalsStatus('⚠️ Файл не найден');
        
        if (typeof notifications !== 'undefined') {
            notifications.warning('globals.xml не найден');
        }
        
        renderGlobalsVariables();
        
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        globalsState.variables = [];
        updateGlobalsStatus('❌ Ошибка загрузки');
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки globals.xml');
        }
        renderGlobalsVariables();
    }
    
    globalsState.isLoading = false;
}

// ============================================
// ПАРСИНГ XML
// ============================================

function parseGlobalsXml(content) {
    console.log('🔍 Парсинг globals.xml...');
    
    const variables = [];
    
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('❌ Ошибка парсинга XML:', parserError.textContent);
            return { variables: [] };
        }
        
        const varNodes = xmlDoc.getElementsByTagName('var');
        console.log(`📋 Найдено ${varNodes.length} элементов <var>`);
        
        for (let i = 0; i < varNodes.length; i++) {
            const node = varNodes[i];
            const name = node.getAttribute('name');
            const type = node.getAttribute('type');
            const value = node.getAttribute('value');
            
            if (!name) continue;
            
            const knowledge = GLOBALS_KNOWLEDGE[name] || null;
            const category = knowledge ? knowledge.category : detectCategory(name);
            
            variables.push({
                name: name,
                type: type || '0',
                value: value || '0',
                category: category,
                displayValue: formatValue(value, type),
                knowledge: knowledge
            });
        }
        
        console.log(`✅ Успешно спарсено ${variables.length} переменных`);
        
    } catch (e) {
        console.error('❌ Ошибка парсинга XML:', e);
        return { variables: [] };
    }
    
    return { variables: variables };
}

function detectCategory(name) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('spawn') || nameLower.includes('spawn')) return 'spawn';
    if (nameLower.includes('cleanup')) return 'cleanup';
    if (nameLower.includes('loot')) return 'loot';
    if (nameLower.includes('zombie') || nameLower.includes('infected')) return 'zombies';
    if (nameLower.includes('animal')) return 'animals';
    if (nameLower.includes('time')) return 'time';
    if (nameLower.includes('flag')) return 'flags';
    
    return 'other';
}

function formatValue(value, type) {
    if (type === '1') {
        return parseFloat(value).toFixed(2);
    }
    return value;
}

// ============================================
// СОХРАНЕНИЕ
// ============================================

async function saveGlobalsConfig() {
    if (!globalsState.globalsPath) {
        console.error('❌ Путь к globals.xml не загружен');
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к globals.xml не загружен');
        }
        return false;
    }
    
    updateGlobalsStatus('⏳ Сохранение...');
    
    try {
        const content = generateGlobalsXml(globalsState.variables);
        
        const response = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: globalsState.globalsPath, content: content })
        });
        const data = await response.json();
        
        if (data.success) {
            globalsState.isDirty = false;
            globalsState.originalContent = content;
            updateGlobalsStatus(`✅ Сохранено (${globalsState.variables.length} переменных)`);
            
            if (typeof notifications !== 'undefined') {
                notifications.success('globals.xml сохранён');
            }
            return true;
        } else {
            throw new Error(data.message || 'Ошибка сохранения');
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        updateGlobalsStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сохранения: ' + e.message);
        }
        return false;
    }
}

// ============================================
// ГЕНЕРАЦИЯ XML
// ============================================

function generateGlobalsXml(variables) {
    let lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
    lines.push('<variables>');
    
    for (const v of variables) {
        lines.push(`    <var name="${v.name}" type="${v.type || '0'}" value="${v.value}"/>`);
    }
    
    lines.push('</variables>');
    return lines.join('\n');
}

// ============================================
// ОБНОВЛЕНИЕ СТАТУСА
// ============================================

function updateGlobalsStatus(message) {
    const statusEl = document.getElementById('globalsStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'globals-status';
        
        if (message.includes('⚠️')) statusEl.classList.add('warning');
        else if (message.includes('❌')) statusEl.classList.add('error');
        else if (message.includes('✅')) statusEl.classList.add('success');
        else if (message.includes('⏳')) statusEl.classList.add('loading');
    }
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА
// ============================================

function renderGlobalsEditor(container) {
    container.innerHTML = `
        <div class="globals-editor">
            <button class="globals-back-btn" onclick="globalsBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <div class="globals-header">
                <div class="globals-header-info">
                    <span class="globals-header-icon">🌍</span>
                    <div>
                        <h2 class="globals-header-title">Редактор globals.xml</h2>
                        <p class="globals-header-subtitle">Глобальные переменные сервера для карты <strong>${globalsState.mapName || 'не определена'}</strong></p>
                    </div>
                </div>
                <div class="globals-header-actions">
                    <button class="btn btn-primary" onclick="saveGlobalsConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Сохранить
                    </button>
                    <button class="btn btn-secondary" onclick="loadGlobalsConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                        </svg>
                        Перезагрузить
                    </button>
                    <button class="btn btn-secondary" onclick="globalsOpenRaw()" title="Редактировать как текст">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12,2 2,7 12,12 22,7 12,2"/>
                            <polyline points="2,17 12,22 22,17"/>
                            <polyline points="2,12 12,17 22,12"/>
                        </svg>
                        RAW
                    </button>
                </div>
            </div>

            <div class="globals-status-bar">
                <span class="globals-status" id="globalsStatus">✅ Готово</span>
                <span class="globals-path">${globalsState.globalsPath || 'Путь не указан'}</span>
            </div>

            <!-- СПИСОК ПЕРЕМЕННЫХ -->
            <div class="globals-list-wrapper">
                <div class="globals-list-container">
                    <div class="globals-list-header">
                        <h3>Переменные (${globalsState.variables?.length || 0})</h3>
                        <button class="btn btn-primary btn-sm" onclick="globalsAddVariable()" title="Добавить переменную">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="globals-search">
                        <input type="text" id="globalsSearch" placeholder="🔍 Поиск переменной..." 
                               oninput="globalsFilterVariables()" class="globals-search-input">
                        <select id="globalsCategoryFilter" onchange="globalsFilterVariables()" class="globals-filter-select">
                            ${Object.entries(GLOBALS_CATEGORIES).map(([key, label]) => 
                                `<option value="${key}" ${key === globalsState.currentCategory ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="globals-variables-list" id="globalsVariablesList">
                        <div class="globals-loading">
                            <span class="spinner"></span>
                            Загрузка...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (globalsState.variables && globalsState.variables.length > 0) {
        renderGlobalsVariables();
    }
    
    setTimeout(createGlobalsScrollTopButton, 300);
}

// ============================================
// ОТРИСОВКА СПИСКА ПЕРЕМЕННЫХ
// ============================================

function renderGlobalsVariables() {
    const container = document.getElementById('globalsVariablesList');
    if (!container) return;
    
    const variables = globalsState.variables || [];
    const searchTerm = globalsState.searchTerm.toLowerCase().trim();
    const category = globalsState.currentCategory;
    
    let filtered = variables;
    
    if (searchTerm) {
        filtered = filtered.filter(v => 
            v.name.toLowerCase().includes(searchTerm) ||
            v.value.toLowerCase().includes(searchTerm) ||
            (GLOBALS_KNOWLEDGE[v.name] && GLOBALS_KNOWLEDGE[v.name].label.toLowerCase().includes(searchTerm))
        );
    }
    
    if (category !== 'all') {
        filtered = filtered.filter(v => v.category === category);
    }
    
    globalsState.filteredVariables = filtered;
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="globals-empty-list">
                <span class="globals-empty-icon">📭</span>
                <p>${variables.length === 0 ? 'Нет переменных' : 'Ничего не найдено'}</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach((v, index) => {
        const categoryLabel = GLOBALS_CATEGORIES[v.category] || 'Разное';
        const typeLabel = v.type === '1' ? 'float' : 'int';
        const knowledge = GLOBALS_KNOWLEDGE[v.name];
        const shortDesc = knowledge ? knowledge.label : '—';
        const hasInfo = knowledge !== undefined;
        
        html += `
            <div class="globals-item" onclick="globalsOpenVariableModal(${index})">
                <div class="globals-item-info">
                    <span class="globals-item-name">${v.name}</span>
                    ${hasInfo ? `<span class="globals-item-has-info" title="Есть описание">📖</span>` : ''}
                    <span class="globals-item-short-desc">${shortDesc}</span>
                </div>
                <div class="globals-item-details">
                    <span class="globals-item-category ${v.category}">${categoryLabel}</span>
                    <span class="globals-item-value">${v.value}</span>
                    <span class="globals-item-type">${typeLabel}</span>
                </div>
                <div class="globals-item-actions">
                    <button class="globals-item-delete" onclick="event.stopPropagation(); globalsConfirmDeleteVariable(${index})" title="Удалить переменную">
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

function globalsFilterVariables() {
    const search = document.getElementById('globalsSearch');
    const filter = document.getElementById('globalsCategoryFilter');
    
    if (search) globalsState.searchTerm = search.value;
    if (filter) globalsState.currentCategory = filter.value;
    
    renderGlobalsVariables();
}

// ============================================
// ПОЛУЧИТЬ HTML ОПИСАНИЯ ПАРАМЕТРА
// ============================================

function getGlobalsDescriptionHtml(variable) {
    const knowledge = GLOBALS_KNOWLEDGE[variable.name];
    
    if (!knowledge) {
        return `
            <div class="globals-knowledge-placeholder">
                <p>ℹ️ Информация об этом параметре отсутствует в базе знаний.</p>
                <p class="globals-knowledge-hint">Вы можете добавить описание самостоятельно в файле GLOBALS_KNOWLEDGE.</p>
            </div>
        `;
    }
    
    const categoryLabel = GLOBALS_CATEGORIES[knowledge.category] || 'Разное';
    const typeLabel = variable.type === '1' ? 'Число с плавающей точкой (float)' : 'Целое число (int)';
    
    return `
        <div class="globals-knowledge-section">
            <div class="globals-knowledge-header">
                <span class="globals-knowledge-category ${knowledge.category}">${categoryLabel}</span>
                <span class="globals-knowledge-type">${typeLabel}</span>
            </div>
            
            <div class="globals-knowledge-field">
                <label>📌 Что это?</label>
                <p>${knowledge.description}</p>
            </div>
            
            <div class="globals-knowledge-field">
                <label>⚡ Влияние на игру</label>
                <p>${knowledge.effect}</p>
            </div>
            
            <div class="globals-knowledge-row">
                <div class="globals-knowledge-field half">
                    <label>🎯 Рекомендуемое значение</label>
                    <p><strong>${knowledge.recommended}</strong></p>
                </div>
                <div class="globals-knowledge-field half">
                    <label>📊 Диапазон</label>
                    <p>${knowledge.range || 'Не указан'}</p>
                </div>
            </div>
            
            <div class="globals-knowledge-current">
                <label>📝 Текущее значение</label>
                <p><strong>${variable.value}</strong></p>
            </div>
        </div>
    `;
}

// ============================================
// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА С НАСТРОЙКАМИ
// ============================================

function globalsOpenVariableModal(index) {
    const v = globalsState.variables?.[index];
    if (!v) return;
    
    globalsState.selectedVariable = index;
    
    const oldModal = document.getElementById('globalsVariableModal');
    if (oldModal) {
        oldModal.remove();
    }
    
    const categoryOptions = Object.entries(GLOBALS_CATEGORIES)
        .filter(([key]) => key !== 'all')
        .map(([key, label]) => 
            `<option value="${key}" ${v.category === key ? 'selected' : ''}>${label}</option>`
        ).join('');
    
    const knowledgeHtml = getGlobalsDescriptionHtml(v);
    
    const modal = document.createElement('div');
    modal.id = 'globalsVariableModal';
    modal.className = 'modal-overlay globals-variable-modal';
    modal.innerHTML = `
        <div class="modal-content globals-modal-content">
            <div class="modal-header globals-modal-header">
                <h3>
                    <span class="globals-modal-icon">🌍</span>
                    ${v.name}
                </h3>
                <button class="modal-close" onclick="globalsCloseVariableModal()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body globals-modal-body">
                <!-- ОПИСАНИЕ ПАРАМЕТРА -->
                <div class="globals-knowledge-wrapper">
                    ${knowledgeHtml}
                </div>
                
                <!-- РЕДАКТИРОВАНИЕ -->
                <div class="globals-editor-form">
                    <div class="globals-form-section">
                        <h4>✏️ Редактирование</h4>
                        <div class="globals-form-group">
                            <label>Название (name)</label>
                            <input type="text" class="globals-input" value="${v.name || ''}" 
                                   onchange="globalsUpdateVariableField(${index}, 'name', this.value)">
                        </div>
                        <div class="globals-form-row">
                            <div class="globals-form-group">
                                <label>Значение (value)</label>
                                <input type="text" class="globals-input" value="${v.value || '0'}" 
                                       onchange="globalsUpdateVariableField(${index}, 'value', this.value)">
                            </div>
                            <div class="globals-form-group">
                                <label>Тип (type)</label>
                                <select class="globals-select" onchange="globalsUpdateVariableField(${index}, 'type', this.value)">
                                    <option value="0" ${v.type === '0' ? 'selected' : ''}>Целое число (int)</option>
                                    <option value="1" ${v.type === '1' ? 'selected' : ''}>Число с плавающей точкой (float)</option>
                                </select>
                            </div>
                        </div>
                        <div class="globals-form-group">
                            <label>Категория</label>
                            <select class="globals-select" onchange="globalsUpdateVariableField(${index}, 'category', this.value)">
                                ${categoryOptions}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer globals-modal-footer">
                <button class="btn btn-secondary" onclick="globalsCloseVariableModal()">Закрыть</button>
                <button class="btn btn-primary" onclick="globalsCloseVariableModal(); saveGlobalsConfig();">
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
            globalsCloseVariableModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            globalsCloseVariableModal();
        }
    });
}

function globalsCloseVariableModal() {
    const modal = document.getElementById('globalsVariableModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ============================================
// ОБНОВЛЕНИЕ ПОЛЯ ПЕРЕМЕННОЙ
// ============================================

function globalsUpdateVariableField(index, field, value) {
    if (!globalsState.variables?.[index]) return;
    globalsState.variables[index][field] = value;
    globalsState.isDirty = true;
    updateGlobalsStatus('⚠️ Есть несохранённые изменения');
    renderGlobalsVariables();
}

// ============================================
// ДОБАВЛЕНИЕ/УДАЛЕНИЕ ПЕРЕМЕННОЙ
// ============================================

function globalsAddVariable() {
    if (!globalsState.variables) globalsState.variables = [];
    
    const newVar = {
        name: `NewVar_${globalsState.variables.length + 1}`,
        type: '0',
        value: '0',
        category: 'other',
        knowledge: null
    };
    
    globalsState.variables.push(newVar);
    globalsState.isDirty = true;
    updateGlobalsStatus('⚠️ Есть несохранённые изменения');
    
    renderGlobalsVariables();
    globalsOpenVariableModal(globalsState.variables.length - 1);
    
    if (typeof notifications !== 'undefined') {
        notifications.success(`Добавлена переменная: ${newVar.name}`);
    }
}

function globalsConfirmDeleteVariable(index) {
    const v = globalsState.variables?.[index];
    if (!v) return;
    
    globalsCloseVariableModal();
    
    if (typeof mpgShowConfirmModal !== 'undefined') {
        mpgShowConfirmModal(
            'Удаление переменной',
            `Вы уверены, что хотите удалить "<strong>${v.name}</strong>"?<br>Это действие нельзя отменить.`,
            function() {
                globalsExecuteDeleteVariable(index);
            },
            function() {}
        );
    } else {
        if (confirm(`Удалить переменную "${v.name}"?`)) {
            globalsExecuteDeleteVariable(index);
        }
    }
}

function globalsExecuteDeleteVariable(index) {
    const v = globalsState.variables?.[index];
    if (!v) return;
    
    const name = v.name;
    
    globalsState.variables.splice(index, 1);
    if (globalsState.selectedVariable === index) {
        globalsState.selectedVariable = null;
    } else if (globalsState.selectedVariable > index) {
        globalsState.selectedVariable--;
    }
    globalsState.isDirty = true;
    
    renderGlobalsVariables();
    updateGlobalsStatus('⚠️ Есть несохранённые изменения');
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`Удалена переменная: ${name}`);
    }
}

// ============================================
// RAW РЕДАКТОР
// ============================================

function globalsOpenRaw() {
    const content = generateGlobalsXml(globalsState.variables);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay globals-raw-modal';
    modal.id = 'globalsRawModal';
    modal.innerHTML = `
        <div class="modal-content modal-confirm" style="max-width:800px;width:90%;">
            <div class="modal-confirm-header">
                <div class="modal-confirm-icon">📝</div>
                <h3>RAW редактор globals.xml</h3>
            </div>
            <div class="modal-body" style="padding:16px 20px;">
                <textarea id="globalsRawTextarea" style="width:100%;min-height:400px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e5;font-family:'Courier New',monospace;font-size:0.8rem;padding:12px;resize:vertical;outline:none;box-sizing:border-box;">${content}</textarea>
            </div>
            <div class="modal-footer" style="padding:12px 20px;border-top:1px solid rgba(255,255,255,0.04);display:flex;justify-content:flex-end;gap:10px;">
                <button class="btn btn-secondary" onclick="globalsCloseRaw()">Отмена</button>
                <button class="btn btn-primary" onclick="globalsApplyRaw()">Применить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function globalsCloseRaw() {
    const modal = document.getElementById('globalsRawModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function globalsApplyRaw() {
    const textarea = document.getElementById('globalsRawTextarea');
    if (!textarea) return;
    
    try {
        const content = textarea.value;
        const parsed = parseGlobalsXml(content);
        globalsState.variables = parsed.variables || [];
        globalsState.isDirty = true;
        updateGlobalsStatus('⚠️ Есть несохранённые изменения');
        renderGlobalsVariables();
        globalsCloseRaw();
        
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

function globalsBackToTiles() {
    destroyGlobalsScrollTopButton();
    globalsCloseVariableModal();
    
    if (globalsState.isDirty) {
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

let globalsScrollTopBtn = null;
let globalsScrollTimer = null;

function createGlobalsScrollTopButton() {
    const oldBtn = document.getElementById('globalsScrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        globalsScrollTopBtn = null;
    }
    
    if (globalsScrollTimer) {
        clearInterval(globalsScrollTimer);
        globalsScrollTimer = null;
    }
    
    globalsScrollTopBtn = document.createElement('button');
    globalsScrollTopBtn.id = 'globalsScrollTopBtn';
    globalsScrollTopBtn.className = 'scroll-top-btn';
    globalsScrollTopBtn.innerHTML = '↑';
    globalsScrollTopBtn.title = 'Наверх';
    
    let isScrolling = false;
    
    globalsScrollTopBtn.addEventListener('click', function(e) {
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
    
    document.body.appendChild(globalsScrollTopBtn);
    console.log('✅ Кнопка "Наверх" для globals.xml создана');
    
    globalsScrollTimer = setInterval(function() {
        checkGlobalsScroll();
    }, 300);
    
    setTimeout(checkGlobalsScroll, 200);
}

function checkGlobalsScroll() {
    if (!globalsScrollTopBtn) return;
    
    const contentArea = document.getElementById('contentArea');
    let hasScroll = false;
    
    if (contentArea) {
        const scrollContainer = contentArea.querySelector('div:first-child');
        if (scrollContainer && scrollContainer.scrollTop > 50) {
            hasScroll = true;
        }
    }
    
    if (hasScroll) {
        globalsScrollTopBtn.classList.add('visible');
    } else {
        globalsScrollTopBtn.classList.remove('visible');
    }
}

function destroyGlobalsScrollTopButton() {
    if (globalsScrollTimer) {
        clearInterval(globalsScrollTimer);
        globalsScrollTimer = null;
    }
    
    const btn = document.getElementById('globalsScrollTopBtn');
    if (btn) {
        btn.remove();
        globalsScrollTopBtn = null;
    }
}

// ============================================
// ЭКСПОРТ
// ============================================

window.initGlobalsEditor = initGlobalsEditor;
window.saveGlobalsConfig = saveGlobalsConfig;
window.loadGlobalsConfig = loadGlobalsConfig;
window.globalsBackToTiles = globalsBackToTiles;
window.globalsFilterVariables = globalsFilterVariables;
window.globalsAddVariable = globalsAddVariable;
window.globalsConfirmDeleteVariable = globalsConfirmDeleteVariable;
window.globalsUpdateVariableField = globalsUpdateVariableField;
window.globalsOpenRaw = globalsOpenRaw;
window.globalsCloseRaw = globalsCloseRaw;
window.globalsApplyRaw = globalsApplyRaw;
window.globalsOpenVariableModal = globalsOpenVariableModal;
window.globalsCloseVariableModal = globalsCloseVariableModal;

console.log('🌍 globals_editor.js загружен');