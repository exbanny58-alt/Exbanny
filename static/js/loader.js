// Индикатор загрузки в боковом меню
const SideLoader = {
    init() {
        this.createWidget();
        this.animate();
    },

    createWidget() {
        const widget = document.createElement('div');
        widget.className = 'side-loading';
        widget.innerHTML = `
            <div class="counter">
                <p>loading</p>
                <h1>0%</h1>
                <hr>
            </div>
        `;
        document.querySelector('.side-panel').appendChild(widget);
    },

    animate() {
        let counter = 0;
        const h1 = document.querySelector('.side-loading .counter h1');
        const hr = document.querySelector('.side-loading .counter hr');

        const interval = setInterval(() => {
            h1.textContent = counter + '%';
            hr.style.width = counter + '%';
            counter++;

            if (counter > 100) {
                clearInterval(interval);
            }
        }, 50);
    }
};