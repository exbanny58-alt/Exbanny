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
        // Сначала загружаем все настройки
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        // Обновляем одно поле
        settings[field] = value;
        
        // Сохраняем все настройки
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

// Сброс одного поля (устанавливаем пустую строку)
async function resetField(field, inputId, statusId) {
    try {
        // Отправляем POST запрос на сервер для сброса
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

// Открытие проводника (заглушка)
function browseFile(inputId) {
    const input = document.getElementById(inputId);
    input.removeAttribute('readonly');
    input.focus();
    input.addEventListener('blur', function() {
        input.setAttribute('readonly', true);
    }, { once: true });
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
            browseFile(target);
        });
    });
});