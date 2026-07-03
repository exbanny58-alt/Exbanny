let swiper = null;

// Функция показа менеджера
function showManager() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('managerPage').style.display = 'grid';
    
    // Инициализируем слайдер после показа
    initSwiper();
}

// Функция показа лендинга
function showLanding() {
    document.getElementById('managerPage').style.display = 'none';
    document.getElementById('landingPage').style.display = 'flex';
    
    // Уничтожаем слайдер при скрытии
    if (swiper) {
        swiper.destroy(true, true);
        swiper = null;
    }
}

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
            },
        },
        pagination: {
            el: ".swiper-pagination",
        },
    });

    // Прокрутка колёсиком мыши (без задержки)
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

// Навигация
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach((navItem) => {
    navItem.addEventListener("click", (e) => {
        e.preventDefault();

        const activeItem = document.querySelector(".nav-item.active");
        if (activeItem) {
            activeItem.classList.remove("active");
        }

        navItem.classList.add("active");
    });
});

// Музыкальный плеер (заглушка)
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

playPauseButton.addEventListener("click", togglePlay);

forwardButton.addEventListener("click", function() {
    console.log("Forward");
});

backwardButton.addEventListener("click", function() {
    console.log("Backward");
});

progress.addEventListener("input", function() {
    console.log("Progress:", this.value);
});