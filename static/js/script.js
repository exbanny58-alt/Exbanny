// Контент для разных разделов
const pages = {
    server: '<h1>Управление сервером</h1><p>Здесь будет панель управления сервером DayZ</p>',
    game: '<h1>Управление игрой</h1><p>Здесь будут настройки игры</p>',
    mods: '<h1>Управление модами</h1><p>Здесь будет управление модами</p>'
};

// Текущий активный раздел
let currentPage = null;

// Флаг, был ли первый клик
let isFirstClick = true;

// Массив пунктов меню в порядке сверху вниз
const menuOrder = ['server', 'game', 'mods', 'settings'];

// Получить HTML стартовой страницы
function getStartPageHTML() {
    return `
        <div id="startPage" class="start-page">
            <div class="start-content">
                <div class="start-logo">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <polyline points="9 12 11 14 15 10"/>
                    </svg>
                </div>
                <h1>DayZ Менеджер</h1>
                <p>Выберите раздел в меню слева</p>
                <div class="start-hint">
                    <span class="hint-dot"></span>
                    <span class="hint-dot"></span>
                    <span class="hint-dot"></span>
                </div>
            </div>
        </div>
    `;
}

// Определить направление анимации
function getAnimationDirection(targetPage) {
    if (!currentPage) {
        return 'in';
    }
    
    const currentIndex = menuOrder.indexOf(currentPage);
    const targetIndex = menuOrder.indexOf(targetPage);
    
    if (currentIndex === -1 || targetIndex === -1) {
        return 'in';
    }
    
    if (targetIndex < currentIndex) {
        return 'down';
    } else if (targetIndex > currentIndex) {
        return 'up';
    } else {
        return 'in';
    }
}

// Универсальная функция смены контента с анимацией
function switchContent(newHtml, page, direction, isFirst) {
    const contentArea = document.getElementById('contentArea');
    
    // Если это первый клик - стартовая страница уезжает
    if (isFirst) {
        contentArea.classList.add('slide-up');
        
        setTimeout(() => {
            contentArea.innerHTML = newHtml;
            contentArea.classList.remove('slide-up');
            contentArea.classList.add('slide-in-down');
            
            setTimeout(() => {
                contentArea.classList.remove('slide-in-down');
            }, 350);
        }, 300);
        return;
    }
    
    // Если direction = 'in' - просто появляемся без ухода
    if (direction === 'in') {
        contentArea.innerHTML = newHtml;
        contentArea.classList.add('slide-in-up');
        setTimeout(() => {
            contentArea.classList.remove('slide-in-up');
        }, 350);
        return;
    }
    
    // Запускаем анимацию ухода
    contentArea.classList.add(direction === 'up' ? 'slide-up' : 'slide-down');
    
    setTimeout(() => {
        contentArea.innerHTML = newHtml;
        contentArea.classList.remove('slide-up', 'slide-down');
        contentArea.classList.add(direction === 'up' ? 'slide-in-down' : 'slide-in-up');
        
        setTimeout(() => {
            contentArea.classList.remove('slide-in-down', 'slide-in-up');
        }, 350);
        
    }, 300);
}

// Показать стартовую страницу
function showStartPage(direction = 'in') {
    // Убираем активный класс у всех пунктов меню
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Сбрасываем цвета у всех иконок
    document.querySelectorAll('.nav-item a').forEach(link => {
        const icon = link.querySelector('.nav-icon');
        const text = link.querySelector('.nav-text');
        if (icon) icon.style.color = '';
        if (text) text.style.color = '';
    });
    
    // Получаем HTML стартовой страницы
    const html = getStartPageHTML();
    
    // Переключаем контент
    switchContent(html, 'start', direction, false);
    
    // Обновляем текущую страницу
    currentPage = null;
}

