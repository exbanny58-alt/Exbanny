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
    }
}

// Сохранение одного поля на сервер
async function saveField(field, inputId, statusId) {
    const value = document.getElementById(inputId).value.trim();
    if (!value) {
        document.getElementById(statusId).textContent = 'Укажите путь';
        document.getElementById(statusId).style.color = '#f87171';
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
        } else {
            statusEl.textContent = '❌ Ошибка';
            statusEl.style.color = '#f87171';
        }
        
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    } catch (e) {
        const statusEl = document.getElementById(statusId);
        statusEl.textContent = '❌ Ошибка';
        statusEl.style.color = '#f87171';
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
        } else {
            statusEl.textContent = '❌ Ошибка';
            statusEl.style.color = '#f87171';
        }
        
        setTimeout(() => {
            statusEl.textContent = '';
        }, 2000);
    } catch (e) {
        const statusEl = document.getElementById(statusId);
        statusEl.textContent = '❌ Ошибка';
        statusEl.style.color = '#f87171';
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
        return;
    }
    
    // Показываем, что процесс начался
    const statusId = `status-${field}`;
    const statusEl = document.getElementById(statusId);
    statusEl.textContent = '⏳ Открывается диалог...';
    statusEl.style.color = '#60a5fa';
    
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
            
            showNotification('✅ Путь выбран и сохранён');
        } else if (!result.success) {
            statusEl.textContent = '❌ ' + (result.message || 'Ошибка выбора');
            statusEl.style.color = '#f87171';
            setTimeout(() => {
                statusEl.textContent = '';
            }, 3000);
            showNotification('❌ ' + (result.message || 'Ошибка выбора'));
        }
    } catch (e) {
        console.error('Ошибка открытия проводника:', e);
        statusEl.textContent = '❌ Ошибка: ' + e.message;
        statusEl.style.color = '#f87171';
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);
        showNotification('❌ Ошибка: ' + e.message);
    }
}

// Открыть выбранную папку в проводнике
async function openInExplorer(inputId) {
    const input = document.getElementById(inputId);
    const path = input.value.trim();
    
    if (!path) {
        showNotification('⚠️ Сначала выберите путь');
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
            showNotification('✅ ' + result.message);
        } else {
            showNotification('❌ ' + result.message);
        }
    } catch (e) {
        showNotification('❌ Ошибка: ' + e.message);
    }
}

// Уведомления
function showNotification(message) {
    let notification = document.querySelector('.settings-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 21, 61, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 12px 24px;
            color: #fff;
            font-family: "Nunito", sans-serif;
            font-size: 0.9rem;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            transform: translateX(-50%) translateY(20px);
            pointer-events: none;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
    
    clearTimeout(notification._hideTimeout);
    notification._hideTimeout = setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
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