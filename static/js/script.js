// ========================================
// MAIN APPLICATION SCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    
    // ========================================
    // INITIALIZE THEME FROM TOGGLE
    // ========================================
    
    // Сначала загружаем сохранённую тему
    const savedTheme = await ThemeConfig.loadTheme();
    
    const toggleInputs = document.querySelectorAll('.threeway-toggle input[type="radio"]');
    
    // Если есть сохранённая тема - устанавливаем переключатель
    if (savedTheme && ThemeConfig.themes[savedTheme]) {
        const radio = document.querySelector(`#${savedTheme}`);
        if (radio) {
            radio.checked = true;
            ThemeConfig.applyTheme(savedTheme);
        }
    } else {
        // Иначе тема по умолчанию
        const checkedInput = document.querySelector('.threeway-toggle input[type="radio"]:checked');
        if (checkedInput) {
            ThemeConfig.applyTheme(checkedInput.id);
        }
    }
    
    // Обработчик изменения темы
    toggleInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                ThemeConfig.applyTheme(e.target.id);
            }
        });
    });
    
    document.addEventListener('themeChanged', (e) => {
        console.log('Theme changed event:', e.detail);
    });
    
// ========================================
    // INITIALIZE NAVIGATION
    // ========================================
    
    // ⚠️ УБИРАЕМ АВТОМАТИЧЕСКУЮ ЗАГРУЗКУ СТРАНИЦЫ ИЗ HASH
    // Всегда показываем стартовый экран при загрузке
    
    // Убеждаемся, что стартовый экран виден
    const startPage = document.getElementById('startPage');
    if (startPage) {
        startPage.style.display = 'flex';
    }
    
    // Скрываем динамический контент
    const container = document.getElementById('dynamicContent');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
    
    // Убираем активные пункты меню
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Очищаем hash в URL (если есть)
    if (window.location.hash) {
        history.pushState(null, null, ' ');
    }
    
    console.log('✅ Приложение загружено — показан стартовый экран');
    
});


// ========================================
// SPA NAVIGATION
// ========================================

