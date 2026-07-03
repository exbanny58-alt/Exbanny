// Загрузка сохранённых путей из localStorage
function loadSettings() {
    const fields = ['server_exe', 'game_exe', 'workshop', 'custom_mods'];
    const inputIds = ['server-exe-path', 'game-exe-path', 'workshop-path', 'custom-mods-path'];
    
    fields.forEach((field, i) => {
        const saved = localStorage.getItem(`dayz_${field}`);
        if (saved) {
            document.getElementById(inputIds[i]).value = saved;
        }
    });
}

// Сохранение одного поля
function saveField(field, inputId, statusId) {
    const value = document.getElementById(inputId).value.trim();
    if (!value) {
        document.getElementById(statusId).textContent = 'Укажите путь';
        document.getElementById(statusId).style.color = '#f87171';
        return;
    }
    
    localStorage.setItem(`dayz_${field}`, value);
    document.getElementById(statusId).textContent = '✓ Сохранено';
    document.getElementById(statusId).style.color = '#4ade80';
    setTimeout(() => {
        document.getElementById(statusId).textContent = '';
    }, 2000);
}

// Сброс одного поля
function resetField(field, inputId, statusId) {
    localStorage.removeItem(`dayz_${field}`);
    document.getElementById(inputId).value = '';
    document.getElementById(statusId).textContent = 'Сброшено';
    document.getElementById(statusId).style.color = '#94a3b8';
    setTimeout(() => {
        document.getElementById(statusId).textContent = '';
    }, 2000);
}

// Открытие проводника (заглушка — в вебе нельзя открыть проводник)
function browseFile(inputId) {
    // Для веб-версии просто разблокируем поле для ручного ввода
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
    // Кнопки Сохранить
    document.querySelectorAll('.save-single-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const field = this.dataset.field;
            const target = this.dataset.target;
            const statusId = `status-${field}`;
            saveField(field, target, statusId);
        });
    });
    
    // Кнопки Сбросить
    document.querySelectorAll('.reset-single-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const field = this.dataset.field;
            const target = this.dataset.target;
            const statusId = `status-${field}`;
            resetField(field, target, statusId);
        });
    });
    
    // Кнопки Обзор
    document.querySelectorAll('.browse-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.dataset.target;
            browseFile(target);
        });
    });
});