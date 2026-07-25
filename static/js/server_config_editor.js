// ============================================
// SERVER CONFIG EDITOR - РЕДАКТОР serverDZ.cfg
// ============================================

// ============================================
// СОСТОЯНИЕ РЕДАКТОРА
// ============================================

let serverConfigState = {
    config: null,
    serverPath: '',
    isLoading: false,
    isDirty: false,
    rawContent: '',
    originalContent: ''
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initServerConfigEditor() {
    console.log('⚙️ Инициализация редактора serverDZ.cfg');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadServerPath()
        .then(() => {
            console.log('✅ Путь к серверу загружен:', serverConfigState.serverPath);
            renderServerConfigEditor(container);
            return loadServerConfig();
        })
        .catch((e) => {
            console.error('❌ Ошибка инициализации:', e);
            if (typeof notifications !== 'undefined') {
                notifications.error('Ошибка загрузки: ' + e.message);
            }
            renderServerConfigEditor(container);
            serverConfigState.config = getDefaultServerConfig();
            renderServerConfigForm();
        });
}

function loadServerPath() {
    return new Promise((resolve, reject) => {
        fetch('/api/settings')
            .then(response => response.json())
            .then(settings => {
                console.log('📁 Настройки:', settings);
                
                if (settings.server_exe) {
                    const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
                    serverConfigState.serverPath = serverDir;
                    console.log(`📁 Путь к серверу: ${serverConfigState.serverPath}`);
                    resolve(serverConfigState.serverPath);
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

// ============================================
// ЗАГРУЗКА КОНФИГА
// ============================================

async function loadServerConfig() {
    if (!serverConfigState.serverPath) {
        console.warn('⚠️ Путь к серверу не загружен');
        await loadServerPath();
    }
    
    serverConfigState.isLoading = true;
    updateServerConfigStatus('⏳ Загрузка serverDZ.cfg...');
    
    try {
        const configPath = serverConfigState.serverPath + '/serverDZ.cfg';
        console.log(`📂 Загрузка конфига: ${configPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath })
        });
        const data = await response.json();
        
        console.log('📄 Ответ сервера:', data);
        
        // Сначала загружаем сохранённое состояние из server_config.json
        let savedState = {};
        try {
            const stateResponse = await fetch('/api/server/config/state');
            const stateData = await stateResponse.json();
            if (stateData.success && stateData.state) {
                savedState = stateData.state.serverDZ || {};
                console.log('📋 Загружено сохранённое состояние:', savedState);
            }
        } catch (e) {
            console.warn('⚠️ Не удалось загрузить сохранённое состояние:', e);
        }
        
        if (data.success && data.content) {
            serverConfigState.rawContent = data.content;
            serverConfigState.originalContent = data.content;
            
            // Парсим конфиг из файла
            const parsedConfig = parseServerConfig(data.content);
            
            // Применяем сохранённое состояние поверх (если есть)
            // Это гарантирует, что template и другие настройки сохранятся
            for (const [key, value] of Object.entries(savedState)) {
                if (parsedConfig[key] !== undefined) {
                    parsedConfig[key] = value;
                }
            }
            
            serverConfigState.config = parsedConfig;
            console.log('✅ serverDZ.cfg загружен');
            console.log('📋 Итоговый конфиг:', serverConfigState.config);
            updateServerConfigStatus('✅ Конфиг загружен');
            
            if (typeof notifications !== 'undefined') {
                notifications.success('serverDZ.cfg загружен');
            }
            
            renderServerConfigForm();
            return;
        }
        
        console.warn('⚠️ serverDZ.cfg не найден');
        
        // Если файла нет, используем сохранённое состояние или дефолт
        if (Object.keys(savedState).length > 0) {
            serverConfigState.config = savedState;
            console.log('📋 Используем сохранённое состояние:', savedState);
        } else {
            serverConfigState.config = getDefaultServerConfig();
            console.log('📋 Используем дефолтный конфиг');
        }
        
        updateServerConfigStatus('⚠️ Файл не найден, используется сохранённое состояние');
        
        if (typeof notifications !== 'undefined') {
            notifications.warning('serverDZ.cfg не найден');
        }
        
        renderServerConfigForm();
        
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        serverConfigState.config = getDefaultServerConfig();
        updateServerConfigStatus('❌ Ошибка загрузки');
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки serverDZ.cfg');
        }
        renderServerConfigForm();
    }
    
    serverConfigState.isLoading = false;
}
// ============================================
// ПАРСИНГ КОНФИГА (ИСПРАВЛЕННЫЙ)
// ============================================

function parseServerConfig(content) {
    console.log('🔍 Начинаем парсинг...');
    
    const config = getDefaultServerConfig();
    
    const lines = content.split('\n');
    let inMissions = false;
    
    for (const line of lines) {
        let trimmed = line.trim();
        
        if (!trimmed) continue;
        if (trimmed.startsWith('//')) continue;
        
        if (trimmed.includes('class Missions')) {
            inMissions = true;
            continue;
        }
        
        if (inMissions && trimmed.includes('template')) {
            const match = trimmed.match(/template\s*=\s*"([^"]+)"/);
            if (match) {
                config.template = match[1];
                console.log(`📁 Найден template: ${config.template}`);
            }
            continue;
        }
        
        if (inMissions && trimmed === '};') {
            inMissions = false;
            continue;
        }
        
        // Убираем комментарии в конце строки
        const commentIndex = trimmed.indexOf('//');
        if (commentIndex !== -1) {
            trimmed = trimmed.substring(0, commentIndex).trim();
        }
        
        if (!trimmed) continue;
        
        const match = trimmed.match(/^(\w+)\s*=\s*(.+?);?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2].trim();
            
            if (value.endsWith(';')) {
                value = value.slice(0, -1).trim();
            }
            
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            
            if (value === '0' || value === '1') {
                config[key] = parseInt(value);
            } else if (!isNaN(value) && value !== '') {
                if (value.includes('.')) {
                    config[key] = parseFloat(value);
                } else {
                    config[key] = parseInt(value);
                }
            } else {
                config[key] = value;
            }
            
            console.log(`📌 ${key} = ${config[key]} (${typeof config[key]})`);
        }
    }
    
    console.log('✅ Парсинг завершён');
    console.log('📋 Итоговый конфиг:', config);
    return config;
}

// ============================================
// ДЕФОЛТНЫЙ КОНФИГ
// ============================================

function getDefaultServerConfig() {
    return {
        hostname: 'DayZ Server',
        password: '',
        passwordAdmin: '',
        description: '',
        enableWhitelist: 0,
        maxPlayers: 60,
        verifySignatures: 2,
        forceSameBuild: 1,
        disableVoN: 0,
        vonCodecQuality: 20,
        shardId: '123abc',
        disable3rdPerson: 0,
        disableCrosshair: 0,
        disablePersonalLight: 1,
        lightingConfig: 0,
        serverTime: 'SystemTime',
        serverTimeAcceleration: 12,
        serverNightTimeAcceleration: 1,
        serverTimePersistent: 0,
        guaranteedUpdates: 1,
        loginQueueConcurrentPlayers: 5,
        loginQueueMaxPlayers: 500,
        instanceId: 1,
        storageAutoFix: 1,
        template: 'dayzOffline.chernarusplus'
    };
}

// ============================================
// ГЕНЕРАЦИЯ КОНФИГА
// ============================================

function generateServerConfig(config) {
    let lines = [];
    
    lines.push('// ============================================');
    lines.push('// DayZ Server Configuration');
    lines.push('// ============================================');
    lines.push('');
    lines.push('// ----- Основные настройки -----');
    
    const skipKeys = ['template'];
    
    for (const [key, value] of Object.entries(config)) {
        if (skipKeys.includes(key)) continue;
        
        let formattedValue = value;
        if (typeof value === 'string') {
            formattedValue = `"${value}"`;
        }
        lines.push(`${key} = ${formattedValue};`);
    }
    
    lines.push('');
    lines.push('// ----- Миссия -----');
    lines.push('class Missions');
    lines.push('{');
    lines.push('    class DayZ');
    lines.push('    {');
    lines.push(`        template="${config.template}";`);
    lines.push('    };');
    lines.push('};');
    
    return lines.join('\n');
}

// ============================================
// СОХРАНЕНИЕ КОНФИГА
// ============================================

async function saveServerConfig() {
    if (!serverConfigState.serverPath) {
        console.error('❌ Путь к серверу не загружен');
        if (typeof notifications !== 'undefined') {
            notifications.error('Путь к серверу не загружен');
        }
        return false;
    }
    
    updateServerConfigStatus('⏳ Сохранение...');
    
    try {
        const configPath = serverConfigState.serverPath + '/serverDZ.cfg';
        const content = generateServerConfig(serverConfigState.config);
        
        console.log('💾 Сохранение в:', configPath);
        console.log('📄 Сохраняемый конфиг:', serverConfigState.config);
        
        // 1. Сохраняем serverDZ.cfg
        const response = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath, content: content })
        });
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Ошибка сохранения файла');
        }
        
        // 2. Сохраняем состояние в server_config.json (включая template)
        try {
            // Загружаем текущее состояние
            const stateResponse = await fetch('/api/server/config/state');
            const stateData = await stateResponse.json();
            let currentState = stateData.success ? stateData.state : {};
            
            // Обновляем serverDZ часть
            if (!currentState.serverDZ) {
                currentState.serverDZ = {};
            }
            
            // Копируем все настройки из конфига в состояние
            for (const [key, value] of Object.entries(serverConfigState.config)) {
                currentState.serverDZ[key] = value;
            }
            
            console.log('💾 Сохраняем состояние:', currentState.serverDZ);
            
            // Сохраняем обновлённое состояние
            await fetch('/api/server/config/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentState)
            });
            console.log('💾 Состояние сервера сохранено');
            
        } catch (e) {
            console.warn('⚠️ Не удалось сохранить состояние:', e);
        }
        
        serverConfigState.isDirty = false;
        serverConfigState.originalContent = content;
        updateServerConfigStatus('✅ Сохранено');
        
        if (typeof notifications !== 'undefined') {
            notifications.success('serverDZ.cfg сохранён');
        }
        return true;
        
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        updateServerConfigStatus('❌ Ошибка: ' + e.message);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка сохранения: ' + e.message);
        }
        return false;
    }
}
// ============================================
// ОБНОВЛЕНИЕ СТАТУСА
// ============================================

function updateServerConfigStatus(message) {
    const statusEl = document.getElementById('serverConfigStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'server-config-status';
        
        if (message.includes('⚠️')) statusEl.classList.add('warning');
        else if (message.includes('❌')) statusEl.classList.add('error');
        else if (message.includes('✅')) statusEl.classList.add('success');
        else if (message.includes('⏳')) statusEl.classList.add('loading');
    }
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА
// ============================================

function renderServerConfigEditor(container) {
    container.innerHTML = `
        <div class="server-config-editor">
            <button class="server-config-back-btn" onclick="serverConfigBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <div class="server-config-header">
                <div class="server-config-header-info">
                    <span class="server-config-header-icon">⚙️</span>
                    <div>
                        <h2 class="server-config-header-title">Редактор serverDZ.cfg</h2>
                        <p class="server-config-header-subtitle">Основной конфигурационный файл сервера DayZ</p>
                    </div>
                </div>
                <div class="server-config-header-actions">
                    <button class="btn btn-primary" onclick="saveServerConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Сохранить
                    </button>
                    <button class="btn btn-secondary" onclick="loadServerConfig()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23,4 23,10 17,10"/>
                            <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                            <polyline points="1,20 1,14 7,14"/>
                            <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                        </svg>
                        Перезагрузить
                    </button>
                    <button class="btn btn-secondary" onclick="serverConfigOpenRaw()" title="Редактировать как текст">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12,2 2,7 12,12 22,7 12,2"/>
                            <polyline points="2,17 12,22 22,17"/>
                            <polyline points="2,12 12,17 22,12"/>
                        </svg>
                        RAW
                    </button>
                </div>
            </div>

            <div class="server-config-status-bar">
                <span class="server-config-status" id="serverConfigStatus">✅ Готово</span>
                <span class="server-config-path">${serverConfigState.serverPath || 'Путь не указан'}</span>
            </div>

            <div class="server-config-tabs">
                <button class="server-config-tab active" onclick="serverConfigSwitchTab('basic')">
                    <span class="server-config-tab-icon">📋</span>
                    Основные
                </button>
                <button class="server-config-tab" onclick="serverConfigSwitchTab('gameplay')">
                    <span class="server-config-tab-icon">🎮</span>
                    Геймплей
                </button>
                <button class="server-config-tab" onclick="serverConfigSwitchTab('time')">
                    <span class="server-config-tab-icon">⏰</span>
                    Время
                </button>
                <button class="server-config-tab" onclick="serverConfigSwitchTab('network')">
                    <span class="server-config-tab-icon">🌐</span>
                    Сеть
                </button>
                <button class="server-config-tab" onclick="serverConfigSwitchTab('mission')">
                    <span class="server-config-tab-icon">📁</span>
                    Миссия
                </button>
            </div>

            <div class="server-config-body">
                <div class="server-config-tab-content active" id="serverConfigTabBasic">
                    ${renderBasicSettings()}
                </div>
                <div class="server-config-tab-content" id="serverConfigTabGameplay">
                    ${renderGameplaySettings()}
                </div>
                <div class="server-config-tab-content" id="serverConfigTabTime">
                    ${renderTimeSettings()}
                </div>
                <div class="server-config-tab-content" id="serverConfigTabNetwork">
                    ${renderNetworkSettings()}
                </div>
                <div class="server-config-tab-content" id="serverConfigTabMission">
                    ${renderMissionSettings()}
                </div>
            </div>
        </div>
    `;
    
    setTimeout(createServerConfigScrollTopButton, 300);
}

// ============================================
// ОТРИСОВКА НАСТРОЕК
// ============================================

function renderBasicSettings() {
    const c = serverConfigState.config || getDefaultServerConfig();
    
    return `
        <div class="server-config-section">
            <h4>Основные настройки сервера</h4>
            
            <div class="server-config-form-group">
                <label>Название сервера (hostname)</label>
                <input type="text" class="server-config-input" value="${c.hostname || ''}" 
                       onchange="serverConfigUpdateField('hostname', this.value)">
                <span class="server-config-hint">Имя, которое видят игроки в браузере серверов</span>
            </div>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Пароль для входа</label>
                    <input type="text" class="server-config-input" value="${c.password || ''}" 
                           onchange="serverConfigUpdateField('password', this.value)">
                    <span class="server-config-hint">Оставьте пустым для открытого сервера</span>
                </div>
                <div class="server-config-form-group">
                    <label>Admin пароль</label>
                    <input type="text" class="server-config-input" value="${c.passwordAdmin || ''}" 
                           onchange="serverConfigUpdateField('passwordAdmin', this.value)">
                    <span class="server-config-hint">Пароль для доступа к админ-командам</span>
                </div>
            </div>
            
            <div class="server-config-form-group">
                <label>Описание сервера</label>
                <textarea class="server-config-textarea" rows="2" 
                          onchange="serverConfigUpdateField('description', this.value)">${c.description || ''}</textarea>
                <span class="server-config-hint">Отображается в браузере серверов</span>
            </div>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Максимум игроков</label>
                    <input type="number" class="server-config-input" value="${c.maxPlayers || 60}" 
                           onchange="serverConfigUpdateField('maxPlayers', parseInt(this.value) || 60)"
                           min="1" max="128">
                </div>
                <div class="server-config-form-group">
                    <label>Instance ID</label>
                    <input type="number" class="server-config-input" value="${c.instanceId || 1}" 
                           onchange="serverConfigUpdateField('instanceId', parseInt(this.value) || 1)"
                           min="1">
                    <span class="server-config-hint">Идентификатор для папок с сохранениями</span>
                </div>
            </div>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Whitelist</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('enableWhitelist', parseInt(this.value))">
                        <option value="0" ${c.enableWhitelist === 0 ? 'selected' : ''}>Выключен</option>
                        <option value="1" ${c.enableWhitelist === 1 ? 'selected' : ''}>Включен</option>
                    </select>
                    <span class="server-config-hint">Разрешать вход только по белым спискам</span>
                </div>
                <div class="server-config-form-group">
                    <label>AutoFix хранилища</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('storageAutoFix', parseInt(this.value))">
                        <option value="0" ${c.storageAutoFix === 0 ? 'selected' : ''}>Выключен</option>
                        <option value="1" ${c.storageAutoFix === 1 ? 'selected' : ''}>Включен</option>
                    </select>
                    <span class="server-config-hint">Автоматически исправлять повреждённые файлы сохранений</span>
                </div>
            </div>
        </div>
    `;
}

function renderGameplaySettings() {
    const c = serverConfigState.config || getDefaultServerConfig();
    
    return `
        <div class="server-config-section">
            <h4>Настройки геймплея</h4>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Отключить 3-е лицо</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('disable3rdPerson', parseInt(this.value))">
                        <option value="0" ${c.disable3rdPerson === 0 ? 'selected' : ''}>Нет (разрешено)</option>
                        <option value="1" ${c.disable3rdPerson === 1 ? 'selected' : ''}>Да (запрещено)</option>
                    </select>
                </div>
                <div class="server-config-form-group">
                    <label>Отключить прицел</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('disableCrosshair', parseInt(this.value))">
                        <option value="0" ${c.disableCrosshair === 0 ? 'selected' : ''}>Нет (разрешен)</option>
                        <option value="1" ${c.disableCrosshair === 1 ? 'selected' : ''}>Да (запрещен)</option>
                    </select>
                </div>
            </div>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Отключить персональный свет</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('disablePersonalLight', parseInt(this.value))">
                        <option value="0" ${c.disablePersonalLight === 0 ? 'selected' : ''}>Нет (разрешен)</option>
                        <option value="1" ${c.disablePersonalLight === 1 ? 'selected' : ''}>Да (запрещен)</option>
                    </select>
                    <span class="server-config-hint">Отключает фонарик/свет у игроков</span>
                </div>
                <div class="server-config-form-group">
                    <label>Освещение ночью</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('lightingConfig', parseInt(this.value))">
                        <option value="0" ${c.lightingConfig === 0 ? 'selected' : ''}>Светлее</option>
                        <option value="1" ${c.lightingConfig === 1 ? 'selected' : ''}>Темнее</option>
                    </select>
                </div>
            </div>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Отключить голосовой чат</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('disableVoN', parseInt(this.value))">
                        <option value="0" ${c.disableVoN === 0 ? 'selected' : ''}>Нет (разрешен)</option>
                        <option value="1" ${c.disableVoN === 1 ? 'selected' : ''}>Да (запрещен)</option>
                    </select>
                </div>
                <div class="server-config-form-group">
                    <label>Качество голоса</label>
                    <input type="number" class="server-config-input" value="${c.vonCodecQuality || 20}" 
                           onchange="serverConfigUpdateField('vonCodecQuality', parseInt(this.value) || 20)"
                           min="1" max="30">
                    <span class="server-config-hint">От 1 до 30, чем выше тем лучше</span>
                </div>
            </div>
        </div>
    `;
}

function renderTimeSettings() {
    const c = serverConfigState.config || getDefaultServerConfig();
    
    return `
        <div class="server-config-section">
            <h4>Настройки времени</h4>
            
            <div class="server-config-form-group">
                <label>Время на сервере</label>
                <input type="text" class="server-config-input" value="${c.serverTime || 'SystemTime'}" 
                       onchange="serverConfigUpdateField('serverTime', this.value)">
                <span class="server-config-hint">"SystemTime" - реальное время, или формат "YYYY/MM/DD/HH/MM"</span>
            </div>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Ускорение времени (день)</label>
                    <input type="number" class="server-config-input" value="${c.serverTimeAcceleration || 12}" 
                           onchange="serverConfigUpdateField('serverTimeAcceleration', parseInt(this.value) || 1)"
                           min="1" max="24">
                    <span class="server-config-hint">Множитель скорости времени (1-24)</span>
                </div>
                <div class="server-config-form-group">
                    <label>Ускорение времени (ночь)</label>
                    <input type="number" step="0.1" class="server-config-input" value="${c.serverNightTimeAcceleration || 1}" 
                           onchange="serverConfigUpdateField('serverNightTimeAcceleration', parseFloat(this.value) || 1)"
                           min="0.1" max="64">
                    <span class="server-config-hint">Множитель скорости ночи (0.1-64)</span>
                </div>
            </div>
            
            <div class="server-config-form-group">
                <label>Сохранять время</label>
                <select class="server-config-select" onchange="serverConfigUpdateField('serverTimePersistent', parseInt(this.value))">
                    <option value="0" ${c.serverTimePersistent === 0 ? 'selected' : ''}>Выключено</option>
                    <option value="1" ${c.serverTimePersistent === 1 ? 'selected' : ''}>Включено</option>
                </select>
                <span class="server-config-hint">Сохранять текущее время при перезапуске сервера</span>
            </div>
        </div>
    `;
}

function renderNetworkSettings() {
    const c = serverConfigState.config || getDefaultServerConfig();
    
    return `
        <div class="server-config-section">
            <h4>Сетевые настройки</h4>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Проверка подписей</label>
                    <input type="number" class="server-config-input" value="${c.verifySignatures || 2}" 
                           onchange="serverConfigUpdateField('verifySignatures', parseInt(this.value) || 2)"
                           min="2" max="2">
                    <span class="server-config-hint">Только 2 поддерживается</span>
                </div>
                <div class="server-config-form-group">
                    <label>Только та же сборка</label>
                    <select class="server-config-select" onchange="serverConfigUpdateField('forceSameBuild', parseInt(this.value))">
                        <option value="0" ${c.forceSameBuild === 0 ? 'selected' : ''}>Выключено</option>
                        <option value="1" ${c.forceSameBuild === 1 ? 'selected' : ''}>Включено</option>
                    </select>
                    <span class="server-config-hint">Разрешать подключение только с той же версией</span>
                </div>
            </div>
            
            <div class="server-config-form-row">
                <div class="server-config-form-group">
                    <label>Одновременных входов</label>
                    <input type="number" class="server-config-input" value="${c.loginQueueConcurrentPlayers || 5}" 
                           onchange="serverConfigUpdateField('loginQueueConcurrentPlayers', parseInt(this.value) || 5)"
                           min="1">
                    <span class="server-config-hint">Сколько игроков входят одновременно</span>
                </div>
                <div class="server-config-form-group">
                    <label>Максимум в очереди</label>
                    <input type="number" class="server-config-input" value="${c.loginQueueMaxPlayers || 500}" 
                           onchange="serverConfigUpdateField('loginQueueMaxPlayers', parseInt(this.value) || 500)"
                           min="1">
                </div>
            </div>
            
            <div class="server-config-form-group">
                <label>Shard ID</label>
                <input type="text" class="server-config-input" value="${c.shardId || ''}" 
                       onchange="serverConfigUpdateField('shardId', this.value)" maxlength="6">
                <span class="server-config-hint">6 символов для приватного сервера</span>
            </div>
            
            <div class="server-config-form-group">
                <label>Guaranteed Updates</label>
                <input type="number" class="server-config-input" value="${c.guaranteedUpdates || 1}" 
                       onchange="serverConfigUpdateField('guaranteedUpdates', parseInt(this.value) || 1)"
                       min="1">
                <span class="server-config-hint">Протокол связи (только 1)</span>
            </div>
        </div>
    `;
}

function renderMissionSettings() {
    const c = serverConfigState.config || getDefaultServerConfig();
    
    return `
        <div class="server-config-section">
            <h4>Настройки миссии</h4>
            
            <div class="server-config-form-group">
                <label>Шаблон миссии</label>
                <select class="server-config-select" onchange="serverConfigUpdateField('template', this.value)">
                    <option value="dayzOffline.chernarusplus" ${c.template === 'dayzOffline.chernarusplus' ? 'selected' : ''}>
                        ChernarusPlus (Vanilla)
                    </option>
                    <option value="dayzOffline.enoch" ${c.template === 'dayzOffline.enoch' ? 'selected' : ''}>
                        Livonia (DLC)
                    </option>
                </select>
                <span class="server-config-hint">Карта, которая будет загружена на сервере</span>
            </div>
            
            <div class="server-config-form-group" style="margin-top:12px;">
                <label>Или введите свой шаблон</label>
                <input type="text" class="server-config-input" value="${c.template || 'dayzOffline.chernarusplus'}" 
                       onchange="serverConfigUpdateField('template', this.value)" 
                       placeholder="dayzOffline.chernarusplus">
                <span class="server-config-hint">Формат: MissionName.TerrainName</span>
            </div>
        </div>
    `;
}

// ============================================
// ОБНОВЛЕНИЕ ПОЛЯ
// ============================================

function serverConfigUpdateField(field, value) {
    if (!serverConfigState.config) return;
    serverConfigState.config[field] = value;
    serverConfigState.isDirty = true;
    updateServerConfigStatus('⚠️ Есть несохранённые изменения');
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================

function serverConfigSwitchTab(tab) {
    const tabMap = {
        'basic': 'serverConfigTabBasic',
        'gameplay': 'serverConfigTabGameplay',
        'time': 'serverConfigTabTime',
        'network': 'serverConfigTabNetwork',
        'mission': 'serverConfigTabMission'
    };
    
    document.querySelectorAll('.server-config-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.server-config-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const target = document.getElementById(tabMap[tab]);
    if (target) {
        target.classList.add('active');
    }
    
    const labels = {
        'basic': 'Основные',
        'gameplay': 'Геймплей',
        'time': 'Время',
        'network': 'Сеть',
        'mission': 'Миссия'
    };
    
    document.querySelectorAll('.server-config-tab').forEach(btn => {
        if (btn.textContent.includes(labels[tab])) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// RAW РЕДАКТОР
// ============================================

function serverConfigOpenRaw() {
    const content = generateServerConfig(serverConfigState.config);
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay server-config-raw-modal';
    modal.id = 'serverConfigRawModal';
    modal.innerHTML = `
        <div class="modal-content modal-confirm" style="max-width:800px;width:90%;">
            <div class="modal-confirm-header">
                <div class="modal-confirm-icon">📝</div>
                <h3>RAW редактор serverDZ.cfg</h3>
            </div>
            <div class="modal-body" style="padding:16px 20px;">
                <textarea id="serverConfigRawTextarea" style="width:100%;min-height:400px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e5e5e5;font-family:'Courier New',monospace;font-size:0.8rem;padding:12px;resize:vertical;outline:none;box-sizing:border-box;">${content}</textarea>
            </div>
            <div class="modal-footer" style="padding:12px 20px;border-top:1px solid rgba(255,255,255,0.04);display:flex;justify-content:flex-end;gap:10px;">
                <button class="btn btn-secondary" onclick="serverConfigCloseRaw()">Отмена</button>
                <button class="btn btn-primary" onclick="serverConfigApplyRaw()">Применить</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function serverConfigCloseRaw() {
    const modal = document.getElementById('serverConfigRawModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function serverConfigApplyRaw() {
    const textarea = document.getElementById('serverConfigRawTextarea');
    if (!textarea) return;
    
    try {
        const content = textarea.value;
        const parsed = parseServerConfig(content);
        serverConfigState.config = parsed;
        serverConfigState.isDirty = true;
        updateServerConfigStatus('⚠️ Есть несохранённые изменения');
        renderServerConfigForm();
        serverConfigCloseRaw();
        
        if (typeof notifications !== 'undefined') {
            notifications.success('RAW изменения применены');
        }
    } catch (e) {
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка применения: ' + e.message);
        }
    }
}

function renderServerConfigForm() {
    const container = document.querySelector('.server-config-body');
    if (!container) return;
    
    const tabs = ['basic', 'gameplay', 'time', 'network', 'mission'];
    const renderers = {
        'basic': renderBasicSettings,
        'gameplay': renderGameplaySettings,
        'time': renderTimeSettings,
        'network': renderNetworkSettings,
        'mission': renderMissionSettings
    };
    
    tabs.forEach(tab => {
        const tabId = `serverConfigTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
        const element = document.getElementById(tabId);
        if (element) {
            element.innerHTML = renderers[tab]();
        }
    });
}

// ============================================
// ВОЗВРАТ К ПЛИТКАМ
// ============================================

function serverConfigBackToTiles() {
    destroyServerConfigScrollTopButton();
    
    if (serverConfigState.isDirty) {
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

let serverConfigScrollTopBtn = null;
let serverConfigScrollTimer = null;

function createServerConfigScrollTopButton() {
    const oldBtn = document.getElementById('serverConfigScrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        serverConfigScrollTopBtn = null;
    }
    
    if (serverConfigScrollTimer) {
        clearInterval(serverConfigScrollTimer);
        serverConfigScrollTimer = null;
    }
    
    serverConfigScrollTopBtn = document.createElement('button');
    serverConfigScrollTopBtn.id = 'serverConfigScrollTopBtn';
    serverConfigScrollTopBtn.className = 'scroll-top-btn';
    serverConfigScrollTopBtn.innerHTML = '↑';
    serverConfigScrollTopBtn.title = 'Наверх';
    
    let isScrolling = false;
    
    serverConfigScrollTopBtn.addEventListener('click', function(e) {
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
    
    document.body.appendChild(serverConfigScrollTopBtn);
    console.log('✅ Кнопка "Наверх" создана');
    
    serverConfigScrollTimer = setInterval(function() {
        checkServerConfigScroll();
    }, 300);
    
    setTimeout(checkServerConfigScroll, 200);
}

function checkServerConfigScroll() {
    if (!serverConfigScrollTopBtn) return;
    
    const contentArea = document.getElementById('contentArea');
    let hasScroll = false;
    
    if (contentArea) {
        const scrollContainer = contentArea.querySelector('div:first-child');
        if (scrollContainer && scrollContainer.scrollTop > 50) {
            hasScroll = true;
        }
    }
    
    if (hasScroll) {
        serverConfigScrollTopBtn.classList.add('visible');
    } else {
        serverConfigScrollTopBtn.classList.remove('visible');
    }
}

function destroyServerConfigScrollTopButton() {
    if (serverConfigScrollTimer) {
        clearInterval(serverConfigScrollTimer);
        serverConfigScrollTimer = null;
    }
    
    const btn = document.getElementById('serverConfigScrollTopBtn');
    if (btn) {
        btn.remove();
        serverConfigScrollTopBtn = null;
    }
}

// ============================================
// ЭКСПОРТ
// ============================================

window.initServerConfigEditor = initServerConfigEditor;
window.saveServerConfig = saveServerConfig;
window.loadServerConfig = loadServerConfig;
window.serverConfigSwitchTab = serverConfigSwitchTab;
window.serverConfigBackToTiles = serverConfigBackToTiles;
window.serverConfigUpdateField = serverConfigUpdateField;
window.serverConfigOpenRaw = serverConfigOpenRaw;
window.serverConfigCloseRaw = serverConfigCloseRaw;
window.serverConfigApplyRaw = serverConfigApplyRaw;

console.log('⚙️ server_config_editor.js загружен');