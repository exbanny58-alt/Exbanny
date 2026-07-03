// Контент для разных разделов
const pages = {
    server: {
        left: '<h1>Управление сервером</h1><p>Запуск, остановка, мониторинг, логи сервера DayZ.</p>',
        right: '<h1>Статус сервера</h1><p>Сервер онлайн</p>'
    },
    game: {
        left: '<h1>Управление игрой</h1><p>Конфигурация игры, параметры мира, расписание рестартов.</p>',
        right: '<h1>Параметры</h1><p>Настройки игрового процесса</p>'
    },
    mods: {
        left: '<h1>Управление модами</h1><p>Установка, обновление, порядок загрузки модов.</p>',
        right: '<h1>Моды</h1><p>Список установленных модов</p>'
    },
    stats: {
        left: '<h1>Статистика</h1><p>В разработке</p>',
        right: '<h1>Графики</h1><p>В разработке</p>'
    },
    players: {
        left: '<h1>Игроки</h1><p>В разработке</p>',
        right: '<h1>Список</h1><p>В разработке</p>'
    },
    config: {
        left: '<h1>Настройки</h1><p>В разработке</p>',
        right: '<h1>Конфигурация</h1><p>В разработке</p>'
    },
    profile: {
        left: '<h1>Профиль</h1><p>В разработке</p>',
        right: '<h1>Данные</h1><p>В разработке</p>'
    }
};

// Навигация
function navigateTo(page) {
    const leftContent = document.getElementById('dynamicContent');
    const rightPanel = document.getElementById('rightPanel');
    
    if (pages[page]) {
        leftContent.innerHTML = pages[page].left;
        rightPanel.innerHTML = pages[page].right;
    }
    
    // Подсветка активного пункта меню
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
}

// Переключение между лендингом и менеджером
function showManager() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('managerPage').style.display = 'grid';
    initSwiper();
}

function showLanding() {
    document.getElementById('managerPage').style.display = 'none';
    document.getElementById('landingPage').style.display = 'flex';
    if (typeof swiper !== 'undefined' && swiper) {
        swiper.destroy(true, true);
        swiper = null;
    }
}