// player.js - Аудиоплеер в стиле DayzM с бас-миганием
const Player = {
    playlist: [],
    currentTrackIndex: -1,
    isPlaying: false,
    isOpen: false,
    audio: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    bassInterval: null,
    bassSensitivity: 80, // Чувствительность баса (0-100)
    
    elements: {},
    
    init() {
        this.createPlayer();
        this.bindEvents();
        this.loadPlaylist();
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
                        <span>🎵 Плейлист</span>
                        <span class="playlist-empty-msg" id="emptyMsg">Нет треков</span>
                    </div>
                    <div class="playlist-list" id="playlistList">
                        <div class="playlist-empty">
                            <span>📂</span>
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
        this.elements.toggle.addEventListener('click', () => this.toggle());
        this.elements.close.addEventListener('click', () => this.close());
        
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.prevTrack());
        this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
        
        this.elements.progressSlider.addEventListener('input', () => {
            if (this.audio.duration) {
                this.audio.currentTime = (this.elements.progressSlider.value / 100) * this.audio.duration;
            }
        });
        
        this.elements.volumeSlider.addEventListener('input', () => {
            this.audio.volume = this.elements.volumeSlider.value / 100;
        });
        
        this.elements.playlistToggle.addEventListener('click', () => this.togglePlaylist());
        this.elements.addTrack.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => {
            this.addTracks([...e.target.files]);
            e.target.value = '';
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.code === 'Space' && this.isOpen) {
                e.preventDefault();
                this.togglePlay();
            }
            if (e.key === 'ArrowRight' && this.isOpen) {
                e.preventDefault();
                this.nextTrack();
            }
            if (e.key === 'ArrowLeft' && this.isOpen) {
                e.preventDefault();
                this.prevTrack();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        this.setupDragDrop();
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
            }
        });
        
        // При воспроизведении запускаем анализ баса
        this.audio.addEventListener('play', () => {
            this.startBassAnalysis();
        });
        
        this.audio.addEventListener('pause', () => {
            this.stopBassAnalysis();
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
    },
    
    close() {
        this.isOpen = false;
        this.elements.body.classList.remove('open');
        this.elements.toggle.classList.remove('active');
        this.elements.playlistList.parentElement.classList.remove('open');
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
        
        try {
            // Создаем AudioContext если его нет
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;
                const source = this.audioContext.createMediaElementSource(this.audio);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }
            
            this.bassInterval = setInterval(() => {
                if (!this.analyser || !this.isPlaying) return;
                
                this.analyser.getByteFrequencyData(this.dataArray);
                
                // Берем только низкие частоты (бас) - первые 20-30 значений
                let bassSum = 0;
                const bassCount = Math.min(25, this.dataArray.length);
                for (let i = 0; i < bassCount; i++) {
                    bassSum += this.dataArray[i];
                }
                const bassAvg = bassSum / bassCount;
                
                // Нормализуем (0-255 -> 0-1)
                const normalized = Math.min(1, bassAvg / 128);
                
                // Применяем чувствительность
                const threshold = this.bassSensitivity / 100;
                if (normalized > threshold) {
                    const intensity = (normalized - threshold) / (1 - threshold);
                    this.triggerBassFlash(intensity);
                }
            }, 100); // Проверяем каждые 100мс
        } catch (e) {
            console.warn('Бас-анализ недоступен:', e);
        }
    },
    
    stopBassAnalysis() {
        if (this.bassInterval) {
            clearInterval(this.bassInterval);
            this.bassInterval = null;
        }
        // Убираем классы баса
        this.elements.toggle.classList.remove('bass-active', 'bass-strong');
    },
    
    triggerBassFlash(intensity) {
        const toggle = this.elements.toggle;
        
        // Сбрасываем анимацию
        toggle.classList.remove('bass-active', 'bass-strong');
        
        // Принудительный reflow
        void toggle.offsetHeight;
        
        if (intensity > 0.6) {
            toggle.classList.add('bass-strong');
        } else {
            toggle.classList.add('bass-active');
        }
        
        // Убираем класс через 200мс
        setTimeout(() => {
            toggle.classList.remove('bass-active', 'bass-strong');
        }, 200);
    },
    
    setBassSensitivity(value) {
        this.bassSensitivity = Math.max(0, Math.min(100, value));
    },
    
    // ===== ОСТАЛЬНАЯ ЛОГИКА =====
    
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        // Останавливаем старый анализ
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
                this.loadTrack(index);
            });
        });
        
        list.querySelectorAll('.track-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
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
        } else {
            this.audio.play().catch(() => {});
            this.isPlaying = true;
            this.startBassAnalysis();
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
        } else {
            toggle.classList.remove('playing');
            toggle.classList.remove('bass-active', 'bass-strong');
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