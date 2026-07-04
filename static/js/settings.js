// ============================================
// НАСТРОЙКИ С ИСПОЛЬЗОВАНИЕМ НОВОЙ СИСТЕМЫ УВЕДОМЛЕНИЙ
// ============================================

// Загрузка сохранённых путей из сервера
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        const fields = ['server_exe', 'game_exe', 'workshop', 'custom_mods'];
        const inputIds = ['server-exe-path', 'game-exe-path', 'workshop-path', 'custom-mods-path'];
        
        fields.forEach((field, i) => {
            const input = document.getElementById(inputIds[i]);
            if (data[field] && data[field].trim()) {
                input.value = data[field];
            } else {
                input.value = '';
            }
        });
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
        notifications.error('Ошибка загрузки настроек');
    }
}

// Сохранение одного поля на сервер
async function saveField(field, inputId, statusId) {
    const value = document.getElementById(inputId).value.trim();
    if (!value) {
        document.getElementById(statusId).textContent = 'Укажите путь';
        document.getElementById(statusId).style.color = '#f87171';
        notifications.warning('Укажите путь перед сохранением');
        setTimeout(() => {
            document.getElementById(statusId).textContent = '';
        }, 2000);
        return;
    }
    
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        settings[field] = value;
        
        const saveResponse = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings)
        });
        
        const result = await saveResponse.json();
        
        const statusEl = document.getElementById(statusId);
        if (result.success) {
            statusEl.textContent = '✓ Сохранено';
            statusEl.style.color = '#4ade80';
            notifications.success('Настройки сохранены успешно');
        } else {
            statusEl.textContent = '❌ Ошибка';
            statusEl.style.color = '#f87171';
            notifications.error('Ошибка сохранения настроек');
        }
        
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    } catch (e) {
        const statusEl = document.getElementById(statusId);
        statusEl.textContent = '❌ Ошибка';
        statusEl.style.color = '#f87171';
        notifications.error('Ошибка сохранения: ' + e.message);
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    }
}

// Сброс одного поля
async function resetField(field, inputId, statusId) {
    try {
        const response = await fetch(`/api/settings/reset/${field}`, {
            method: 'POST',
        });
        
        const result = await response.json();
        const statusEl = document.getElementById(statusId);
        const input = document.getElementById(inputId);
        
        if (result.success) {
            input.value = '';
            statusEl.textContent = '✓ Сброшено';
            statusEl.style.color = '#4ade80';
            notifications.success('Поле сброшено');
        } else {
            statusEl.textContent = '❌ Ошибка';
            statusEl.style.color = '#f87171';
            notifications.error('Ошибка сброса');
        }
        
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    } catch (e) {
        const statusEl = document.getElementById(statusId);
        statusEl.textContent = '❌ Ошибка';
        statusEl.style.color = '#f87171';
        notifications.error('Ошибка: ' + e.message);
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    }
}

// Открытие проводника через сервер
async function browseFile(inputId, type = 'file') {
    const btn = document.querySelector(`[data-target="${inputId}"]`);
    const field = btn?.dataset.field;
    if (!field) {
        console.error('Не найден field для inputId:', inputId);
        notifications.error('Ошибка: не найден параметр');
        return;
    }
    
    // Показываем, что процесс начался
    const statusId = `status-${field}`;
    const statusEl = document.getElementById(statusId);
    statusEl.textContent = '⏳ Открывается диалог...';
    statusEl.style.color = '#60a5fa';
    notifications.info('Открывается диалог выбора...');
    
    try {
        const endpoint = type === 'folder' ? '/api/browse/folder' : '/api/browse/file';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                field: field,
                inputId: inputId
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.path) {
            const input = document.getElementById(inputId);
            input.value = result.path;
            
            // Автоматически сохраняем после выбора
            await saveField(field, inputId, statusId);
            
            notifications.success('Путь выбран и сохранён');
        } else if (!result.success) {
            statusEl.textContent = '❌ ' + (result.message || 'Ошибка выбора');
            statusEl.style.color = '#f87171';
            notifications.error(result.message || 'Ошибка выбора');
            setTimeout(() => {
                statusEl.textContent = '';
            }, 3000);
        }
    } catch (e) {
        console.error('Ошибка открытия проводника:', e);
        statusEl.textContent = '❌ Ошибка: ' + e.message;
        statusEl.style.color = '#f87171';
        notifications.error('Ошибка: ' + e.message);
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);
    }
}

// Открыть выбранную папку в проводнике
async function openInExplorer(inputId) {
    const input = document.getElementById(inputId);
    const path = input.value.trim();
    
    if (!path) {
        notifications.warning('Сначала выберите путь');
        return;
    }
    
    try {
        const response = await fetch('/api/open/explorer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: path })
        });
        
        const result = await response.json();
        
        if (result.success) {
            notifications.success(result.message);
        } else {
            notifications.error(result.message);
        }
    } catch (e) {
        notifications.error('Ошибка: ' + e.message);
    }
}

// Старые функции совместимости (если нужны)
function showNotification(message, type = 'info', duration = null) {
    return notifications.show(message, type, duration);
}

function openSettings() {
    document.getElementById('settingsPage').style.display = 'flex';
    loadSettings();
}

function closeSettings() {
    document.getElementById('settingsPage').style.display = 'none';
}

// Вешаем обработчики после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.save-single-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const field = this.dataset.field;
            const target = this.dataset.target;
            const statusId = `status-${field}`;
            saveField(field, target, statusId);
        });
    });
    
    document.querySelectorAll('.reset-single-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const field = this.dataset.field;
            const target = this.dataset.target;
            const statusId = `status-${field}`;
            resetField(field, target, statusId);
        });
    });
    
    document.querySelectorAll('.browse-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.dataset.target;
            const type = this.dataset.type || 'file';
            browseFile(target, type);
        });
    });
    
    // Добавляем кнопки "Открыть в проводнике"
    document.querySelectorAll('.open-explorer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.dataset.target;
            openInExplorer(target);
        });
    });
});