// loader.js - Просто загрузчик, который ждёт клик

const Loader = {
    container: null,
    isHidden: false,
    onContinue: null,

    init() {
        this.createLoader();
        console.log('🔄 Загрузчик готов. Ждём клик.');
    },

    createLoader() {
        const old = document.getElementById('app-loader');
        if (old) old.remove();

        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.innerHTML = `
            <div class="preloader">
                <div class="preloader__ring">
                    ${Array.from({length: 30}, (_, i) => {
                        const angle = (360 / 30) * i;
                        const char = 'LOADING...'[i % 9] || '';
                        return `<div class="preloader__sector" style="transform: rotateY(${angle}deg) translateZ(7rem);">${char || ''}</div>`;
                    }).join('')}
                </div>
                <div class="preloader__ring" style="animation-direction: reverse;">
                    ${Array.from({length: 30}, (_, i) => {
                        const angle = (360 / 30) * i;
                        const char = 'LOADING...'[i % 9] || '';
                        return `<div class="preloader__sector" style="transform: rotateY(${angle}deg) translateZ(7rem);">${char || ''}</div>`;
                    }).join('')}
                </div>
                <div class="preloader__label">Dayz<span>M</span></div>
                <div class="preloader__percent" id="loaderPercent">0%</div>
            </div>
            <div class="loader-mouse-container">
                <div class="mouse">
                    <div></div>
                    <div></div>
                </div>
                <span class="mouse-text">Scroll</span>
            </div>
            <div class="loader-click-hint" id="loaderClickHint">✦ CLICK TO CONTINUE ✦</div>
        `;
        
        document.body.prepend(loader);
        this.container = loader;

        // Клик - скрываем и вызываем callback
        loader.addEventListener('click', () => {
            this.hide();
            if (this.onContinue) {
                this.onContinue();
            }
        });
    },

    // Ждём клик и запускаем app
    waitForClick(callback) {
        if (this.isHidden) {
            // Если уже скрыт, сразу запускаем
            callback();
        } else {
            this.onContinue = callback;
        }
    },

    hide() {
        if (this.isHidden) return;
        this.isHidden = true;
        this.container?.classList.add('hidden');
    },

    setProgress(value) {
        const el = document.getElementById('loaderPercent');
        if (el) el.textContent = Math.round(Math.min(100, Math.max(0, value))) + '%';
    },

    show() {
        this.isHidden = false;
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }
};

// Автозапуск
document.addEventListener('DOMContentLoaded', () => {
    Loader.init();
});