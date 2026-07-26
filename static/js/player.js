// ============================================
// ПЛАВАЮЩИЙ МУЗЫКАЛЬНЫЙ ПЛЕЕР (OVERLAY)
// ============================================

let isPlayerOpen = false;
let isPlayerMinimized = false;
let swiperInstance = null;
let currentSongIndex = 3;
let isPlayerInitialized = false;

// ============================================
// ПЛЕЙЛИСТ
// ============================================
const playerSongs = [
    {
        title: "Symphony",
        name: "Clean Bandit ft. Zara Larsson",
        source: "https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Clean-Bandit-Symphony.mp3",
        cover: "https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/d3ca28bf-e1b7-467e-a00b-c7785be8e397"
    },
    {
        title: "Pawn It All",
        name: "Alicia Keys",
        source: "https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Pawn-It-All.mp3",
        cover: "https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/1afe4c6a-0287-43f0-9076-92f8be49d9dc"
    },
    {
        title: "Seni Dert Etmeler",
        name: "Madrigal",
        source: "https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Madrigal-Seni-Dert-Etmeler.mp3",
        cover: "https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/abaa23bd-8c93-4219-a3ef-0d0cb6f12566"
    },
    {
        title: "Instant Crush",
        name: "Daft Punk ft. Julian Casablancas",
        source: "https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Daft-Punk-Instant-Crush.mp3",
        cover: "https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/bd9bcc80-a9ab-4d54-a460-ffdb77f22a72"
    },
    {
        title: "As It Was",
        name: "Harry Styles",
        source: "https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Harry-Styles-As-It-Was.mp3",
        cover: "https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/18bc2436-740b-44c4-9dd8-fd7be51a07ad"
    },
    {
        title: "Physical",
        name: "Dua Lipa",
        source: "https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Dua-Lipa-Physical.mp3",
        cover: "https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/4c5c1727-8b32-48c1-91de-b0496ccf10f6"
    },
    {
        title: "Delicate",
        name: "Taylor Swift",
        source: "https://github.com/ecemgo/mini-samples-great-tricks/raw/main/song-list/Taylor-Swift-Delicate.mp3",
        cover: "https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/23e440e5-a0fa-4a85-8175-bcc485a20ee6"
    }
];

// ============================================
// DOM ЭЛЕМЕНТЫ
// ============================================
const playerWindow = document.getElementById('playerWindow');
const playerWindowBody = document.getElementById('playerWindowBody');
const playerFloatBtn = document.getElementById('playerFloatBtn');
const playerMinimizeBtn = document.getElementById('playerMinimizeBtn');
const playerCloseBtn = document.getElementById('playerCloseBtn');
const playerMini = document.getElementById('playerMini');
const playerMiniTitle = document.getElementById('playerMiniTitle');
const playerMiniArtist = document.getElementById('playerMiniArtist');
const playerMiniPlay = document.getElementById('playerMiniPlay');
const playerMiniIcon = document.getElementById('playerMiniIcon');
const playerMiniExpand = document.getElementById('playerMiniExpand');

const playerProgress = document.getElementById('playerProgress');
const playerAudio = document.getElementById('playerAudio');
const playerControlIcon = document.getElementById('playerControlIcon');
const playPauseButton = document.querySelector('.player-play-pause');
const nextButton = document.querySelector('.player-forward');
const prevButton = document.querySelector('.player-backward');
const songTitle = document.getElementById('playerSongTitle');
const artistName = document.getElementById('playerArtistName');
const nowPlaying = document.getElementById('playerNowPlaying');
const swiperWrapper = document.getElementById('playerSwiperWrapper');

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function initPlayer() {
    if (isPlayerInitialized) return;
    isPlayerInitialized = true;
    
    console.log('🎵 Инициализация плавающего плеера');
    
    renderPlayerSlides();
    updatePlayerSongInfo();
    setupPlayerEventListeners();
    initPlayerSwiper();
    setupPlayerWindowControls();
    
    // Показываем плеер при первом запуске
    setTimeout(() => {
        togglePlayerWindow(true);
    }, 500);
}