const pages = {
    server: `
        <div class="server-content-wrapper">
            <div class="server-header">
                <h1 style="display: flex; align-items: center; gap: 14px; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--theme-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Управление сервером
                </h1>
                <p class="server-subtitle">Список модов, отмеченных как "СерверМод" или "Серверный"</p>
            </div>

            <div class="server-toolbar">
                <button class="btn btn-accent" id="refreshServerModsBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23,4 23,10 17,10"/>
                        <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                        <polyline points="1,20 1,14 7,14"/>
                        <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                    </svg>
                    Обновить список
                </button>
                
                <button class="btn btn-neutral" id="clearServerLinksBtn" title="Очистить все подключения и удалить симлинки">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    </svg>
                    Очистить подключения
                </button>
                
                <div class="server-filter">
                    <input type="text" id="serverModsSearchInput" placeholder="🔍 Поиск модов..." class="server-search">
                </div>
            </div>

            <div class="server-mods-list-container" id="serverModsContainer">
                <div class="loading-mods">
                    <span class="spinner"></span>
                    Загрузка серверных модов...
                </div>
            </div>
        </div>
    `,
    game: `
        <div class="game-content-wrapper">
            <div class="game-header">
                <h1 style="display: flex; align-items: center; gap: 14px; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--theme-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                        <polygon points="5,3 19,12 5,21"/>
                    </svg>
                    Управление игрой
                </h1>
                <p class="game-subtitle">Список модов, отмеченных как "КлиентМод"</p>
            </div>

            <div class="game-toolbar">
                <button class="btn btn-accent" id="refreshGameModsBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23,4 23,10 17,10"/>
                        <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                        <polyline points="1,20 1,14 7,14"/>
                        <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                    </svg>
                    Обновить список
                </button>
                
                <button class="btn btn-neutral" id="changeNicknameBtn" title="Изменить ник в игре">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Ник: <span id="currentNicknameDisplay">player</span>
                </button>
                
                <button class="btn btn-neutral" id="connectAllGameModsBtn" title="Подключить все моды, которые используются на сервере">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14"/>
                        <path d="M5 12h14"/>
                    </svg>
                    Подключить все моды сервера
                </button>
                
                <div class="game-filter">
                    <input type="text" id="gameModsSearchInput" placeholder="🔍 Поиск модов..." class="game-search">
                </div>
            </div>

            <div class="game-mods-list-container" id="gameModsContainer">
                <div class="loading-mods">
                    <span class="spinner"></span>
                    Загрузка клиентских модов...
                </div>
            </div>
        </div>
    `,
    mods: `
        <div class="mods-content-wrapper">
            <div class="mods-header">
                <h1 style="display: flex; align-items: center; gap: 14px; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--theme-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                        <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                    </svg>
                    Управление модами
                </h1>
            </div>

            <div class="mods-stats" id="modsStats">
                <div class="stat-card">
                    <span class="stat-number" id="totalModsCount">0</span>
                    <span class="stat-label">Всего модов</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" id="workshopModsCount">0</span>
                    <span class="stat-label">Из Workshop</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" id="customModsCount">0</span>
                    <span class="stat-label">Кастомных</span>
                </div>
            </div>

            <div class="mods-toolbar">
                <button class="btn btn-accent" id="refreshModsBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23,4 23,10 17,10"/>
                        <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                        <polyline points="1,20 1,14 7,14"/>
                        <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                    </svg>
                    Обновить список
                </button>
                <button class="btn btn-neutral" id="openWorkshopBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                    </svg>
                    Открыть Workshop
                </button>
                <button class="btn btn-neutral" id="openCustomModsBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                    </svg>
                    Открыть кастомные
                </button>
                <div class="mods-filter">
                    <input type="text" id="modsSearchInput" placeholder="🔍 Поиск модов..." class="mods-search">
                </div>
            </div>

            <div class="mods-list-container" id="modsListContainer">
                <div class="loading-mods">
                    <span class="spinner"></span>
                    Загрузка модов...
                </div>
            </div>
        </div>
    `,
    editors: `
        <div class="content-page">
            <h2 style="text-align: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--theme-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 10px;">
                    <polygon points="12,2 2,7 12,12 22,7 12,2"/>
                    <polyline points="2,17 12,22 22,17"/>
                    <polyline points="2,12 12,17 22,12"/>
                </svg>
                Редакторы
            </h2>
            <p style="text-align: center; color: var(--clr-txt-secondary);">Здесь будет контент редакторов</p>
        </div>
    `,
    settings: `
        <div class="settings-content-wrapper">
            <div class="settings-header">
                <h1 style="display: flex; align-items: center; gap: 14px; justify-content: center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--theme-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Настройки
                </h1>
            </div>
            <div class="settings-body">
                <!-- 1. ИСПОЛНЯЕМЫЙ ФАЙЛ СЕРВЕРА -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                <line x1="8" y1="21" x2="16" y2="21"/>
                                <line x1="12" y1="17" x2="12" y2="21"/>
                            </svg>
                        </span>
                        <div class="settings-card-title">
                            <h3>Исполняемый файл сервера</h3>
                            <p>Путь до DayZServer_x64.exe</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <input type="text" id="server-exe-path" class="settings-input" placeholder="C:\\DayZServer\\DayZServer_x64.exe" readonly>
                            <button type="button" class="btn btn-secondary browse-btn" data-target="server-exe-path" data-field="server_exe" data-type="file">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                                </svg>
                                Обзор
                            </button>
                        </div>
                        <div class="input-actions">
                            <button type="button" class="btn btn-save-row save-single-btn" data-target="server-exe-path" data-field="server_exe">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19,21H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H16l5,5V19A2,2,0,0,1,19,21Z"/>
                                    <polyline points="17,21 17,13 7,13 7,21"/>
                                    <polyline points="7,3 7,8 15,8"/>
                                </svg>
                                Сохранить
                            </button>
                            <button type="button" class="btn btn-reset-row reset-single-btn" data-target="server-exe-path" data-field="server_exe">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="1,4 1,10 7,10"/>
                                    <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                                    <polyline points="23,20 23,14 17,14"/>
                                    <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                                </svg>
                                Сбросить
                            </button>
                        </div>
                        <div class="row-status" id="status-server_exe"></div>
                    </div>
                </div>

                <!-- 2. ИСПОЛНЯЕМЫЙ ФАЙЛ ИГРЫ -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="5,3 19,12 5,21"/>
                            </svg>
                        </span>
                        <div class="settings-card-title">
                            <h3>Исполняемый файл игры</h3>
                            <p>Путь до DayZ_x64.exe (клиент игры)</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <input type="text" id="game-exe-path" class="settings-input" placeholder="C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ\\DayZ_x64.exe" readonly>
                            <button type="button" class="btn btn-secondary browse-btn" data-target="game-exe-path" data-field="game_exe" data-type="file">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                                </svg>
                                Обзор
                            </button>
                        </div>
                        <div class="input-actions">
                            <button type="button" class="btn btn-save-row save-single-btn" data-target="game-exe-path" data-field="game_exe">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19,21H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H16l5,5V19A2,2,0,0,1,19,21Z"/>
                                    <polyline points="17,21 17,13 7,13 7,21"/>
                                    <polyline points="7,3 7,8 15,8"/>
                                </svg>
                                Сохранить
                            </button>
                            <button type="button" class="btn btn-reset-row reset-single-btn" data-target="game-exe-path" data-field="game_exe">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="1,4 1,10 7,10"/>
                                    <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                                    <polyline points="23,20 23,14 17,14"/>
                                    <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                                </svg>
                                Сбросить
                            </button>
                        </div>
                        <div class="row-status" id="status-game_exe"></div>
                    </div>
                </div>

                <!-- 3. ПАПКА WORKSHOP -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                            </svg>
                        </span>
                        <div class="settings-card-title">
                            <h3>Папка Workshop</h3>
                            <p>Путь до !Workshop (мастерская Steam)</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <input type="text" id="workshop-path" class="settings-input" placeholder="C:\\DayZServer\\!Workshop" readonly>
                            <button type="button" class="btn btn-secondary browse-btn" data-target="workshop-path" data-field="workshop" data-type="folder">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                                </svg>
                                Обзор
                            </button>
                        </div>
                        <div class="input-actions">
                            <button type="button" class="btn btn-save-row save-single-btn" data-target="workshop-path" data-field="workshop">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19,21H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H16l5,5V19A2,2,0,0,1,19,21Z"/>
                                    <polyline points="17,21 17,13 7,13 7,21"/>
                                    <polyline points="7,3 7,8 15,8"/>
                                </svg>
                                Сохранить
                            </button>
                            <button type="button" class="btn btn-reset-row reset-single-btn" data-target="workshop-path" data-field="workshop">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="1,4 1,10 7,10"/>
                                    <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                                    <polyline points="23,20 23,14 17,14"/>
                                    <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                                </svg>
                                Сбросить
                            </button>
                        </div>
                        <div class="row-status" id="status-workshop"></div>
                    </div>
                </div>

                <!-- 4. ПАПКА СВОИХ МОДОВ -->
                <div class="settings-card">
                    <div class="settings-card-header">
                        <span class="settings-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </span>
                        <div class="settings-card-title">
                            <h3>Папка своих модов</h3>
                            <p>Путь до кастомных модификаций (не из Workshop)</p>
                        </div>
                    </div>
                    <div class="settings-card-body">
                        <div class="input-group">
                            <input type="text" id="custom-mods-path" class="settings-input" placeholder="C:\\DayZServer\\@MyMods" readonly>
                            <button type="button" class="btn btn-secondary browse-btn" data-target="custom-mods-path" data-field="custom_mods" data-type="folder">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22,19a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V5A2,2,0,0,1,4,3H9l2,3h9a2,2,0,0,1,2,2Z"/>
                                </svg>
                                Обзор
                            </button>
                        </div>
                        <div class="input-actions">
                            <button type="button" class="btn btn-save-row save-single-btn" data-target="custom-mods-path" data-field="custom_mods">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M19,21H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H16l5,5V19A2,2,0,0,1,19,21Z"/>
                                    <polyline points="17,21 17,13 7,13 7,21"/>
                                    <polyline points="7,3 7,8 15,8"/>
                                </svg>
                                Сохранить
                            </button>
                            <button type="button" class="btn btn-reset-row reset-single-btn" data-target="custom-mods-path" data-field="custom_mods">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="1,4 1,10 7,10"/>
                                    <path d="M21,12a9,9,0,0,0-5.5-8.2,9,9,0,0,0-11,3.7"/>
                                    <polyline points="23,20 23,14 17,14"/>
                                    <path d="M3,12a9,9,0,0,0,5.5,8.2,9,9,0,0,0,11-3.7"/>
                                </svg>
                                Сбросить
                            </button>
                        </div>
                        <div class="row-status" id="status-custom_mods"></div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// ПРОСТАЯ ФУНКЦИЯ ДЛЯ SPA
function showContent(section, event) {
    if (event) event.preventDefault();
    
    // Получаем контейнер
    const container = document.getElementById('dynamicContent');
    const startPage = document.getElementById('startPage');
    
    // Проверяем, открыта ли уже эта страница
    const currentSection = getCurrentSection();
    
    // Если кликнули на уже активную страницу - закрываем её
    if (currentSection === section && container.style.display === 'block') {
        // Закрываем страницу - показываем стартовый экран
        container.style.display = 'none';
        container.innerHTML = '';
        if (startPage) startPage.style.display = 'flex';
        
        // Убираем активный класс у всех пунктов меню
        document.querySelectorAll('.nav-item a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Очищаем hash
        if (window.location.hash) {
            history.pushState(null, null, ' ');
        }
        
        console.log(`Closed: ${section}`);
        return;
    }
    
    // Скрываем стартовую страницу
    if (startPage) startPage.style.display = 'none';
    
    // Получаем контент
    const content = pages[section];
    if (!content) {
        console.error(`Страница "${section}" не найдена`);
        return;
    }
    
    // Меняем содержимое контейнера
    container.innerHTML = content;
    container.style.display = 'block';
    container.scrollTop = 0;
    
    // Обновляем активный пункт меню
    document.querySelectorAll('.nav-item a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${section}`) {
            link.classList.add('active');
        }
    });
    
    // Обновляем URL
    if (window.location.hash !== `#${section}`) {
        window.location.hash = section;
    }
    
    console.log(`Navigated to: ${section}`);
}

