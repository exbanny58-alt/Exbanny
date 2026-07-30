// ============================================
// НАСТРОЙКИ (SUBNAV)
// ============================================

app.renderSettingsSubnav = function() {
    // Обновляем кнопки с иконками
    const tabs = document.querySelectorAll('.subnav-tab');
    const icons = {
        'general': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        'colors': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M12 2a10 10 0 0 0 0 20"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>',
        'effects': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'paths': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><line x1="8" y1="3" x2="8" y2="9"/><line x1="16" y1="3" x2="16" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>',
        'database': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>'
    };

    tabs.forEach(tab => {
        const tabName = tab.dataset.settingsTab;
        const icon = icons[tabName] || '';
        
        // Вставляем иконку перед текстом
        if (icon) {
            // Сохраняем текст
            const text = tab.textContent.trim();
            tab.innerHTML = `${icon} <span>${text}</span>`;
            tab.style.display = 'flex';
            tab.style.alignItems = 'center';
            tab.style.gap = '8px';
        }

        tab.addEventListener('click', () => {
            const tabName = tab.dataset.settingsTab;
            console.log('📑 Settings tab clicked:', tabName);
            this.switchSettingsTab(tabName);
        });
    });
};

app.showSettingsSubnav = function() {
    const subnav = document.getElementById('settingsSubnav');
    if (subnav) subnav.classList.add('visible');
};

app.hideSettingsSubnav = function() {
    const subnav = document.getElementById('settingsSubnav');
    if (subnav) subnav.classList.remove('visible');
};

app.closeColorPickerIfOpen = function() {
    if (ColorPicker.isOpen) {
        ColorPicker.close();
    }
};

app.switchSettingsTab = function(tabName) {
    this.currentSettingsTab = tabName;

    document.querySelectorAll('.subnav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.settingsTab === tabName);
    });

    if (tabName === 'colors') {
        ColorPicker.open();
        return;
    }

    ColorPicker.close();
    this.loadSettingsContent(tabName);
};

app.loadSettingsContent = function(tabName) {
    const tab = tabName || this.currentSettingsTab;

    switch (tab) {
        case 'general':
            this.renderGeneralSettings();
            break;
        case 'effects':
            this.renderEffectsSettings();
            break;
        case 'paths':
            this.renderPathsSettings();
            break;
        case 'database':      // ← НОВОЕ
            this.renderDatabaseSettings();
            break;
        default:
            this.renderGeneralSettings();
    }

    setTimeout(() => EffectsManager.applyToContent(), 50);
};
// ---- Загрузка настроек с сервера ----
app.loadSettingsFromServer = async function() {
    try {
        const response = await fetch('/api/settings/load');
        const data = await response.json();

        if (data.effect && EffectsManager.effects[data.effect]) {
            EffectsManager.currentEffect = data.effect;
        }

        if (data.colors) {
            ColorPicker.colors = {
                accent: data.colors.accent || ColorPicker.colors.accent,
                accentSecondary: data.colors.accentSecondary || ColorPicker.colors.accentSecondary,
                glowIntensity: data.colors.glowIntensity !== undefined 
                    ? data.colors.glowIntensity 
                    : ColorPicker.colors.glowIntensity
            };
            ColorPicker.applyColors();
        }
    } catch (error) {
        console.error('❌ Error loading settings:', error);
        Notifications.error('Ошибка загрузки настроек');
    }
};

// ---- Рендеринг страниц настроек ----
app.renderGeneralSettings = function() {
    document.getElementById('content').innerHTML = `
        <div class='settings-page'>
            <div class='settings-header'>
                <div class='settings-icon'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='var(--accent)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                        <circle cx='12' cy='12' r='3'></circle>
                        <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
                    </svg>
                </div>
                <h1>Общие настройки</h1>
            </div>
            <div class='settings-content'>
                <p>Здесь будут общие настройки приложения</p>
            </div>
        </div>`;
};

