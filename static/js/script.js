// Контент для разных разделов
const pages = {
    server: '<h1>Управление сервером</h1><p>Здесь будет панель управления сервером DayZ</p>',
    game: '<h1>Управление игрой</h1><p>Здесь будут настройки игры</p>',
    mods: '<h1>Управление модами</h1><p>Здесь будет управление модами</p>'
};

// Показать контент
function showContent(page) {
    // Убираем активный класс у всех пунктов
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    // Добавляем активный класс нажатому пункту
    const clickedItem = event.target.closest('.nav-item');
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    const contentArea = document.getElementById('contentArea');
    
    // Показываем контент
    if (pages[page]) {
        contentArea.innerHTML = pages[page];
    }
    
    // Сбрасываем цвета у всех иконок
    document.querySelectorAll('.nav-item a').forEach(link => {
        const icon = link.querySelector('.nav-icon');
        const text = link.querySelector('.nav-text');
        if (icon) icon.style.color = '';
        if (text) text.style.color = '';
    });
}

// Показать настройки
function showSettings() {
    // Убираем активный класс у всех пунктов
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    // Добавляем активный класс настройкам
    const clickedItem = event.target.closest('.nav-item');
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    const contentArea = document.getElementById('contentArea');
    
    // Загружаем настройки через fetch
    fetch('/settings-content')
        .then(response => response.text())
        .then(html => {
            contentArea.innerHTML = html;
            // Перезагружаем скрипты настроек
            loadSettings();
            // Вешаем обработчики
            attachSettingsHandlers();
        })
        .catch(() => {
            contentArea.innerHTML = `
                <div class="settings-content-wrapper">
                    <div class="settings-header">
                        <h1>⚙️ Настройки</h1>
                        <p class="settings-subtitle">Укажите пути к файлам и папкам DayZ</p>
                    </div>
                    <div class="settings-body">
                        <p style="color: rgba(255,255,255,0.5); text-align: center; padding: 40px;">
                            Загрузка настроек...
                        </p>
                    </div>
                </div>
            `;
        });
    
    // Сбрасываем цвета у всех иконок
    document.querySelectorAll('.nav-item a').forEach(link => {
        const icon = link.querySelector('.nav-icon');
        const text = link.querySelector('.nav-text');
        if (icon) icon.style.color = '';
        if (text) text.style.color = '';
    });
}

// Прикрепляем обработчики для настроек
function attachSettingsHandlers() {
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
}

// Случайные цвета для иконок при наведении
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item a');
    
    const colors = [
        '#FF6B6B', '#FF4757', '#FF8A5C', '#FF6348', '#FF9F43',
        '#FECA57', '#FFD93D', '#00B894', '#00CEC9', '#55EFC4',
        '#0984E3', '#45B7D1', '#74B9FF', '#6C5CE7', '#A29BFE',
        '#7BED9F', '#70A1FF', '#FFAF40', '#FF4D4D', '#D980FA'
    ];
    
    let lastColor = null;
    let lastColor2 = null;
    
    function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function getUniqueRandomColor() {
        let newColor;
        let attempts = 0;
        do {
            newColor = getRandomColor();
            attempts++;
            if (attempts > 50) break;
        } while (newColor === lastColor || newColor === lastColor2);
        
        lastColor2 = lastColor;
        lastColor = newColor;
        return newColor;
    }
    
    navItems.forEach(item => {
        const icon = item.querySelector('.nav-icon');
        const text = item.querySelector('.nav-text');
        
        item.addEventListener('mouseenter', function() {
            const color = getUniqueRandomColor();
            if (icon) {
                icon.style.color = color;
                icon.style.transition = 'color 0.3s ease, transform 0.3s ease';
            }
            if (text) {
                text.style.color = color;
                text.style.transition = 'color 0.3s ease';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (icon) {
                icon.style.color = '';
            }
            if (text) {
                text.style.color = '';
            }
        });
    });
});