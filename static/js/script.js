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
//-------------------------------------------
// Случайные цвета для иконок при наведении
//-------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item a');
    
    // Расширенный массив ярких и насыщенных цветов
    const colors = [
        // Красные и розовые
        '#FF6B6B', // ярко-красный
        '#FF4757', // алый
        '#FF3838', // огненно-красный
        '#FF6B81', // розово-красный
        '#FD79A8', // розовый
        '#F368E0', // ярко-розовый
        '#E84393', // малиновый
        '#D63384', // пурпурный
        
        // Оранжевые и желтые
        '#FF8A5C', // оранжевый
        '#FF6348', // красно-оранжевый
        '#FF9F43', // мандариновый
        '#FECA57', // золотой
        '#FFD93D', // желтый
        '#FDCB6E', // янтарный
        '#F39C12', // охристый
        
        // Зеленые
        '#00B894', // изумрудный
        '#00CEC9', // темно-бирюзовый
        '#55EFC4', // мятный
        '#A3CB38', // салатовый
        '#6AB04C', // зеленый
        '#2ED573', // ярко-зеленый
        '#27AE60', // изумрудно-зеленый
        
        // Синие и голубые
        '#0984E3', // синий
        '#45B7D1', // голубой
        '#74B9FF', // светло-голубой
        '#4ECDC4', // бирюзовый
        '#00D2D3', // ярко-бирюзовый
        '#1B9CFC', // королевский синий
        '#4834D4', // темно-синий
        
        // Фиолетовые
        '#6C5CE7', // фиолетовый
        '#A29BFE', // светло-фиолетовый
        '#9B59B6', // пурпурный
        '#BE2EDD', // ярко-фиолетовый
        '#8E44AD', // темно-фиолетовый
        '#DDA0DD', // сливовый
        '#CD84F1', // лавандовый
        
        // Неоновые
        '#7BED9F', // неоново-зеленый
        '#70A1FF', // неоново-синий
        '#FFAF40', // неоново-оранжевый
        '#FF4D4D', // неоново-красный
        '#D980FA', // неоново-фиолетовый
        '#F8A5C2', // неоново-розовый
        
        // Пастельные
        '#FFB3B3', // пастельно-красный
        '#FFD3B3', // пастельно-оранжевый
        '#FFFFB3', // пастельно-желтый
        '#B3FFB3', // пастельно-зеленый
        '#B3D4FF', // пастельно-голубой
        '#E6B3FF', // пастельно-фиолетовый
        '#FFB3E6', // пастельно-розовый
        
        // Яркие и насыщенные
        '#FF0000', // красный
        '#FF7700', // оранжевый
        '#FFDD00', // желтый
        '#00FF00', // зеленый
        '#00DDFF', // голубой
        '#0066FF', // синий
        '#9900FF', // фиолетовый
        '#FF00FF', // маджента
    ];
    
    // Функция для получения случайного цвета
    function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Функция для получения случайного цвета, отличного от предыдущего
    let lastColor = null;
    let lastColor2 = null; // Запоминаем два последних цвета для разнообразия
    
    function getUniqueRandomColor() {
        let newColor;
        let attempts = 0;
        do {
            newColor = getRandomColor();
            attempts++;
            // Если слишком много попыток, просто берем случайный
            if (attempts > 50) break;
        } while (newColor === lastColor || newColor === lastColor2);
        
        lastColor2 = lastColor;
        lastColor = newColor;
        return newColor;
    }
    
    // Добавляем обработчики для каждой иконки
    navItems.forEach(item => {
        const icon = item.querySelector('.nav-icon');
        const text = item.querySelector('.nav-text');
        
        // При наведении меняем цвет на случайный
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
        
        // При уходе мыши возвращаем цвет (если не активный)
        item.addEventListener('mouseleave', function() {
            const isActive = this.closest('.nav-item').classList.contains('active');
            if (!isActive) {
                if (icon) {
                    icon.style.color = '';
                }
                if (text) {
                    text.style.color = '';
                }
            }
        });
    });
});