app.renderEffectsSettings = function() {
    const effects = EffectsManager.effects;
    const currentEffect = EffectsManager.currentEffect;
    let optionsHtml = '';

    Object.entries(effects).forEach(([id, effect]) => {
        const isActive = currentEffect === id;
        optionsHtml += `
            <div class="effect-option ${isActive ? 'active' : ''}" data-effect="${id}">
                <div class="effect-radio"></div>
                <div class="effect-info">
                    <span class="effect-name">${effect.name}</span>
                    <span class="effect-desc">${effect.description}</span>
                </div>
            </div>`;
    });

    document.getElementById('content').innerHTML = `
        <div class='settings-page effects-page'>
            <div class='settings-content effects-content'>
                <p>Выберите анимацию переключения между страницами</p>
                <div class='effects-list'>
                    ${optionsHtml}
                </div>
            </div>
        </div>`;

    setTimeout(() => {
        document.querySelectorAll('.effect-option').forEach(option => {
            option.addEventListener('click', () => {
                const effectId = option.dataset.effect;
                EffectsManager.setEffect(effectId);
                this.loadSettingsContent('effects');
            });
        });
    }, 0);
};

// ============================================
// ПУТИ — рендеринг из БД через API
// ============================================

app.renderPathsSettings = function() {
    // Загружаем пути с сервера
    fetch('/api/paths/load')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                this.renderPathsError();
                return;
            }
            this.renderPathsList(data.paths);
        })
        .catch(() => {
            this.renderPathsError();
        });
};

