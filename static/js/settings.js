// ============================================
// ЕДИНЫЙ МЕНЕДЖЕР НАСТРОЕК
// ============================================

class SettingsManager {
    constructor() {
        this.cache = {};
        this.initialized = false;
    }
    
    async init() {
        if (this.initialized) return;
        await this.loadAll();
        this.initialized = true;
        console.log('✅ SettingsManager инициализирован');
    }
    // ============================================
    // ТЕМА
    // ============================================
    
    async getTheme() {
        return await this.getSetting('theme');
    }
    
    async setTheme(themeId) {
        return await this.setSetting('theme', themeId);
    }
    // ============================================
    // ЗАГРУЗКА НАСТРОЕК
    // ============================================
    
    async loadAll() {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            this.cache = data;
            // ❌ УБРАЛИ ТОЛЬКО ЭТО уведомление
            // if (typeof Notifications !== 'undefined') {
            //     Notifications.success('Настройки загружены', 'Данные успешно получены с сервера');
            // }
            return data;
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            
            // ❌ И ЭТО уведомление об ошибке тоже убрали (тихо грузим)
            // if (typeof Notifications !== 'undefined') {
            //     Notifications.error('Ошибка загрузки', 'Не удалось загрузить настройки с сервера');
            // }
            
            return {};
        }
    }
    
    async getSetting(key) {
        if (this.cache[key] !== undefined) {
            return this.cache[key];
        }
        try {
            const response = await fetch(`/api/settings/${key}`);
            const data = await response.json();
            if (data.value !== undefined) {
                this.cache[key] = data.value;
                return data.value;
            }
            return null;
        } catch (error) {
            console.error(`Ошибка получения настройки ${key}:`, error);
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка', `Не удалось получить настройку "${key}"`);
            }
            
            return null;
        }
    }
    
    async setSetting(key, value) {
        try {
            const response = await fetch(`/api/settings/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });
            const data = await response.json();
            if (data.success) {
                this.cache[key] = value;
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Ошибка сохранения ${key}:`, error);
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка сохранения', `Не удалось сохранить настройку "${key}"`);
            }
            
            return false;
        }
    }
    
    async resetSetting(key) {
        try {
            const response = await fetch(`/api/settings/${key}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                delete this.cache[key];
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Ошибка сброса ${key}:`, error);
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка сброса', `Не удалось сбросить настройку "${key}"`);
            }
            
            return false;
        }
    }
    
    async resetAll() {
        try {
            const response = await fetch('/api/settings/reset/all', {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                this.cache = data.settings || {};
                return true;
            }
            return false;
        } catch (error) {
            console.error('Ошибка сброса всех настроек:', error);
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка', 'Не удалось сбросить все настройки');
            }
            
            return false;
        }
    }
    
    // ============================================
    // ЗАГРУЗКА НАСТРОЕК
    // ============================================

    async loadAll() {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            this.cache = data;
            // ❌ УБРАЛИ уведомление об успешной загрузке (спам)
            return data;
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
            
            // ✅ ВЕРНУЛИ уведомление об ошибке
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка загрузки', 'Не удалось загрузить настройки с сервера');
            }
            
            return {};
        }
    }

    // ============================================
    // ЗАГРУЗКА В UI
    // ============================================
    
    loadToUI() {
        const fields = ['server_exe', 'game_exe', 'workshop', 'custom_mods'];
        const inputIds = ['server-exe-path', 'game-exe-path', 'workshop-path', 'custom-mods-path'];
        
        fields.forEach((field, i) => {
            const input = document.getElementById(inputIds[i]);
            if (input) {
                const value = this.cache[field] || '';
                input.value = value;
            }
        });
    }
    
    // ============================================
    // РАБОТА С ФАЙЛАМИ (ДИАЛОГИ)
    // ============================================
    
    async browseFile(inputId, type = 'file') {
        const btn = document.querySelector(`[data-target="${inputId}"]`);
        const field = btn?.dataset.field;
        if (!field) {
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка', 'Не найден параметр поля');
            }
            return;
        }
        
        const statusId = `status-${field}`;
        const statusEl = document.getElementById(statusId);
        
        if (statusEl) {
            statusEl.textContent = '⏳ Открывается диалог...';
            statusEl.style.color = '#60a5fa';
        }
        
        if (typeof Notifications !== 'undefined') {
            Notifications.info('Открывается диалог', 'Выберите путь в окне проводника');
        }
        
        try {
            const endpoint = type === 'folder' ? '/api/browse/folder' : '/api/browse/file';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field, inputId })
            });
            
            const result = await response.json();
            
            if (result.success && result.path) {
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = result.path;
                }
                
                await this.saveField(field, inputId, statusId);
                
                if (typeof Notifications !== 'undefined') {
                    Notifications.success('Путь выбран', result.path);
                }
            } else {
                if (statusEl) {
                    statusEl.textContent = '❌ Отменено';
                    statusEl.style.color = '#f87171';
                }
                
                if (typeof Notifications !== 'undefined') {
                    Notifications.warning('Выбор отменён', result.message || 'Диалог выбора был закрыт без выбора пути');
                }
                
                setTimeout(() => {
                    if (statusEl) statusEl.textContent = '';
                }, 2000);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            
            if (statusEl) {
                statusEl.textContent = '❌ Ошибка';
                statusEl.style.color = '#f87171';
            }
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка', error.message || 'Произошла ошибка при открытии диалога');
            }
            
            setTimeout(() => {
                if (statusEl) statusEl.textContent = '';
            }, 3000);
        }
    }
    
    async saveField(field, inputId, statusId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const value = input.value.trim();
        if (!value) {
            const statusEl = document.getElementById(statusId);
            if (statusEl) {
                statusEl.textContent = '⚠️ Укажите путь';
                statusEl.style.color = '#fbbf24';
            }
            
            if (typeof Notifications !== 'undefined') {
                Notifications.warning('Укажите путь', 'Пожалуйста, укажите путь перед сохранением');
            }
            
            setTimeout(() => {
                if (statusEl) statusEl.textContent = '';
            }, 3000);
            return;
        }
        
        const success = await this.setSetting(field, value);
        const statusEl = document.getElementById(statusId);
        
        if (success) {
            if (statusEl) {
                statusEl.textContent = '✅ Сохранено';
                statusEl.style.color = '#4ade80';
            }
            
            const fieldNames = {
                'server_exe': 'Сервер',
                'game_exe': 'Игра',
                'workshop': 'Workshop',
                'custom_mods': 'Свои моды'
            };
            const fieldName = fieldNames[field] || field;
            
            if (typeof Notifications !== 'undefined') {
                Notifications.success(`✅ ${fieldName} сохранён`, 'Путь успешно сохранён в настройках');
            }
        } else {
            if (statusEl) {
                statusEl.textContent = '❌ Ошибка';
                statusEl.style.color = '#f87171';
            }
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка сохранения', 'Не удалось сохранить путь на сервере');
            }
        }
        
        setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
        }, 3000);
    }
    
    async resetField(field, inputId, statusId) {
        const success = await this.resetSetting(field);
        const statusEl = document.getElementById(statusId);
        const input = document.getElementById(inputId);
        
        if (success) {
            if (input) input.value = '';
            if (statusEl) {
                statusEl.textContent = '✅ Сброшено';
                statusEl.style.color = '#4ade80';
            }
            
            const fieldNames = {
                'server_exe': 'Сервер',
                'game_exe': 'Игра',
                'workshop': 'Workshop',
                'custom_mods': 'Свои моды'
            };
            const fieldName = fieldNames[field] || field;
            
            if (typeof Notifications !== 'undefined') {
                Notifications.success(`✅ ${fieldName} сброшен`, 'Настройка возвращена к значению по умолчанию');
            }
        } else {
            if (statusEl) {
                statusEl.textContent = '❌ Ошибка';
                statusEl.style.color = '#f87171';
            }
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка сброса', 'Не удалось сбросить настройку');
            }
        }
        
        setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
        }, 3000);
    }
    
    async openInExplorer(inputId) {
        const input = document.getElementById(inputId);
        if (!input) {
            if (typeof Notifications !== 'undefined') {
                Notifications.warning('Элемент не найден', 'Поле ввода не найдено на странице');
            }
            return;
        }
        
        const path = input.value.trim();
        if (!path) {
            if (typeof Notifications !== 'undefined') {
                Notifications.warning('Путь не указан', 'Сначала выберите путь через кнопку "Обзор"');
            }
            return;
        }
        
        try {
            const response = await fetch('/api/open/explorer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (typeof Notifications !== 'undefined') {
                    Notifications.success('Проводник открыт', path);
                }
            } else {
                if (typeof Notifications !== 'undefined') {
                    Notifications.error('Ошибка', result.message || 'Не удалось открыть проводник');
                }
            }
        } catch (error) {
            console.error('Ошибка:', error);
            
            if (typeof Notifications !== 'undefined') {
                Notifications.error('Ошибка', error.message || 'Произошла ошибка при открытии проводника');
            }
        }
    }
}

