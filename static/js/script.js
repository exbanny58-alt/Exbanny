let swiper = null;

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
    const activeItem = document.querySelector(`.nav-item a[onclick*="${page}"]`);
    if (activeItem) {
        activeItem.closest('.nav-item').classList.add('active');
    }
}

// Инициализация слайдера
function initSwiper() {
    if (swiper) return;

    swiper = new Swiper(".swiper", {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        speed: 600,
        slidesPerView: "auto",
        coverflowEffect: {
            rotate: 10,
            stretch: 120,
            depth: 200,
            modifier: 1,
            slideShadows: false,
        },
        on: {
            click(event) {
                swiper.slideTo(this.clickedIndex);
                updateContent(this.clickedIndex);
            },
            slideChange() {
                updateContent(this.realIndex);
            },
        },
        pagination: {
            el: ".swiper-pagination",
        },
    });

    const swiperContainer = document.querySelector(".swiper");
    swiperContainer.addEventListener("wheel", function(e) {
        e.preventDefault();
        if (e.deltaY > 0) {
            swiper.slideNext();
        } else {
            swiper.slidePrev();
        }
    }, { passive: false });
}

// Обновление контента под слайдером
function updateContent(index) {
    const contentPlaceholder = document.getElementById('dynamicContent');
    
    const slides = [
        { title: 'Управление сервером', text: 'Здесь будет панель управления сервером DayZ: запуск, остановка, мониторинг, логи.' },
        { title: 'Управление игрой', text: 'Здесь будут настройки игры: конфиги, параметры мира, расписание рестартов.' },
        { title: 'Управление модами', text: 'Здесь будет управление модами: установка, обновление, порядок загрузки.' }
    ];
    
    if (slides[index]) {
        contentPlaceholder.innerHTML = `
            <h1>${slides[index].title}</h1>
            <p>${slides[index].text}</p>
        `;
    }
}

// Музыкальный плеер
const progress = document.getElementById("progress");
const controlIcon = document.getElementById("controlIcon");
const playPauseButton = document.querySelector(".play-pause-btn");
const forwardButton = document.querySelector(".controls button.forward");
const backwardButton = document.querySelector(".controls button.backward");
const rotatingImage = document.getElementById("rotatingImage");

let rotating = false;
let currentRotation = 0;
let rotationInterval;

function startRotation() {
    if (!rotating) {
        rotating = true;
        rotationInterval = setInterval(rotateImage, 50);
    }
}

function pauseRotation() {
    clearInterval(rotationInterval);
    rotating = false;
}

function rotateImage() {
    currentRotation += 1;
    rotatingImage.style.transform = `rotate(${currentRotation}deg)`;
}

function togglePlay() {
    if (controlIcon.classList.contains("fa-play")) {
        controlIcon.classList.remove("fa-play");
        controlIcon.classList.add("fa-pause");
        startRotation();
    } else {
        controlIcon.classList.remove("fa-pause");
        controlIcon.classList.add("fa-play");
        pauseRotation();
    }
}

if (playPauseButton) {
    playPauseButton.addEventListener("click", togglePlay);
}

if (forwardButton) {
    forwardButton.addEventListener("click", function() {
        console.log("Forward");
    });
}

if (backwardButton) {
    backwardButton.addEventListener("click", function() {
        console.log("Backward");
    });
}

if (progress) {
    progress.addEventListener("input", function() {
        console.log("Progress:", this.value);
    });
}

// Навигация по клику на пункты меню
document.querySelectorAll('.nav-item a').forEach(link => {
    link.addEventListener('click', function(e) {
        const onclick = this.getAttribute('onclick') || '';
        if (onclick.includes('openSettings')) {
            return;
        }
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        this.closest('.nav-item').classList.add('active');
    });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initSwiper();
    updateContent(0);
});