// Показать контент
function showContent(page) {
    // Получаем элемент, по которому кликнули
    const clickedItem = event.target.closest('.nav-item');
    if (!clickedItem) return;
    
    // Проверяем - если этот пункт уже активен, закрываем его
    if (clickedItem.classList.contains('active')) {
        // Показываем стартовую страницу
        const direction = currentPage ? getAnimationDirection('start') : 'in';
        showStartPage(direction);
        return;
    }
    
    // Убираем активный класс у всех пунктов
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем активный класс нажатому пункту
    clickedItem.classList.add('active');
    
    // Определяем направление анимации
    const direction = getAnimationDirection(page);
    
    // Получаем HTML контента
    const html = pages[page] || '<h1>Страница не найдена</h1>';
    
    // Переключаем контент (передаём флаг первого клика)
    switchContent(html, page, direction, isFirstClick);
    
    // После первого клика снимаем флаг
    if (isFirstClick) {
        isFirstClick = false;
    }
    
    // Обновляем текущую страницу
    currentPage = page;
    
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
    // Получаем элемент, по которому кликнули
    const clickedItem = event.target.closest('.nav-item');
    if (!clickedItem) return;
    
    // Проверяем - если настройки уже активны, закрываем их
    if (clickedItem.classList.contains('active')) {
        const direction = currentPage ? getAnimationDirection('start') : 'in';
        showStartPage(direction);
        return;
    }
    
    // Убираем активный класс у всех пунктов
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем активный класс настройкам
    clickedItem.classList.add('active');
    
    // Определяем направление анимации
    const direction = getAnimationDirection('settings');
    
    const contentArea = document.getElementById('contentArea');
    
    // Если это первый клик - стартовая страница уезжает
    if (isFirstClick) {
        contentArea.classList.add('slide-up');
        
        setTimeout(() => {
            fetch('/settings-content')
                .then(response => response.text())
                .then(html => {
                    contentArea.innerHTML = html;
                    loadSettings();
                    attachSettingsHandlers();
                    contentArea.classList.remove('slide-up');
                    contentArea.classList.add('slide-in-down');
                    setTimeout(() => {
                        contentArea.classList.remove('slide-in-down');
                    }, 350);
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
                    contentArea.classList.remove('slide-up');
                    contentArea.classList.add('slide-in-down');
                    setTimeout(() => {
                        contentArea.classList.remove('slide-in-down');
                    }, 350);
                });
        }, 300);
        
        isFirstClick = false;
        currentPage = 'settings';
        return;
    }
    
    // Если direction = 'in' - просто загружаем без анимации ухода
    if (direction === 'in') {
        fetch('/settings-content')
            .then(response => response.text())
            .then(html => {
                contentArea.innerHTML = html;
                loadSettings();
                attachSettingsHandlers();
                contentArea.classList.add('slide-in-up');
                setTimeout(() => {
                    contentArea.classList.remove('slide-in-up');
                }, 350);
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
                contentArea.classList.add('slide-in-up');
                setTimeout(() => {
                    contentArea.classList.remove('slide-in-up');
                }, 350);
            });
        
        currentPage = 'settings';
        return;
    }
    
    // Запускаем анимацию ухода
    contentArea.classList.add(direction === 'up' ? 'slide-up' : 'slide-down');
    
    setTimeout(() => {
        fetch('/settings-content')
            .then(response => response.text())
            .then(html => {
                contentArea.innerHTML = html;
                loadSettings();
                attachSettingsHandlers();
                
                contentArea.classList.remove('slide-up', 'slide-down');
                contentArea.classList.add(direction === 'up' ? 'slide-in-down' : 'slide-in-up');
                
                setTimeout(() => {
                    contentArea.classList.remove('slide-in-down', 'slide-in-up');
                }, 350);
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
                contentArea.classList.remove('slide-up', 'slide-down');
                contentArea.classList.add(direction === 'up' ? 'slide-in-down' : 'slide-in-up');
                setTimeout(() => {
                    contentArea.classList.remove('slide-in-down', 'slide-in-up');
                }, 350);
            });
            
    }, 300);
    
    // Обновляем текущую страницу
    currentPage = 'settings';
    
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