app.renderPathsList = function(pathsList) {
    // HTML страницы
    const pageHtml = `
        <div class='settings-page'>
            <div class='settings-header'>
                <div class='settings-icon'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='var(--accent)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                        <path d='M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z'/>
                        <path d='M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4'/>
                        <line x1='8' y1='3' x2='8' y2='9'/>
                        <line x1='16' y1='3' x2='16' y2='9'/>
                        <line x1='3' y1='15' x2='21' y2='15'/>
                    </svg>
                </div>
                <h1>Пути к папкам</h1>
            </div>
            <div class='settings-content'>
                <p style='color: var(--text-secondary); font-size: 0.9rem; letter-spacing: 0.5px; margin-bottom: 24px; text-align: left;'>
                    Настройка путей к системным директориям и ресурсам сервера.
                </p>
                <div class='paths-container' style='display: flex; flex-direction: column; gap: 14px;'>
                    <div id='pathsListContainer'></div>
                </div>
                <div style='display: flex; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);'>
                    <button class='paths-save-btn' style='padding: 10px 28px; border-radius: 8px; border: 2px solid var(--accent); background: var(--accent-bg); color: var(--accent); font-family: Montserrat, sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.25s ease;'>
                        💾 Сохранить пути
                    </button>
                    <button class='paths-reset-btn' style='padding: 10px 28px; border-radius: 8px; border: 2px solid rgba(255,70,70,0.3); background: rgba(255,70,70,0.08); color: #ff6b6b; font-family: Montserrat, sans-serif; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.25s ease;'>
                        ↺ Сбросить
                    </button>
                    <span style='margin-left: auto; padding: 8px 16px; border-radius: 20px; background: var(--accent-bg); border: 1px solid rgba(122,204,122,0.2); color: var(--accent); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.5px;'>
                        ⏳ В разработке
                    </span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML = pageHtml;

    // Генерируем строки путей
    let pathsHtml = '';
    pathsList.forEach((path, index) => {
        pathsHtml += `
            <div class='path-row' style='display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 16px; transition: all 0.3s ease;'>
                <div style='min-width: 140px;'>
                    <label style='font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.3px;'>${path.label}</label>
                </div>
                <div style='flex: 1; display: flex; align-items: center; gap: 10px;'>
                    <input type='text' class='path-input' data-path-id='${path.id}' value='${path.path}' placeholder='${path.placeholder}' style='flex: 1; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px; padding: 8px 14px; color: var(--text-primary); font-family: Montserrat, sans-serif; font-size: 0.85rem; outline: none; transition: all 0.25s ease;'>
                    <button class='path-browse-btn' data-path-id='${path.id}' style='padding: 8px 18px; border-radius: 6px; border: 1px solid var(--accent); background: var(--accent-bg); color: var(--accent); font-family: Montserrat, sans-serif; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.25s ease; white-space: nowrap;'>
                        📂 Обзор
                    </button>
                </div>
                <div style='width: 20px; text-align: center; opacity: 0.3;'>
                    <span style='font-size: 0.7rem; color: var(--text-secondary);'>${index + 1}</span>
                </div>
            </div>
        `;
    });

    document.getElementById('pathsListContainer').innerHTML = pathsHtml;

    // ===== СОБЫТИЯ =====
    setTimeout(() => {
        document.querySelectorAll('.path-browse-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const pathId = btn.dataset.pathId;
                Notifications.info('🔍 Выбор папки', `Путь "${pathId}": функция в разработке`);
            });
        });

        document.querySelectorAll('.path-input').forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--accent)';
                input.style.boxShadow = '0 0 16px var(--accent-glow)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = 'var(--border-color)';
                input.style.boxShadow = 'none';
            });
        });

        document.querySelector('.paths-save-btn')?.addEventListener('click', () => {
            const paths = {};
            document.querySelectorAll('.path-input').forEach(input => {
                paths[input.dataset.pathId] = input.value;
            });
            
            fetch('/api/paths/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths: paths })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Notifications.success('✅ Пути сохранены!');
                } else {
                    Notifications.error('❌ Ошибка сохранения: ' + data.error);
                }
            })
            .catch(() => {
                Notifications.error('❌ Ошибка соединения с сервером');
            });
        });

        document.querySelector('.paths-reset-btn')?.addEventListener('click', () => {
            fetch('/api/paths/reset', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Notifications.info('↺ Пути сброшены к дефолтным');
                    this.renderPathsSettings(); // Перезагружаем
                } else {
                    Notifications.error('❌ Ошибка сброса: ' + data.error);
                }
            })
            .catch(() => {
                Notifications.error('❌ Ошибка соединения с сервером');
            });
        });

    }, 50);

    setTimeout(() => EffectsManager.applyToContent(), 50);
};

app.renderPathsError = function() {
    document.getElementById('content').innerHTML = `
        <div class='settings-page'>
            <div class='settings-header'>
                <div class='settings-icon'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='var(--accent)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                        <path d='M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z'/>
                        <path d='M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4'/>
                        <line x1='8' y1='3' x2='8' y2='9'/>
                        <line x1='16' y1='3' x2='16' y2='9'/>
                        <line x1='3' y1='15' x2='21' y2='15'/>
                    </svg>
                </div>
                <h1>Пути к папкам</h1>
            </div>
            <div class='settings-content'>
                <p style='color: var(--text-secondary); text-align: center; padding: 40px 0;'>
                    ⚠️ Ошибка загрузки путей из базы данных
                </p>
            </div>
        </div>
    `;
};

// ============================================
// БАЗА ДАННЫХ — как phpMyAdmin
// ============================================

app.renderDatabaseSettings = function() {
    document.getElementById('content').innerHTML = `
        <div class='settings-page db-page'>
            <div class='settings-content'>
                <!-- Шапка с иконкой БД -->
                <div style='display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);'>
                    <div class='settings-icon' style='width: 48px; height: 48px; flex-shrink: 0;'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='var(--accent)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                            <ellipse cx='12' cy='5' rx='9' ry='3'/>
                            <path d='M21 12c0 1.66-4 3-9 3s-9-1.34-9-3'/>
                            <path d='M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5'/>
                        </svg>
                    </div>
                    <div>
                        <h1 style='font-family: Montserrat, sans-serif; color: var(--text-heading); font-size: 1.5rem; font-weight: 600; letter-spacing: 0.5px; margin: 0;'>База данных</h1>
                        <p style='color: var(--text-secondary); font-size: 0.85rem; margin: 4px 0 0 0;'>Просмотр и управление <code style='background: var(--bg-primary); padding: 2px 10px; border-radius: 4px; color: var(--accent); font-size: 0.75rem;'>config/dayzm.db</code></p>
                    </div>
                </div>

                <div style='display: flex; gap: 20px; align-items: flex-start;'>
                    <!-- Список таблиц слева -->
                    <div style='min-width: 180px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 8px;'>
                        <div style='padding: 8px 12px; color: var(--text-secondary); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border-color);'>
                            📋 Таблицы
                        </div>
                        <div id='dbTablesList' style='display: flex; flex-direction: column; gap: 2px; margin-top: 6px;'></div>
                    </div>
                    <!-- Содержимое таблицы справа -->
                    <div style='flex: 1; min-width: 0;'>
                        <div id='dbDataContainer' class='db-data-wrapper'>
                            <div class='db-empty'>
                                <span class='empty-icon'>👈</span>
                                <p class='empty-text'>Выберите таблицу слева</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Загружаем список таблиц
    fetch('/api/database/tables')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                document.getElementById('dbTablesList').innerHTML = 
                    `<p style='color: var(--text-secondary); padding: 12px;'>❌ Ошибка</p>`;
                return;
            }

            const container = document.getElementById('dbTablesList');
            data.tables.forEach(table => {
                const btn = document.createElement('button');
                btn.className = 'db-table-item';
                btn.textContent = `📊 ${table}`;
                btn.dataset.table = table;
                btn.style.cssText = `
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 6px;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                `;
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'var(--accent-bg)';
                    btn.style.color = 'var(--text-heading)';
                });
                btn.addEventListener('mouseleave', () => {
                    if (!btn.classList.contains('active')) {
                        btn.style.background = 'transparent';
                        btn.style.color = 'var(--text-secondary)';
                    }
                });
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.db-table-item').forEach(b => {
                        b.classList.remove('active');
                        b.style.background = 'transparent';
                        b.style.color = 'var(--text-secondary)';
                    });
                    btn.classList.add('active');
                    btn.style.background = 'var(--accent-bg)';
                    btn.style.color = 'var(--accent)';
                    this.loadTableData(table);
                });
                container.appendChild(btn);
            });

            // Если есть таблицы — показываем первую
            if (data.tables.length > 0) {
                const firstBtn = container.querySelector('.db-table-item');
                if (firstBtn) {
                    firstBtn.classList.add('active');
                    firstBtn.style.background = 'var(--accent-bg)';
                    firstBtn.style.color = 'var(--accent)';
                    this.loadTableData(data.tables[0]);
                }
            }
        })
        .catch(() => {
            document.getElementById('dbTablesList').innerHTML = 
                `<p style='color: var(--text-secondary); padding: 12px;'>❌ Ошибка соединения</p>`;
        });
};

