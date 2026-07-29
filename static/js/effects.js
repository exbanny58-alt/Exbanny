// Управление эффектами переходов
const EffectsManager = {
    currentEffect: 'fadeBlurIn',
    isLoaded: false,

    effects: {
        fadeBlurIn: {
            name: 'Плавное появление',
            description: 'Мягкое появление с размытия',
            animation: 'fadeBlurIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)',
            duration: 500
        },
        slideSpringRight: {
            name: 'Пружина справа',
            description: 'Выезд с упругим отскоком',
            animation: 'slideSpringRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            duration: 600
        },
        slideBounceUp: {
            name: 'Подскок снизу',
            description: 'Выпрыгивание с физикой мяча',
            animation: 'slideBounceUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
            duration: 700
        },
        scaleSpring: {
            name: 'Пружинный масштаб',
            description: 'Увеличение с вибрацией',
            animation: 'scaleSpring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            duration: 600
        },
        depth3D: {
            name: '3D глубина',
            description: 'Выезд из глубины с перспективой',
            animation: 'depth3D 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            duration: 500
        },
        assembleIn: {
            name: 'Сборка',
            description: 'Контент собирается из размытия',
            animation: 'assembleIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            duration: 500
        },
        flipIn: {
            name: 'Разворот',
            description: 'Лёгкий 3D разворот при появлении',
            animation: 'flipIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            duration: 500
        },
        waveIn: {
            name: 'Волна',
            description: 'Контент проявляется волной снизу',
            animation: 'waveIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            duration: 500
        }
    },

    init() {
        this.loadSettings();
    },

    getAnimation() {
        return this.effects[this.currentEffect].animation;
    },

    getDuration() {
        return this.effects[this.currentEffect].duration;
    },

    setEffect(effectId) {
        if (this.effects[effectId]) {
            this.currentEffect = effectId;
            this.saveSettings();
            this.applyToContent();
        }
    },

    applyToContent() {
        const content = document.getElementById('content');
        if (!content) return;
        
        // Убираем старую анимацию
        content.style.animation = 'none';
        // Принудительный reflow
        void content.offsetHeight;
        // Применяем новую анимацию
        content.style.animation = this.getAnimation();
    },

    saveSettings() {
        // Сохраняем в localStorage
        localStorage.setItem('dayzm_effect', this.currentEffect);
        
        // Отправляем на сервер
        fetch('/api/settings/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                effect: this.currentEffect
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Эффект сохранен на сервере:', data.settings);
            }
        })
        .catch(error => {
            console.error('Ошибка сохранения эффекта на сервере:', error);
        });
    },

    loadSettings() {
        // Загружаем с сервера
        fetch('/api/settings/load')
            .then(response => response.json())
            .then(data => {
                if (data && data.effect && this.effects[data.effect]) {
                    this.currentEffect = data.effect;
                } else {
                    // Если на сервере нет, пробуем из localStorage
                    const saved = localStorage.getItem('dayzm_effect');
                    if (saved && this.effects[saved]) {
                        this.currentEffect = saved;
                    }
                }
                this.isLoaded = true;
                // Применяем эффект к текущему контенту
                setTimeout(() => this.applyToContent(), 100);
            })
            .catch(() => {
                // Если сервер недоступен, загружаем из localStorage
                const saved = localStorage.getItem('dayzm_effect');
                if (saved && this.effects[saved]) {
                    this.currentEffect = saved;
                }
                this.isLoaded = true;
                setTimeout(() => this.applyToContent(), 100);
            });
    }
};