// ============================================
// ОТРИСОВКА СЛАЙДОВ
// ============================================
function renderPlayerSlides() {
    if (!swiperWrapper) return;
    
    swiperWrapper.innerHTML = '';
    playerSongs.forEach((song, index) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <img src="${song.cover}" alt="${song.title}" />
            <div class="player-overlay">
                <ion-icon name="logo-youtube"></ion-icon>
            </div>
        `;
        swiperWrapper.appendChild(slide);
    });
}

// ============================================
// ОБНОВЛЕНИЕ ИНФОРМАЦИИ
// ============================================
function updatePlayerSongInfo() {
    const song = playerSongs[currentSongIndex];
    if (!song) return;
    
    songTitle.textContent = song.title;
    artistName.textContent = song.name;
    playerAudio.src = song.source;
    nowPlaying.textContent = `${song.title} — ${song.name}`;
    playerMiniTitle.textContent = song.title;
    playerMiniArtist.textContent = song.name;
}

// ============================================
// УПРАВЛЕНИЕ ВОСПРОИЗВЕДЕНИЕМ
// ============================================
function pausePlayerSong() {
    playerAudio.pause();
    playerControlIcon.classList.remove("fa-pause");
    playerControlIcon.classList.add("fa-play");
    playerMiniIcon.classList.remove("fa-pause");
    playerMiniIcon.classList.add("fa-play");
    playerFloatBtn.classList.remove('playing');
}

function playPlayerSong() {
    playerAudio.play();
    playerControlIcon.classList.add("fa-pause");
    playerControlIcon.classList.remove("fa-play");
    playerMiniIcon.classList.add("fa-pause");
    playerMiniIcon.classList.remove("fa-play");
    playerFloatBtn.classList.add('playing');
}

function togglePlayerPlayPause() {
    if (playerAudio.paused) {
        playPlayerSong();
    } else {
        pausePlayerSong();
    }
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ТРЕКОВ
// ============================================
function nextPlayerSong() {
    currentSongIndex = (currentSongIndex + 1) % playerSongs.length;
    updatePlayerSongInfo();
    if (swiperInstance) {
        swiperInstance.slideTo(currentSongIndex);
    }
    playPlayerSong();
}

function prevPlayerSong() {
    currentSongIndex = (currentSongIndex - 1 + playerSongs.length) % playerSongs.length;
    updatePlayerSongInfo();
    if (swiperInstance) {
        swiperInstance.slideTo(currentSongIndex);
    }
    playPlayerSong();
}

// ============================================
// УПРАВЛЕНИЕ ОКНОМ
// ============================================
function togglePlayerWindow(forceShow) {
    const show = forceShow !== undefined ? forceShow : !isPlayerOpen;
    isPlayerOpen = show;
    
    if (show) {
        playerWindow.classList.remove('hidden', 'minimized');
        playerWindow.classList.add('show');
        playerFloatBtn.classList.add('active');
        playerMini.classList.remove('show');
    } else {
        playerWindow.classList.remove('show', 'minimized');
        playerWindow.classList.add('hidden');
        playerFloatBtn.classList.remove('active');
        playerMini.classList.remove('show');
    }
}

function togglePlayerMinimize() {
    isPlayerMinimized = !isPlayerMinimized;
    
    if (isPlayerMinimized) {
        playerWindow.classList.add('minimized');
        playerWindow.classList.remove('show');
        setTimeout(() => {
            playerWindow.classList.add('hidden');
            playerMini.classList.add('show');
        }, 300);
    } else {
        playerWindow.classList.remove('hidden', 'minimized');
        playerWindow.classList.add('show');
        playerMini.classList.remove('show');
    }
}

function setupPlayerWindowControls() {
    // Кнопка вызова
    playerFloatBtn.addEventListener('click', () => {
        if (isPlayerOpen) {
            togglePlayerWindow(false);
        } else {
            togglePlayerWindow(true);
        }
    });
    
    // Свернуть
    playerMinimizeBtn.addEventListener('click', togglePlayerMinimize);
    
    // Закрыть
    playerCloseBtn.addEventListener('click', () => {
        togglePlayerWindow(false);
    });
    
    // Развернуть из мини
    playerMiniExpand.addEventListener('click', () => {
        isPlayerMinimized = false;
        playerMini.classList.remove('show');
        playerWindow.classList.remove('hidden', 'minimized');
        playerWindow.classList.add('show');
    });
    
    // Плей/пауза в мини
    playerMiniPlay.addEventListener('click', togglePlayerPlayPause);
    
    // Клик по мини-плееру для разворачивания
    playerMini.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            isPlayerMinimized = false;
            playerMini.classList.remove('show');
            playerWindow.classList.remove('hidden', 'minimized');
            playerWindow.classList.add('show');
        }
    });
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ АУДИО
// ============================================
function setupPlayerEventListeners() {
    playerAudio.addEventListener("timeupdate", () => {
        if (!playerAudio.paused) {
            playerProgress.value = playerAudio.currentTime;
        }
    });

    playerAudio.addEventListener("loadedmetadata", () => {
        playerProgress.max = playerAudio.duration;
        playerProgress.value = playerAudio.currentTime;
    });

    playerAudio.addEventListener("ended", () => {
        nextPlayerSong();
    });

    // Кнопки
    playPauseButton.addEventListener("click", togglePlayerPlayPause);

    playerProgress.addEventListener("input", () => {
        playerAudio.currentTime = playerProgress.value;
    });

    playerProgress.addEventListener("change", () => {
        playPlayerSong();
    });

    nextButton.addEventListener("click", nextPlayerSong);
    prevButton.addEventListener("click", prevPlayerSong);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ SWIPER
// ============================================
function initPlayerSwiper() {
    if (typeof Swiper !== 'undefined' && document.querySelector('.player-swiper')) {
        swiperInstance = new Swiper(".player-swiper", {
            effect: "coverflow",
            centeredSlides: true,
            initialSlide: currentSongIndex,
            slidesPerView: "auto",
            grabCursor: true,
            spaceBetween: 40,
            coverflowEffect: {
                rotate: 25,
                stretch: 0,
                depth: 50,
                modifier: 1,
                slideShadows: false,
            },
            navigation: {
                nextEl: ".player-forward",
                prevEl: ".player-backward",
            },
        });

        swiperInstance.on("slideChange", () => {
            if (swiperInstance) {
                currentSongIndex = swiperInstance.activeIndex;
                updatePlayerSongInfo();
                playPlayerSong();
            }
        });
    } else {
        console.warn('⚠️ Swiper не загружен или контейнер не найден');
        // Повторная попытка через 1 секунду
        setTimeout(initPlayerSwiper, 1000);
    }
}

// ============================================
// ЗАГРУЗКА ПРИ СТАРТЕ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем плеер с задержкой, чтобы всё прогрузилось
    setTimeout(initPlayer, 800);
});

// ============================================
// ЭКСПОРТ
// ============================================
window.initPlayer = initPlayer;
window.togglePlayerWindow = togglePlayerWindow;
window.togglePlayerMinimize = togglePlayerMinimize;
window.togglePlayerPlayPause = togglePlayerPlayPause;

console.log('🎵 Плавающий плеер загружен');