app.loadTableData = function(tableName) {
    const container = document.getElementById('dbDataContainer');
    
    container.innerHTML = `
        <div class='db-loader'>
            <div class='loader' style='width: 32px; height: 32px; margin: 0 auto;'>
                <div class='inner one' style='border-bottom-color: var(--accent);'></div>
                <div class='inner two' style='border-right-color: var(--accent);'></div>
                <div class='inner three' style='border-top-color: var(--accent);'></div>
            </div>
            <p>Загрузка...</p>
        </div>
    `;

    fetch(`/api/database/table/${tableName}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                container.innerHTML = `
                    <div class='db-empty'>
                        <span class='empty-icon'>❌</span>
                        <p class='empty-text'>Ошибка: ${data.error}</p>
                    </div>
                `;
                return;
            }

            // ⬇️ Скрываем колонки content и icon
            let columns = data.columns;
            if (tableName === 'pages') {
                columns = columns.filter(col => col !== 'content' && col !== 'icon');
            }

            let html = `
                <div class='db-table-stats'>
                    <div style='display: flex; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;'>
                        <span class='table-name'>📋 <code>${tableName}</code></span>
                        <span class='table-count'><strong>${data.count}</strong> записей, <strong>${columns.length}</strong> колонок</span>
                        <button class='db-clear-btn' onclick='app.clearTableData("${tableName}")' style='margin-left: auto;'>
                            🗑️ Очистить
                        </button>
                    </div>
                </div>
            `;

            if (data.count === 0) {
                html += `
                    <div class='db-empty'>
                        <span class='empty-icon'>📭</span>
                        <p class='empty-text'>Таблица пуста</p>
                    </div>
                `;
                container.innerHTML = html;
                return;
            }

            html += `
                <div class='db-table-scroll'>
                    <table class='db-data-table'>
                        <thead>
                            <tr>
                    `;
            
            columns.forEach(col => {
                html += `<th>${col}</th>`;
            });

            // Добавляем колонку для действий, если таблица pages
            if (tableName === 'pages') {
                html += `<th style='text-align: center;'>Действия</th>`;
            }

            html += `</tr></thead><tbody>`;

            data.data.forEach(row => {
                html += `<tr>`;
                columns.forEach(col => {
                    let value = row[col];
                    if (value === null) {
                        html += `<td><span class='null-value'>NULL</span></td>`;
                    } else if (typeof value === 'string' && value.length > 50) {
                        const short = value.substring(0, 50) + '...';
                        html += `<td><span class='long-text' title='${value.replace(/"/g, '&quot;')}'>${short}</span></td>`;
                    } else {
                        html += `<td>${String(value)}</td>`;
                    }
                });

                // Кнопка "Редактировать" для таблицы pages
                if (tableName === 'pages') {
                    html += `
                        <td style='text-align: center;'>
                            <button class='db-edit-btn' onclick='app.editPageContent("${row.id}")' style='
                                padding: 4px 12px;
                                border-radius: 6px;
                                border: 1px solid var(--accent);
                                background: var(--accent-bg);
                                color: var(--accent);
                                cursor: pointer;
                                font-family: Montserrat, sans-serif;
                                font-size: 0.7rem;
                                transition: all 0.25s ease;
                            '>
                                ✏️ Редактировать
                            </button>
                        </td>
                    `;
                }

                html += `</tr>`;
            });

            html += `</tbody></table></div>`;

            container.innerHTML = html;
        })
        .catch(() => {
            container.innerHTML = `
                <div class='db-empty'>
                    <span class='empty-icon'>❌</span>
                    <p class='empty-text'>Ошибка загрузки данных</p>
                </div>
            `;
        });
};

// ============================================
// ОЧИСТКА ТАБЛИЦЫ
// ============================================

app.clearTableData = function(tableName) {
    Notifications.confirm(
        '⚠️ Очистка таблицы',
        `Вы уверены, что хотите очистить таблицу <strong>${tableName}</strong>?<br>Все данные будут удалены безвозвратно!`,
        [
            {
                label: '✅ Да, очистить',
                callback: () => {
                    fetch(`/api/database/clear/${tableName}`, {
                        method: 'POST'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Notifications.success('✅ Таблица очищена');
                            this.loadTableData(tableName);
                        } else {
                            Notifications.error('❌ Ошибка: ' + data.error);
                        }
                    })
                    .catch(() => {
                        Notifications.error('❌ Ошибка соединения');
                    });
                }
            },
            {
                label: '❌ Отмена',
                callback: () => {}
            }
        ]
    );
};

// ============================================
// РЕДАКТОР КОНТЕНТА СТРАНИЦ
// ============================================

app.editPageContent = function(pageId) {
    // Загружаем данные страницы
    fetch(`/api/database/table/pages`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                Notifications.error('❌ Ошибка загрузки страницы');
                return;
            }

            const page = data.data.find(p => p.id === pageId);
            if (!page) {
                Notifications.error('❌ Страница не найдена');
                return;
            }

            // Показываем модальное окно с редактором
            this.showPageEditor(page);
        })
        .catch(() => {
            Notifications.error('❌ Ошибка соединения');
        });
};

app.showPageEditor = function(page) {
    // Создаём оверлей
    const overlay = document.createElement('div');
    overlay.id = 'pageEditorOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    // Создаём модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: var(--bg-card);
        border: 2px solid var(--accent);
        border-radius: 16px;
        padding: 32px;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px var(--accent-glow);
        animation: slideBounceUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    modal.innerHTML = `
        <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);'>
            <h2 style='color: var(--text-heading); font-family: Montserrat, sans-serif; font-size: 1.2rem; font-weight: 600; margin: 0;'>
                ✏️ Редактирование: <span style='color: var(--accent);'>${page.name}</span>
            </h2>
            <button onclick='this.closest("#pageEditorOverlay").remove()' style='
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.5rem;
                cursor: pointer;
                transition: all 0.25s ease;
                padding: 0 8px;
            '>✕</button>
        </div>

        <div style='margin-bottom: 16px;'>
            <label style='display: block; color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; margin-bottom: 4px;'>
                ID страницы
            </label>
            <input type='text' value='${page.id}' disabled style='
                width: 100%;
                padding: 8px 14px;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                color: var(--text-secondary);
                font-family: Montserrat, sans-serif;
                font-size: 0.85rem;
                opacity: 0.5;
            '>
        </div>

        <div style='margin-bottom: 16px;'>
            <label style='display: block; color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; margin-bottom: 4px;'>
                Название страницы
            </label>
            <input type='text' id='pageNameInput' value='${page.name}' style='
                width: 100%;
                padding: 8px 14px;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                color: var(--text-primary);
                font-family: Montserrat, sans-serif;
                font-size: 0.85rem;
                outline: none;
                transition: all 0.25s ease;
            '>
        </div>

        <div style='margin-bottom: 20px;'>
            <label style='display: block; color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; margin-bottom: 4px;'>
                HTML контент
            </label>
            <textarea id='pageContentInput' rows='12' style='
                width: 100%;
                padding: 12px 14px;
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                color: var(--text-primary);
                font-family: "Courier New", monospace;
                font-size: 0.8rem;
                outline: none;
                transition: all 0.25s ease;
                resize: vertical;
                line-height: 1.6;
            '>${page.content}</textarea>
        </div>

        <div style='display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid var(--border-color);'>
            <button onclick='app.savePageContent("${page.id}")' style='
                padding: 10px 28px;
                border-radius: 8px;
                border: 2px solid var(--accent);
                background: var(--accent-bg);
                color: var(--accent);
                font-family: Montserrat, sans-serif;
                font-size: 0.85rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.25s ease;
            '>💾 Сохранить</button>
            <button onclick='this.closest("#pageEditorOverlay").remove()' style='
                padding: 10px 28px;
                border-radius: 8px;
                border: 2px solid var(--border-color);
                background: transparent;
                color: var(--text-secondary);
                font-family: Montserrat, sans-serif;
                font-size: 0.85rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.25s ease;
            '>Отмена</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Сохраняем ID страницы в глобальную переменную для доступа из onclick
    window._editingPageId = page.id;
};

app.savePageContent = function(pageId) {
    const nameInput = document.getElementById('pageNameInput');
    const contentInput = document.getElementById('pageContentInput');
    
    if (!nameInput || !contentInput) {
        Notifications.error('❌ Ошибка: поля не найдены');
        return;
    }

    const data = {
        name: nameInput.value,
        content: contentInput.value
    };

    fetch('/api/pages/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: pageId,
            name: data.name,
            content: data.content
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            Notifications.success('✅ Страница обновлена!');
            // Закрываем модалку
            const overlay = document.getElementById('pageEditorOverlay');
            if (overlay) overlay.remove();
            // Обновляем таблицу
            const activeTable = document.querySelector('.db-table-item.active');
            if (activeTable) {
                this.loadTableData(activeTable.dataset.table);
            }
        } else {
            Notifications.error('❌ Ошибка: ' + result.error);
        }
    })
    .catch(() => {
        Notifications.error('❌ Ошибка соединения с сервером');
    });
};