// Вспомогательная функция для получения текущей открытой страницы
function getCurrentSection() {
    const container = document.getElementById('dynamicContent');
    if (!container || container.style.display === 'none' || !container.innerHTML) {
        return null;
    }
    
    // Проверяем активный пункт меню
    const activeLink = document.querySelector('.nav-item a.active');
    if (activeLink) {
        const href = activeLink.getAttribute('href');
        if (href && href.startsWith('#')) {
            return href.substring(1);
        }
    }
    return null;
}

// Обработчик для кнопок "Назад/Вперед"
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    const container = document.getElementById('dynamicContent');
    const startPage = document.getElementById('startPage');
    
    if (hash && pages[hash]) {
        // Открываем страницу (без toggle-поведения, только навигация)
        if (startPage) startPage.style.display = 'none';
        const content = pages[hash];
        container.innerHTML = content;
        container.style.display = 'block';
        container.scrollTop = 0;
        
        document.querySelectorAll('.nav-item a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${hash}`) {
                link.classList.add('active');
            }
        });
    } else {
        // Возврат на стартовую
        container.style.display = 'none';
        container.innerHTML = '';
        if (startPage) startPage.style.display = 'flex';
        
        document.querySelectorAll('.nav-item a').forEach(link => {
            link.classList.remove('active');
        });
    }
});

