// player.js - Аудиоплеер с молниеносной реакцией на затухание
// + IDLE-режим: пульсация и подпрыгивание для привлечения внимания
const Player = {
    playlist: [],
    currentTrackIndex: -1,
    isPlaying: false,
    isOpen: false,
    audio: null,
    
    // ===== IDLE-режим (привлечение внимания) =====
    idleMode: {
        enabled: true,
        idleStartTime: null,
        pulseInterval: null,
        bounceInterval: null,
        isBouncing: false,
        isPulsing: false,
        idleThreshold: 20000, // 20 секунд бездействия → начинаем прыгать
        pulseSpeed: 1200,     // скорость пульсации (мс)
        bounceHeight: 12,     // высота подпрыгивания (px)
        bounceDuration: 700,  // длительность одного прыжка
        bounceIntervalTime: 5800, // интервал между прыжками
        lastInteractionTime: 0,
    },
    
    // AudioContext для анализа
    audioContext: null,
    analyser: null,
    dataArray: null,
    sourceNode: null,
    bassInterval: null,
    
    // Настройки пульсации
    bassConfig: {
        kickRange: {
            min: 80,
            max: 200
        },
        sensitivity: 0.2,
        smoothing: 0.15,
        minThreshold: 0.05,
        flashDuration: 80,
        intensityMultiplier: 2.0,
        decaySpeed: 0.92,
        minDecay: 0.02
    },
    
    bassState: {
        currentIntensity: 0,
        isFlashing: false,
        flashTimeout: null,
        lastFlashTime: 0,
        kickBass: 0,
    },
    
    frequencyCache: null,
    elements: {},
    
    init() {
        this.createPlayer();
        this.bindEvents();
        this.loadPlaylist();
        this.startIdleMode();
        console.log('🎵 Аудиоплеер DayzM инициализирован');
    },
    
    createPlayer() {
        const old = document.getElementById('dayzmPlayer');
        if (old) old.remove();
        
        const player = document.createElement('div');
        player.id = 'dayzmPlayer';
        player.className = 'dayzm-player';
        player.innerHTML = `
            <div class="player-toggle" id="playerToggle">
                <span class="pulse-ring"></span>
                <span class="pulse-ring"></span>
                <span class="pulse-ring"></span>
                <span class="bass-ring"></span>
                <!-- IDLE-кольцо для привлечения внимания -->
                <span class="idle-ring"></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                    <path d="M9 9l12-2"/>
                </svg>
                <span class="player-badge" id="playerBadge">0</span>
            </div>
            
            <div class="player-body" id="playerBody">
                <div class="player-header">
                    <div class="player-header-left">
                        <div class="player-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                                <path d="M9 9l12-2"/>
                            </svg>
                        </div>
                        <h3>Аудиоплеер</h3>
                    </div>
                    <button class="player-close" id="playerClose">✕</button>
                </div>
                
                <div class="player-track">
                    <div class="track-info">
                        <div class="track-title" id="trackTitle">Нет трека</div>
                        <div class="track-artist" id="trackArtist">—</div>
                    </div>
                </div>
                
                <div class="player-controls">
                    <button class="ctrl-btn" id="prevBtn" title="Предыдущий">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="19 20 9 12 19 4 19 20"/>
                            <line x1="5" y1="19" x2="5" y2="5"/>
                        </svg>
                    </button>
                    <button class="ctrl-btn play-btn" id="playBtn" title="Play / Pause">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </button>
                    <button class="ctrl-btn" id="nextBtn" title="Следующий">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5 4 15 12 5 20 5 4"/>
                            <line x1="19" y1="5" x2="19" y2="19"/>
                        </svg>
                    </button>
                </div>
                
                <div class="player-progress">
                    <span class="time" id="currentTime">0:00</span>
                    <input type="range" id="progressSlider" value="0" min="0" max="100" step="0.1">
                    <span class="time" id="totalTime">0:00</span>
                </div>
                
                <div class="player-bottom">
                    <div class="player-volume">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        <input type="range" id="volumeSlider" min="0" max="100" value="80">
                    </div>
                    <div class="player-actions">
                        <button class="playlist-toggle" id="playlistToggle" title="Плейлист">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"/>
                                <line x1="8" y1="12" x2="21" y2="12"/>
                                <line x1="8" y1="18" x2="21" y2="18"/>
                                <line x1="3" y1="6" x2="3.01" y2="6"/>
                                <line x1="3" y1="12" x2="3.01" y2="12"/>
                                <line x1="3" y1="18" x2="3.01" y2="18"/>
                            </svg>
                            <span class="playlist-count" id="playlistCount">0</span>
                        </button>
                        <button class="add-track" id="addTrack" title="Добавить трек">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="player-playlist" id="playerPlaylist">
                    <div class="playlist-header">
                        <span>Плейлист</span>
                        <span class="playlist-empty-msg" id="emptyMsg">Нет треков</span>
                    </div>
                    <div class="playlist-list" id="playlistList">
                        <div class="playlist-empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                                <path d="M3 12a5 5 0 0 1 0-8"/>
                                <path d="M21 12a5 5 0 0 0 0-8"/>
                                <path d="M6 15a3 3 0 0 1 0-6"/>
                                <path d="M18 15a3 3 0 0 0 0-6"/>
                            </svg>
                            <p>Перетащите аудиофайлы сюда<br>или нажмите <strong>+</strong></p>
                        </div>
                    </div>
                </div>                
                <input type="file" id="fileInput" accept="audio/*" multiple style="display:none">
            </div>
        `;
        
        document.body.appendChild(player);
        this.elements = this.getElements();
        this.audio = new Audio();
        this.bindPlayerEvents();
        
        // Добавляем стили для IDLE-колец
        this.injectIdleStyles();
    },
    
    injectIdleStyles() {
        const styleId = 'dayzm-idle-styles';
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* ===== IDLE-кольцо — пульсация ===== */
            .player-toggle .idle-ring {
                position: absolute;
                top: -6px;
                left: -6px;
                right: -6px;
                bottom: -6px;
                border: 2px solid var(--accent);
                border-radius: 50%;
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s ease;
                box-shadow: 0 0 20px var(--accent-glow);
            }
            
            .player-toggle.idle-pulse .idle-ring {
                animation: idlePulse 1.2s ease-in-out infinite;
            }
            
            .player-toggle.idle-bounce {
                animation: idleBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            .player-toggle.idle-bounce .idle-ring {
                animation: idlePulseStrong 0.6s ease-in-out;
            }
            
            @keyframes idlePulse {
                0% {
                    transform: scale(1);
                    opacity: 0.6;
                    box-shadow: 0 0 20px var(--accent-glow);
                }
                100% {
                    transform: scale(1.5);
                    opacity: 0;
                    box-shadow: 0 0 40px var(--accent-glow-strong);
                }
            }
            
            @keyframes idlePulseStrong {
                0% {
                    transform: scale(1);
                    opacity: 0.8;
                    box-shadow: 0 0 30px var(--accent-glow-strong);
                }
                100% {
                    transform: scale(1.8);
                    opacity: 0;
                    box-shadow: 0 0 60px var(--accent-glow-strong);
                }
            }
            
            @keyframes idleBounce {
                0% {
                    transform: translateY(0);
                }
                30% {
                    transform: translateY(-12px);
                }
                50% {
                    transform: translateY(-4px);
                }
                70% {
                    transform: translateY(-8px);
                }
                100% {
                    transform: translateY(0);
                }
            }
            
            /* Контейнер для бейджа — не мешаем анимации */
            .player-toggle.idle-bounce .player-badge {
                animation: idleBadgeBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            @keyframes idleBadgeBounce {
                0% { transform: scale(1); }
                30% { transform: scale(1.3); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); }
            }
            
            /* При проигрывании отключаем idle-эффекты */
            .player-toggle.playing.idle-pulse .idle-ring {
                animation: none;
                opacity: 0;
            }
            
            .player-toggle.playing.idle-bounce {
                animation: none;
            }
        `;
        document.head.appendChild(style);
    },
    
    getElements() {
        return {
            toggle: document.getElementById('playerToggle'),
            body: document.getElementById('playerBody'),
            close: document.getElementById('playerClose'),
            badge: document.getElementById('playerBadge'),
            trackTitle: document.getElementById('trackTitle'),
            trackArtist: document.getElementById('trackArtist'),
            playBtn: document.getElementById('playBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            progressSlider: document.getElementById('progressSlider'),
            volumeSlider: document.getElementById('volumeSlider'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            playlistToggle: document.getElementById('playlistToggle'),
            playlistList: document.getElementById('playlistList'),
            playlistCount: document.getElementById('playlistCount'),
            playlistEmpty: document.querySelector('.playlist-empty'),
            fileInput: document.getElementById('fileInput'),
            addTrack: document.getElementById('addTrack'),
            emptyMsg: document.getElementById('emptyMsg')
        };
    },
    
    bindEvents() {
        this.elements.toggle.addEventListener('click', () => {
            this.resetIdleTimer();
            this.toggle();
        });
        this.elements.close.addEventListener('click', () => {
            this.resetIdleTimer();
            this.close();
        });
        
        this.elements.playBtn.addEventListener('click', () => {
            this.resetIdleTimer();
            this.togglePlay();
        });
        this.elements.prevBtn.addEventListener('click', () => {
            this.resetIdleTimer();
            this.prevTrack();
        });
        this.elements.nextBtn.addEventListener('click', () => {
            this.resetIdleTimer();
            this.nextTrack();
        });
        
        this.elements.progressSlider.addEventListener('input', () => {
            this.resetIdleTimer();
            if (this.audio.duration) {
                this.audio.currentTime = (this.elements.progressSlider.value / 100) * this.audio.duration;
            }
        });
        
        this.elements.volumeSlider.addEventListener('input', () => {
            this.audio.volume = this.elements.volumeSlider.value / 100;
        });
        
        this.elements.playlistToggle.addEventListener('click', () => {
            this.resetIdleTimer();
            this.togglePlaylist();
        });
        this.elements.addTrack.addEventListener('click', () => {
            this.resetIdleTimer();
            this.elements.fileInput.click();
        });
        this.elements.fileInput.addEventListener('change', (e) => {
            this.resetIdleTimer();
            this.addTracks([...e.target.files]);
            e.target.value = '';
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.code === 'Space' && this.isOpen) {
                e.preventDefault();
                this.resetIdleTimer();
                this.togglePlay();
            }
            if (e.key === 'ArrowRight' && this.isOpen) {
                e.preventDefault();
                this.resetIdleTimer();
                this.nextTrack();
            }
            if (e.key === 'ArrowLeft' && this.isOpen) {
                e.preventDefault();
                this.resetIdleTimer();
                this.prevTrack();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        this.setupDragDrop();
        this.observeAccentColor();
    },
    
    // ===== IDLE-РЕЖИМ =====
    
    startIdleMode() {
        this.idleMode.lastInteractionTime = Date.now();
        this.idleMode.idleStartTime = Date.now();
        
        // Запускаем пульсацию с задержкой
        this.idleMode.pulseInterval = setInterval(() => {
            this.updateIdleState();
        }, this.idleMode.pulseSpeed);
    },
    
    resetIdleTimer() {
        this.idleMode.lastInteractionTime = Date.now();
        this.idleMode.idleStartTime = Date.now();
        
        // Если играет музыка — отключаем idle-эффекты
        if (this.isPlaying) {
            this.disableIdleEffects();
            return;
        }
        
        // Если был режим прыжков — сбрасываем
        if (this.idleMode.isBouncing) {
            this.stopBouncing();
        }
        
        // Возвращаем пульсацию
        this.startPulsing();
    },
    
    updateIdleState() {
        // Если музыка играет — отключаем всё
        if (this.isPlaying) {
            this.disableIdleEffects();
            return;
        }
        
        // Если плеер открыт — не отвлекаем
        if (this.isOpen) {
            this.disableIdleEffects();
            return;
        }
        
        const now = Date.now();
        const idleTime = now - this.idleMode.lastInteractionTime;
        
        // Если прошло меньше порога — пульсируем
        if (idleTime < this.idleMode.idleThreshold) {
            this.startPulsing();
            // Если был прыжок — останавливаем
            if (this.idleMode.isBouncing) {
                this.stopBouncing();
            }
            return;
        }
        
        // Если прошло больше порога — начинаем прыгать
        if (!this.idleMode.isBouncing) {
            this.startBouncing();
        }
    },
    
    startPulsing() {
        const toggle = this.elements.toggle;
        if (!toggle) return;
        
        if (this.idleMode.isPulsing) return;
        if (this.isPlaying) return;
        
        this.idleMode.isPulsing = true;
        toggle.classList.add('idle-pulse');
        
        // Обновляем цвет кольца
        this.updateIdleRingColor();
    },
    
    stopPulsing() {
        const toggle = this.elements.toggle;
        if (!toggle) return;
        
        this.idleMode.isPulsing = false;
        toggle.classList.remove('idle-pulse');
    },
    
    startBouncing() {
        const toggle = this.elements.toggle;
        if (!toggle) return;
        
        // Отключаем пульсацию
        this.stopPulsing();
        
        this.idleMode.isBouncing = true;
        
        // Первый прыжок сразу
        toggle.classList.add('idle-bounce');
        
        // Убираем класс после анимации
        setTimeout(() => {
            toggle.classList.remove('idle-bounce');
        }, this.idleMode.bounceDuration);
        
        // Запускаем интервал для повторных прыжков
        if (this.idleMode.bounceInterval) {
            clearInterval(this.idleMode.bounceInterval);
        }
        
        this.idleMode.bounceInterval = setInterval(() => {
            // Проверяем, не включили ли музыку
            if (this.isPlaying || this.isOpen) {
                this.stopBouncing();
                return;
            }
            
            // Делаем прыжок
            toggle.classList.add('idle-bounce');
            setTimeout(() => {
                toggle.classList.remove('idle-bounce');
            }, this.idleMode.bounceDuration);
            
            // Обновляем цвет для разнообразия
            this.updateIdleRingColor();
            
            // Иногда меняем интенсивность
            const intensity = 0.5 + Math.random() * 0.5;
            const ring = toggle.querySelector('.idle-ring');
            if (ring) {
                ring.style.boxShadow = `0 0 ${20 + intensity * 30}px var(--accent-glow)`;
            }
            
        }, this.idleMode.bounceIntervalTime);
    },
    
    stopBouncing() {
        const toggle = this.elements.toggle;
        if (!toggle) return;
        
        this.idleMode.isBouncing = false;
        toggle.classList.remove('idle-bounce');
        
        if (this.idleMode.bounceInterval) {
            clearInterval(this.idleMode.bounceInterval);
            this.idleMode.bounceInterval = null;
        }
        
        // Возвращаем пульсацию, если не играет музыка
        if (!this.isPlaying && !this.isOpen) {
            this.startPulsing();
        }
    },
    
    disableIdleEffects() {
        this.stopPulsing();
        this.stopBouncing();
        
        const toggle = this.elements.toggle;
        if (toggle) {
            toggle.classList.remove('idle-pulse', 'idle-bounce');
        }
    },
    
    updateIdleRingColor() {
        const toggle = this.elements.toggle;
        if (!toggle) return;
        
        const root = document.documentElement;
        const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#7acc7a';
        const ring = toggle.querySelector('.idle-ring');
        if (ring) {
            ring.style.borderColor = accent;
            ring.style.boxShadow = `0 0 20px ${accent}66`;
        }
    },
    
    // ===== ОСТАЛЬНАЯ ЛОГИКА =====
    
    observeAccentColor() {
        const observer = new MutationObserver(() => {
            this.updateBassRingColor();
            this.updateIdleRingColor();
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });
    },
    
    updateBassRingColor() {
        const root = document.documentElement;
        const accent = getComputedStyle(root).getPropertyValue('--accent').trim();
        const ring = this.elements.toggle?.querySelector('.bass-ring');
        if (ring && accent) {
            ring.style.borderColor = accent;
        }
    },
    
    bindPlayerEvents() {
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        });
        
        this.audio.addEventListener('timeupdate', () => {
            if (this.audio.duration) {
                const pct = (this.audio.currentTime / this.audio.duration) * 100;
                this.elements.progressSlider.value = pct;
                this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
            }
        });
        
        this.audio.addEventListener('ended', () => {
            if (this.playlist.length > 0) {
                const next = (this.currentTrackIndex + 1) % this.playlist.length;
                this.loadTrack(next);
            } else {
                this.isPlaying = false;
                this.updatePlayButton();
                this.updateToggleButton();
                this.stopBassAnalysis();
                // Включаем idle-режим
                this.resetIdleTimer();
            }
        });
        
        this.audio.addEventListener('play', () => {
            this.startBassAnalysis();
            this.disableIdleEffects();
        });
        
        this.audio.addEventListener('pause', () => {
            this.stopBassAnalysis();
            // Если пауза и нет трека — включаем idle
            if (!this.audio.src) {
                this.resetIdleTimer();
            }
        });
    },
    
    setupDragDrop() {
        let dragCounter = 0;
        
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragCounter++;
        });
        
        document.addEventListener('dragleave', (e) => {
            dragCounter--;
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('audio/'));
            if (files.length) {
                this.resetIdleTimer();
                this.addTracks(files);
                if (!this.isOpen) this.open();
                setTimeout(() => {
                    this.elements.playlistList.parentElement.classList.add('open');
                }, 300);
            }
        });
    },
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    },
    
    open() {
        this.isOpen = true;
        this.elements.body.classList.add('open');
        this.elements.toggle.classList.add('active');
        // Отключаем idle при открытии плеера
        this.disableIdleEffects();
    },
    
    close() {
        this.isOpen = false;
        this.elements.body.classList.remove('open');
        this.elements.toggle.classList.remove('active');
        this.elements.playlistList.parentElement.classList.remove('open');
        // Включаем idle обратно, если не играет музыка
        if (!this.isPlaying) {
            this.resetIdleTimer();
        }
    },
    
    togglePlaylist() {
        this.elements.playlistList.parentElement.classList.toggle('open');
    },
    
    formatTime(s) {
        if (isNaN(s) || !isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    },
    
    // ===== БАС-АНАЛИЗ =====
    
    startBassAnalysis() {
        if (this.bassInterval) return;
        if (!this.audio.src) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 1024;
                this.analyser.smoothingTimeConstant = 0.4;
                
                this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
                this.sourceNode.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                this.calculateFrequencyRanges();
            }
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.bassState.currentIntensity = 0;
            this.bassState.isFlashing = false;
            if (this.bassState.flashTimeout) {
                clearTimeout(this.bassState.flashTimeout);
                this.bassState.flashTimeout = null;
            }
            
            this.bassInterval = setInterval(() => {
                this.analyzeFrequencies();
            }, 20);
            
        } catch (e) {
            console.warn('Анализ недоступен:', e);
        }
    },
    
    calculateFrequencyRanges() {
        const sampleRate = this.audioContext.sampleRate;
        const fftSize = this.analyser.fftSize;
        const frequencyResolution = sampleRate / fftSize;
        
        const getIndex = (freq) => Math.floor(freq / frequencyResolution);
        
        this.frequencyCache = {
            kick: {
                start: getIndex(60),
                end: getIndex(120)
            }
        };
    },
    
    analyzeFrequencies() {
        if (!this.analyser || !this.isPlaying) return;
        
        try {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            const kickEnergy = this.getBandEnergy(this.frequencyCache.kick);
            
            let intensity = kickEnergy * this.bassConfig.sensitivity;
            
            const threshold = this.bassConfig.minThreshold;
            if (intensity < threshold) {
                intensity = 0;
            } else {
                intensity = Math.min(1, (intensity - threshold) / (1 - threshold));
            }
            
            intensity = Math.min(1, intensity * this.bassConfig.intensityMultiplier);
            
            const oldIntensity = this.bassState.currentIntensity;
            this.bassState.currentIntensity = intensity;
            
            if (oldIntensity - intensity > 0.15) {
                this.instantDecay();
            }
            
            if (intensity < this.bassConfig.minDecay) {
                if (this.bassState.currentIntensity > 0) {
                    this.instantDecay();
                }
                return;
            }
            
            if (intensity > 0.04) {
                this.triggerInstantFlash(intensity);
            }
            
        } catch (e) {
            // Игнорируем ошибки
        }
    },
    
    getBandEnergy(range) {
        let sum = 0;
        const count = range.end - range.start;
        
        if (count <= 0) return 0;
        
        for (let i = range.start; i < range.end && i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        
        return sum / (count * 255);
    },
    
    instantDecay() {
        this.bassState.currentIntensity = 0;
        
        const toggle = this.elements.toggle;
        toggle.style.transform = '';
        toggle.style.boxShadow = '';
        toggle.style.borderColor = '';
        toggle.classList.remove('bass-active', 'bass-strong');
        
        const ring = toggle.querySelector('.bass-ring');
        if (ring) {
            ring.style.transform = '';
            ring.style.opacity = '';
            ring.style.borderColor = '';
        }
        
        if (this.bassState.flashTimeout) {
            clearTimeout(this.bassState.flashTimeout);
            this.bassState.flashTimeout = null;
        }
        
        this.bassState.isFlashing = false;
    },
    
    stopBassAnalysis() {
        if (this.bassInterval) {
            clearInterval(this.bassInterval);
            this.bassInterval = null;
        }
        
        this.instantDecay();
    },
    
    triggerInstantFlash(intensity) {
        const toggle = this.elements.toggle;
        const ring = toggle.querySelector('.bass-ring');
        
        const isStrong = intensity > 0.3;
        const isVeryStrong = intensity > 0.55;
        
        const scale = 1 + intensity * 0.3;
        const glowIntensity = intensity * 60;
        
        const root = document.documentElement;
        const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#7acc7a';
        
        let color = accent;
        if (isVeryStrong) {
            color = '#973434';
        } else if (isStrong) {
            color = accent;
        }
        
        toggle.style.transition = 'none';
        toggle.style.transform = `scale(${scale})`;
        toggle.style.boxShadow = `0 0 ${20 + glowIntensity}px ${color}, 0 0 ${40 + glowIntensity * 2}px ${color}44`;
        toggle.style.borderColor = isVeryStrong ? '#ffffff' : (isStrong ? accent : color);
        
        if (ring) {
            ring.style.transition = 'none';
            const ringScale = 1 + intensity * 1.0;
            ring.style.transform = `scale(${ringScale})`;
            ring.style.opacity = Math.min(1, intensity * 2.0);
            ring.style.borderColor = isVeryStrong ? '#ffffff' : color;
        }
        
        toggle.classList.add('bass-active');
        if (isStrong) {
            toggle.classList.add('bass-strong');
        } else {
            toggle.classList.remove('bass-strong');
        }
        
        requestAnimationFrame(() => {
            toggle.style.transition = '';
            if (ring) {
                ring.style.transition = '';
            }
        });
        
        if (this.bassState.flashTimeout) {
            clearTimeout(this.bassState.flashTimeout);
        }
        
        this.bassState.isFlashing = true;
        this.bassState.flashTimeout = setTimeout(() => {
            if (this.bassState.currentIntensity < 0.03) {
                this.instantDecay();
            } else {
                this.bassState.isFlashing = false;
            }
            this.bassState.flashTimeout = null;
        }, this.bassConfig.flashDuration);
    },
    
    // ===== УПРАВЛЕНИЕ ПЛЕЙЛИСТОМ =====
    
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        this.stopBassAnalysis();
        
        this.audio.src = track.url;
        this.audio.load();
        
        this.elements.trackTitle.textContent = track.title || 'Без названия';
        this.elements.trackArtist.textContent = track.artist || 'Неизвестный';
        this.elements.progressSlider.value = 0;
        this.elements.currentTime.textContent = '0:00';
        
        this.updatePlaylistUI();
        
        setTimeout(() => {
            this.audio.play().catch(() => {});
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateToggleButton();
            this.disableIdleEffects();
        }, 150);
    },
    
    addTracks(files) {
        for (const file of files) {
            if (!file.type.startsWith('audio/')) continue;
            const url = URL.createObjectURL(file);
            let title = file.name.replace(/\.[^.]+$/, '');
            let artist = 'Неизвестный';
            
            try {
                if (window.jsmediatags) {
                    window.jsmediatags.read(file, {
                        onSuccess: (result) => {
                            if (result.tags.title) title = result.tags.title;
                            if (result.tags.artist) artist = result.tags.artist;
                            this.updatePlaylistUI();
                        },
                        onError: () => {}
                    });
                }
            } catch (e) {}
            
            this.playlist.push({ url, title, artist });
        }
        
        if (this.playlist.length > 0 && this.currentTrackIndex === -1) {
            this.loadTrack(0);
        }
        
        this.elements.badge.textContent = this.playlist.length;
        this.elements.playlistCount.textContent = this.playlist.length;
        this.updatePlaylistUI();
        this.savePlaylist();
        
        // Сбрасываем idle-таймер
        this.resetIdleTimer();
    },
    
    updatePlaylistUI() {
        const list = this.elements.playlistList;
        const emptyMsg = this.elements.emptyMsg;
        
        if (this.playlist.length === 0) {
            list.innerHTML = `
                <div class="playlist-empty">
                    <span>📂</span>
                    <p>Перетащите аудиофайлы сюда<br>или нажмите <strong>+</strong></p>
                </div>
            `;
            emptyMsg.textContent = 'Нет треков';
            return;
        }
        
        emptyMsg.textContent = `${this.playlist.length} треков`;
        
        let html = '';
        this.playlist.forEach((track, i) => {
            const active = i === this.currentTrackIndex ? 'active' : '';
            html += `
                <div class="playlist-track ${active}" data-index="${i}">
                    <span class="track-num">${i + 1}</span>
                    <div class="track-info">
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                    <button class="track-remove" data-index="${i}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
            `;
        });
        list.innerHTML = html;
        
        list.querySelectorAll('.playlist-track').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.track-remove')) return;
                const index = parseInt(el.dataset.index);
                this.resetIdleTimer();
                this.loadTrack(index);
            });
        });
        
        list.querySelectorAll('.track-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.resetIdleTimer();
                this.removeTrack(index);
            });
        });
    },
    
    removeTrack(index) {
        const track = this.playlist[index];
        URL.revokeObjectURL(track.url);
        this.playlist.splice(index, 1);
        
        if (index === this.currentTrackIndex) {
            if (this.playlist.length > 0) {
                this.loadTrack(Math.min(index, this.playlist.length - 1));
            } else {
                this.currentTrackIndex = -1;
                this.elements.trackTitle.textContent = 'Нет трека';
                this.elements.trackArtist.textContent = '—';
                this.audio.src = '';
                this.isPlaying = false;
                this.updatePlayButton();
                this.updateToggleButton();
                this.stopBassAnalysis();
                this.elements.progressSlider.value = 0;
                this.elements.currentTime.textContent = '0:00';
                this.elements.totalTime.textContent = '0:00';
                // Включаем idle
                this.resetIdleTimer();
            }
        } else if (index < this.currentTrackIndex) {
            this.currentTrackIndex--;
        }
        
        this.elements.badge.textContent = this.playlist.length;
        this.elements.playlistCount.textContent = this.playlist.length;
        this.updatePlaylistUI();
        this.savePlaylist();
    },
    
    togglePlay() {
        if (!this.audio.src && this.playlist.length > 0) {
            this.loadTrack(0);
            return;
        }
        if (!this.audio.src) return;
        
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            this.stopBassAnalysis();
            // Включаем idle при паузе
            this.resetIdleTimer();
        } else {
            this.audio.play().catch(() => {});
            this.isPlaying = true;
            this.startBassAnalysis();
            this.disableIdleEffects();
        }
        this.updatePlayButton();
        this.updateToggleButton();
    },
    
    nextTrack() {
        if (this.playlist.length === 0) return;
        const next = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadTrack(next);
    },
    
    prevTrack() {
        if (this.playlist.length === 0) return;
        const prev = this.currentTrackIndex - 1 < 0 ? this.playlist.length - 1 : this.currentTrackIndex - 1;
        this.loadTrack(prev);
    },
    
    updatePlayButton() {
        const btn = this.elements.playBtn;
        const svg = btn.querySelector('svg');
        
        if (this.isPlaying) {
            svg.innerHTML = `
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
            `;
        } else {
            svg.innerHTML = `
                <polygon points="5 3 19 12 5 21 5 3"/>
            `;
        }
    },
    
    updateToggleButton() {
        const toggle = this.elements.toggle;
        if (this.isPlaying && this.playlist.length > 0) {
            toggle.classList.add('playing');
            this.disableIdleEffects();
        } else {
            toggle.classList.remove('playing');
            this.instantDecay();
            // Включаем idle
            this.resetIdleTimer();
        }
    },
    
    loadPlaylist() {
        try {
            const saved = localStorage.getItem('dayzm_playlist');
            if (saved) {
                const data = JSON.parse(saved);
                this.playlist = [];
                this.updatePlaylistUI();
            }
        } catch (e) {}
    },
    
    savePlaylist() {
        try {
            const data = this.playlist.map(t => ({ title: t.title, artist: t.artist }));
            localStorage.setItem('dayzm_playlist', JSON.stringify(data));
        } catch (e) {}
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Player.init();
});