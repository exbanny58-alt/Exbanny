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
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initMpgEditor() {
    console.log('📝 Инициализация MPG Spawner Editor');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadProfilesPath().then(() => {
        renderMpgEditor(container);
        loadAllData();
    });
}

async function loadProfilesPath() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        if (settings.server_exe) {
            const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
            mpgState.profilesPath = serverDir + '/profiles';
            console.log(`📁 Путь к profiles: ${mpgState.profilesPath}`);
        }
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить путь к серверу:', e);
        if (typeof notifications !== 'undefined') {
            notifications.warning('Не удалось загрузить путь к серверу');
        }
    }
}

// ============================================
// ОТРИСОВКА ГЛАВНОГО ИНТЕРФЕЙСА
// ============================================

function renderMpgEditor(container) {
    container.innerHTML = `
        <div class="mpg-editor">
            <!-- Плавающая кнопка "Назад" -->
            <button class="mpg-back-btn" onclick="mpgBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <!-- Заголовок -->
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

            <!-- Статус -->
            <div class="mpg-status-bar" id="mpgStatusBar">
                <span class="mpg-status">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                    Готово
                </span>
                <span class="mpg-path">${mpgState.profilesPath || 'Путь не указан'}</span>
            </div>
            <!-- Вкладки -->
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

            <!-- Контент вкладок -->
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
    
    // После рендера восстанавливаем состояние редакторов
    if (mpgState.activeTab === 'points' && mpgState.currentPoint !== null) {
        renderPointEditor(mpgState.currentPoint);
    }
    if (mpgState.activeTab === 'groups' && mpgState.currentGroup !== null) {
        renderGroupEditor(mpgState.currentGroup);
    }
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
                // Перерисовываем контейнер
                const container = document.getElementById('editorContentArea');
                if (container) {
                    renderMpgEditor(container);
                }
                // Обновляем списки
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
// ЗАГРУЗКА ДАННЫХ
// ============================================

async function loadAllData() {
    mpgState.isLoading = true;
    updateStatus('⏳ Загрузка данных...');
    
    try {
        await loadConfig();
        await loadPoints();
        await loadGroups();
        
        // Обновляем интерфейс
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
    try {
        const path = mpgState.profilesPath + '/' + MPG_CONFIG.paths.config;
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });
        const data = await response.json();
        if (data.success) {
            mpgState.config = JSON.parse(data.content);
            console.log('✅ Config загружен');
        } else {
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
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить Config.json:', e);
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
    
    const animalOptions = MPG_CONFIG.entityTypes.animals.map(a => 
        `<option value="${a}">${a}</option>`
    ).join('');
    
    const zombieOptions = MPG_CONFIG.entityTypes.zombies.map(z => 
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
}

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
    mpgState.currentPoint = index;
    renderPointsList();
    renderPointEditor(index);
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
    
    const animalOptions = MPG_CONFIG.entityTypes.animals.map(a => 
        `<option value="${a}">${a}</option>`
    ).join('');
    
    const zombieOptions = MPG_CONFIG.entityTypes.zombies.map(z => 
        `<option value="${z}">${z}</option>`
    ).join('');
    
    const itemOptions = MPG_CONFIG.entityTypes.items.map(i => 
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
}

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
        // Сохраняем точки
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
        
        // Сохраняем группы
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
        
        // Сохраняем Config.json
        const configPath = mpgState.profilesPath + '/' + MPG_CONFIG.paths.config;
        const configContent = JSON.stringify(mpgState.config, null, 4);
        const configResponse = await fetch('/api/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: configPath, content: configContent })
        });
        const configData = await configResponse.json();
        if (!configData.success) {
            throw new Error(`Ошибка сохранения Config.json: ${configData.message}`);
        }
        console.log('✅ Сохранён: Config.json');
        
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

// ============================================
// ПЕРЕЗАГРУЗКА
// ============================================

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
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

window.initMpgEditor = initMpgEditor;
window.mpgSaveAll = mpgSaveAll;
window.mpgReload = mpgReload;
window.mpgSwitchTab = mpgSwitchTab;
window.mpgBackToTiles = mpgBackToTiles;

// Точки
window.mpgAddPoint = mpgAddPoint;
window.mpgConfirmDeletePoint = mpgConfirmDeletePoint;
window.mpgSelectPoint = mpgSelectPoint;
window.mpgUpdatePointField = mpgUpdatePointField;
window.mpgAddEntity = mpgAddEntity;
window.mpgAddCustomEntity = mpgAddCustomEntity;
window.mpgRemoveFromSpawnList = mpgRemoveFromSpawnList;

// Группы
window.mpgAddGroup = mpgAddGroup;
window.mpgConfirmDeleteGroup = mpgConfirmDeleteGroup;
window.mpgSelectGroup = mpgSelectGroup;
window.mpgUpdateGroupField = mpgUpdateGroupField;
window.mpgUpdateGroupWeather = mpgUpdateGroupWeather;
window.mpgAddGroupEntity = mpgAddGroupEntity;
window.mpgAddCustomGroupEntity = mpgAddCustomGroupEntity;
window.mpgRemoveFromGroupList = mpgRemoveFromGroupList;

// Конфиг
window.mpgUpdateConfigField = mpgUpdateConfigField;
window.mpgAddConfigFile = mpgAddConfigFile;
window.mpgRemoveConfigFile = mpgRemoveConfigFile;
window.mpgAddAdmin = mpgAddAdmin;
window.mpgRemoveAdmin = mpgRemoveAdmin;

console.log('📝 mpg_editor.js загружен');