// ============================================
// СОЗДАЁМ ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР
// ============================================

const settingsManager = new SettingsManager();

// ============================================
// ПРИВЯЗКА ОБРАБОТЧИКОВ
// ============================================

function attachSettingsHandlers() {
    // Сохранение
    document.querySelectorAll('.save-single-btn').forEach(btn => {
        btn.removeEventListener('click', btn._saveHandler);
        
        btn._saveHandler = function() {
            const field = this.dataset.field;
            const target = this.dataset.target;
            const statusId = `status-${field}`;
            settingsManager.saveField(field, target, statusId);
        };
        btn.addEventListener('click', btn._saveHandler);
    });
    
    // Сброс
    document.querySelectorAll('.reset-single-btn').forEach(btn => {
        btn.removeEventListener('click', btn._resetHandler);
        
        btn._resetHandler = function() {
            const field = this.dataset.field;
            const target = this.dataset.target;
            const statusId = `status-${field}`;
            settingsManager.resetField(field, target, statusId);
        };
        btn.addEventListener('click', btn._resetHandler);
    });
    
    // Обзор
    document.querySelectorAll('.browse-btn').forEach(btn => {
        btn.removeEventListener('click', btn._browseHandler);
        
        btn._browseHandler = function() {
            const target = this.dataset.target;
            const type = this.dataset.type || 'file';
            settingsManager.browseFile(target, type);
        };
        btn.addEventListener('click', btn._browseHandler);
    });
    
    // Открыть в проводнике
    document.querySelectorAll('.open-explorer-btn').forEach(btn => {
        btn.removeEventListener('click', btn._explorerHandler);
        
        btn._explorerHandler = function() {
            const target = this.dataset.target;
            settingsManager.openInExplorer(target);
        };
        btn.addEventListener('click', btn._explorerHandler);
    });
}

// ============================================
// ЭКСПОРТ
// ============================================

window.settingsManager = settingsManager;
window.attachSettingsHandlers = attachSettingsHandlers;