// ========================================
// SERVER CONTROLS
// ========================================

function controlServer(action, event) {
    if (event) event.preventDefault();
    console.log(`Server action: ${action}`);
    
    switch(action) {
        case 'start':
            fetch('/api/server/start', { method: 'POST' })
                .then(r => r.json())
                .then(data => console.log('Server start:', data))
                .catch(err => console.error('Server start error:', err));
            break;
        case 'stop':
            fetch('/api/server/stop', { method: 'POST' })
                .then(r => r.json())
                .then(data => console.log('Server stop:', data))
                .catch(err => console.error('Server stop error:', err));
            break;
        case 'restart':
            fetch('/api/server/restart', { method: 'POST' })
                .then(r => r.json())
                .then(data => console.log('Server restart:', data))
                .catch(err => console.error('Server restart error:', err));
            break;
    }
}

function controlGame(action, event) {
    if (event) event.preventDefault();
    console.log(`Game action: ${action}`);
    
    switch(action) {
        case 'start':
            fetch('/api/game/start', { method: 'POST' })
                .then(r => r.json())
                .then(data => console.log('Game start:', data))
                .catch(err => console.error('Game start error:', err));
            break;
        case 'stop':
            fetch('/api/game/stop', { method: 'POST' })
                .then(r => r.json())
                .then(data => console.log('Game stop:', data))
                .catch(err => console.error('Game stop error:', err));
            break;
    }
}

