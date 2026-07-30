// Управление эффектами переходов со Swup
const EffectsManager = {
    currentEffect: 'fade',
    isLoaded: false,
    swupInstance: null,

    effects: {
        fade: {
            name: 'Плавное затухание',
            description: 'Классический fade in/out',
            animation: 'fade'
        },
        slide: {
            name: 'Слайд влево',
            description: 'Страница уезжает влево',
            animation: 'slide'
        },
        slideUp: {
            name: 'Слайд вверх',
            description: 'Страница уезжает вверх',
            animation: 'slide-up'
        },
        slideDown: {
            name: 'Слайд вниз',
            description: 'Страница уезжает вниз',
            animation: 'slide-down'
        },
        explode: {
            name: 'Взрыв',
            description: 'Страница разлетается на частицы',
            animation: 'explode'
        },
        dissolve: {
            name: 'Растворение',
            description: 'Страница растворяется как дым',
            animation: 'dissolve'
        },
        shatter: {
            name: 'Разбитие',
            description: 'Страница разбивается на осколки',
            animation: 'shatter'
        },
        push: {
            name: 'Толчок',
            description: 'Страница толкает новую',
            animation: 'push'
        },
        pull: {
            name: 'Тяга',
            description: 'Новая страница тянет старую',
            animation: 'pull'
        },
        flip: {
            name: 'Переворот',
            description: '3D переворот страницы',
            animation: 'flip'
        },
        glitch: {
            name: 'Глитч',
            description: 'Киберпанк эффект с искажениями',
            animation: 'glitch'
        },
        perspective: {
            name: 'Перспектива',
            description: 'Страница уходит в перспективу',
            animation: 'perspective'
        },
        swirl: {
            name: 'Водоворот',
            description: 'Страница улетает в воронку',
            animation: 'swirl'
        },
        reveal: {
            name: 'Откровение',
            description: 'Новая страница открывается как занавес',
            animation: 'reveal'
        },
        fold: {
            name: 'Складывание',
            description: 'Страница сворачивается как бумага',
            animation: 'fold'
        },
        zoom: {
            name: 'Зум',
            description: 'Страница увеличивается/уменьшается',
            animation: 'zoom'
        }
    },

    init() {
        this.loadSettings();
        this.initSwup();
        console.log('✅ EffectsManager initialized with Swup');
    },

    initSwup() {
        // Проверяем, загружен ли Swup
        if (typeof Swup === 'undefined') {
            console.warn('⚠️ Swup not loaded, waiting...');
            setTimeout(() => this.initSwup(), 500);
            return;
        }

        if (this.swupInstance) return;

        try {
            // Конфигурация Swup для SPA
            this.swupInstance = new Swup({
                containers: ['#content'],
                cache: false,
                animateHistoryBrowsing: true,
                plugins: []
            });

            console.log('✅ Swup initialized');

            // Подписываемся на события Swup
            this.swupInstance.on('transitionStart', () => {
                console.log('🔄 Transition start');
            });

            this.swupInstance.on('transitionEnd', () => {
                console.log('✅ Transition end');
                // Применяем эффект к новому контенту
                this.applyToContent();
            });

            // Применяем текущий эффект
            setTimeout(() => this.applyToContent(), 200);

        } catch (e) {
            console.error('❌ Swup init error:', e);
            // Fallback на CSS
            this.applyToContent();
        }
    },

    getAnimation() {
        return this.effects[this.currentEffect]?.animation || 'fade';
    },

    getDuration(effect) {
        const durations = {
            'fade': 500,
            'slide': 500,
            'slide-up': 500,
            'slide-down': 500,
            'explode': 700,
            'dissolve': 600,
            'shatter': 700,
            'push': 500,
            'pull': 500,
            'flip': 600,
            'glitch': 600,
            'perspective': 600,
            'swirl': 700,
            'reveal': 600,
            'fold': 600,
            'zoom': 500
        };
        return durations[effect] || 500;
    },

    getLeaveAnimation(effect) {
        const map = {
            'fade': 'fadeOut 0.5s ease forwards',
            'slide': 'slideOut 0.5s ease forwards',
            'slide-up': 'slideUpOut 0.5s ease forwards',
            'slide-down': 'slideDownOut 0.5s ease forwards',
            'explode': 'explodeOut 0.7s ease forwards',
            'dissolve': 'dissolveOut 0.6s ease forwards',
            'shatter': 'shatterOut 0.7s ease forwards',
            'push': 'pushOut 0.5s ease forwards',
            'pull': 'pullOut 0.5s ease forwards',
            'flip': 'flipOut 0.6s ease forwards',
            'glitch': 'glitchOut 0.6s ease forwards',
            'perspective': 'perspectiveOut 0.6s ease forwards',
            'swirl': 'swirlOut 0.7s ease forwards',
            'reveal': 'revealOut 0.6s ease forwards',
            'fold': 'foldOut 0.6s ease forwards',
            'zoom': 'zoomOut 0.5s ease forwards'
        };
        return map[effect] || 'fadeOut 0.5s ease forwards';
    },

    getEnterAnimation(effect) {
        const map = {
            'fade': 'fadeIn 0.5s ease forwards',
            'slide': 'slideIn 0.5s ease forwards',
            'slide-up': 'slideUp 0.5s ease forwards',
            'slide-down': 'slideDown 0.5s ease forwards',
            'explode': 'explodeIn 0.7s ease forwards',
            'dissolve': 'dissolveIn 0.6s ease forwards',
            'shatter': 'shatterIn 0.7s ease forwards',
            'push': 'pushIn 0.5s ease forwards',
            'pull': 'pullIn 0.5s ease forwards',
            'flip': 'flipIn 0.6s ease forwards',
            'glitch': 'glitchIn 0.6s ease forwards',
            'perspective': 'perspectiveIn 0.6s ease forwards',
            'swirl': 'swirlIn 0.7s ease forwards',
            'reveal': 'revealIn 0.6s ease forwards',
            'fold': 'foldIn 0.6s ease forwards',
            'zoom': 'zoomIn 0.5s ease forwards'
        };
        return map[effect] || 'fadeIn 0.5s ease forwards';
    },

    setEffect(effectId) {
        if (this.effects[effectId]) {
            const effectName = this.effects[effectId].name;
            this.currentEffect = effectId;
            this.saveSettings();
            
            // Применяем эффект
            this.applyToContent();
            
            if (typeof Notifications !== 'undefined') {
                Notifications.info('🎬 Эффект изменён', `Выбран: ${effectName}`);
            }
            
            console.log(`✅ Effect changed to: ${effectName}`);
        }
    },

    applyToContent() {
        const content = document.getElementById('content');
        if (!content) return;
        
        // Убираем старые классы анимации
        content.classList.remove('is-leaving', 'is-enter');
        
        // Сбрасываем стили
        content.style.animation = 'none';
        content.style.opacity = '0';
        
        // Принудительный reflow
        void content.offsetHeight;
        
        // Применяем анимацию входа
        const effect = this.getAnimation();
        content.style.animation = this.getEnterAnimation(effect);
        content.style.opacity = '1';
    },

    // Метод для Swup — вызывается перед переходом
    beforeTransition() {
        const content = document.getElementById('content');
        if (!content) return;
        
        const effect = this.getAnimation();
        content.style.animation = this.getLeaveAnimation(effect);
    },

    saveSettings() {
        localStorage.setItem('dayzm_effect', this.currentEffect);
        
        fetch('/api/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ effect: this.currentEffect })
        }).catch(error => console.error('Ошибка сохранения эффекта:', error));
    },

    loadSettings() {
        fetch('/api/settings/load')
            .then(response => response.json())
            .then(data => {
                if (data && data.effect && this.effects[data.effect]) {
                    this.currentEffect = data.effect;
                } else {
                    const saved = localStorage.getItem('dayzm_effect');
                    if (saved && this.effects[saved]) {
                        this.currentEffect = saved;
                    }
                }
                this.isLoaded = true;
                setTimeout(() => this.applyToContent(), 200);
            })
            .catch(() => {
                const saved = localStorage.getItem('dayzm_effect');
                if (saved && this.effects[saved]) {
                    this.currentEffect = saved;
                }
                this.isLoaded = true;
                setTimeout(() => this.applyToContent(), 200);
            });
    }
};