function showSettings(event) {
    if (event) event.preventDefault();
    showContent('settings');
}

// ========================================
// ТЕСТОВАЯ КНОПКА ДЛЯ УВЕДОМЛЕНИЙ.ТЕСТ
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Создаем кнопку
    const testBtn = document.createElement('div');
    testBtn.innerHTML = '🧪';
    testBtn.style.cssText = `
        position: fixed;
        bottom: 160px;
        right: 30px;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--theme-accent, #4ade80);
        color: #1a1a2e;
        font-size: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    `;
    
    // Подсказка
    const tooltip = document.createElement('span');
    tooltip.textContent = '🧪 Тест уведомлений';
    tooltip.style.cssText = `
        position: absolute;
        right: 70px;
        background: rgba(30, 30, 50, 0.95);
        backdrop-filter: blur(10px);
        color: #fff;
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    testBtn.appendChild(tooltip);
    
    // Ховер для подсказки
    testBtn.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
        testBtn.style.transform = 'scale(1.1)';
    });
    testBtn.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        testBtn.style.transform = 'scale(1)';
    });
    
    // Клик — показываем уведомление
    testBtn.addEventListener('click', function() {
        // Массив разных типов для разнообразия
        const types = [
            { type: 'success', title: '✅ Успех!', subtitle: 'Операция выполнена успешно' },
            { type: 'error', title: '❌ Ошибка!', subtitle: 'Что-то пошло не так' },
            { type: 'warning', title: '⚠️ Предупреждение', subtitle: 'Проверьте настройки' },
            { type: 'info', title: 'ℹ️ Информация', subtitle: 'Новое обновление доступно' }
        ];
        const random = types[Math.floor(Math.random() * types.length)];
        Notifications.show({
            type: random.type,
            title: random.title,
            subtitle: random.subtitle,
            actions: ['OK']
        });
    });
    
    // Добавляем на страницу
    document.body.appendChild(testBtn);
    
    console.log('🧪 Тестовая кнопка добавлена!');
});

// В конце файла script.js, после тестовой кнопки:

// ============================================
// ИНИЦИАЛИЗАЦИЯ НАСТРОЕК
// ============================================

// Загружаем настройки при открытии страницы
document.addEventListener('DOMContentLoaded', async function() {
    // Инициализируем менеджер настроек
    await settingsManager.init();
    
    // Если открыта страница настроек - загружаем в UI
    const hash = window.location.hash.replace('#', '');
    if (hash === 'settings') {
        settingsManager.loadToUI();
    }
    
    // Привязываем обработчики для настроек
    attachSettingsHandlers();
});

// ДОЛЖНО БЫТЬ (ПРАВИЛЬНО)
// Сохраняем ссылку на оригинальную функцию
const originalShowContent = showContent;

// Переопределяем
showContent = function(section, event) {
    if (event) event.preventDefault();
    
    // Вызываем оригинальную функцию
    originalShowContent(section, event);
    
    // Если открыли настройки - загружаем данные
    if (section === 'settings') {
        setTimeout(async () => {
            await settingsManager.loadAll();
            settingsManager.loadToUI();
            attachSettingsHandlers();
        }, 100);
    }
};

// В конце script.js добавить:

// ============================================
// ИНИЦИАЛИЗАЦИЯ МОДОВ
// ============================================

// Перехватываем showContent для загрузки модов
const originalShowContentMods = showContent;
showContent = function(section, event) {
    if (event) event.preventDefault();
    
    // Вызываем оригинальную функцию
    originalShowContentMods(section, event);
    
    // Если открыли страницу модов - инициализируем
    if (section === 'mods') {
        setTimeout(async () => {
            if (typeof initModsPage !== 'undefined') {
                await initModsPage();
            }
        }, 100);
    }
};