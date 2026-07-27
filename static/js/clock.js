// ============================================
// КРАСИВЫЕ ЧАСЫ - РАБОЧАЯ ВЕРСИЯ
// ============================================

class DigitalClock {
    constructor(container) {
        this.container = container;
        this.date = new Date();
        this.interval = null;
        this.createClock();
        this.start();
    }

    createClock() {
        const wrapper = document.createElement('div');
        wrapper.className = 'clock-wrapper';
        
        const timer = document.createElement('div');
        timer.className = 'clock-timer';
        
        const timerText = document.createElement('div');
        timerText.className = 'clock-timer-text';
        
        timer.appendChild(timerText);
        wrapper.appendChild(timer);
        this.container.appendChild(wrapper);
        
        this.timerText = timerText;
        this.updateTime();
    }

    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timeString = `${hours}:${minutes}:${seconds}`;
        
        this.timerText.innerHTML = '';
        
        const digitHeight = 48;
        
        timeString.split('').forEach((char) => {
            const charEl = document.createElement('div');
            charEl.className = 'clock-timer-char';
            
            if (char === ':') {
                charEl.classList.add('colon');
                charEl.textContent = ':';
            } else {
                charEl.classList.add('number');
                const number = parseInt(char);
                
                const slider = document.createElement('div');
                slider.className = 'clock-timer-char-slider';
                slider.style.top = `${number * -digitHeight}px`;
                
                for (let i = 0; i <= 9; i++) {
                    const option = document.createElement('span');
                    option.className = 'clock-timer-char-slider-option';
                    if (i === number) {
                        option.classList.add('active');
                    }
                    option.textContent = i;
                    slider.appendChild(option);
                }
                
                charEl.appendChild(slider);
            }
            
            this.timerText.appendChild(charEl);
        });
    }

    start() {
        this.interval = setInterval(() => {
            const now = new Date();
            if (now.getSeconds() !== this.date.getSeconds()) {
                this.date = now;
                this.updateTime();
            }
        }, 100);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    destroy() {
        this.stop();
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
    }
}

// ============================================
// СТИЛИ ДЛЯ ЧАСОВ (ОДНА РАМКА В СТИЛЕ ТЕМЫ)
// ============================================

function injectClockStyles() {
    const styleId = 'clock-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .clock-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
        }
        
        .clock-timer {
            background: linear-gradient(
                to bottom right,
                rgba(2, 99, 225, 1.0),
                rgba(235, 24, 54, 1.0)
            );
            border-radius: 10px;
            width: 100%;
            max-width: 100%;
            padding: 2px;
            /* ЕДИНСТВЕННАЯ РАМКА - в стиле темы */
            border: 2px solid var(--theme-accent, #a3e635);
            box-shadow: 0 0 20px rgba(var(--theme-accent-rgb, 163, 230, 53), 0.1);
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .clock-timer:hover {
            box-shadow: 0 0 30px rgba(var(--theme-accent-rgb, 163, 230, 53), 0.2);
        }
        
        .clock-timer-text {
            align-items: center;
            background-color: var(--clr-bg, #1a1a2e);
            border-radius: 8px;
            display: flex;
            margin: 0px;
            padding: 0px 10px;
            justify-content: center;
            height: 48px;
            min-height: 48px;
            /* Убираем вторую рамку */
            border: none;
            outline: none;
        }
        
        .clock-timer-char {
            height: 48px;
            position: relative;
            text-align: center;
            width: 28px;
        }
        
        .clock-timer-char.colon {
            color: var(--theme-accent, #a3e635);
            font-size: 2.4em;
            line-height: 48px;
            width: 14px;
            font-weight: 300;
        }
        
        .clock-timer-char-slider {
            display: flex;
            flex-direction: column;
            left: 0px;
            position: absolute;
            width: 28px;
            transition: top 200ms ease-out;
        }
        
        .clock-timer-char-slider-option {
            color: var(--clr-txt, #e0e0e0);
            font-size: 1.8em;
            height: 48px;
            line-height: 48px;
            opacity: 0.08;
            transition: opacity 400ms, font-size 400ms;
            width: 28px;
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            font-weight: 400;
            text-align: center;
        }
        
        .clock-timer-char-slider-option.active {
            font-size: 2.4em;
            opacity: 1;
        }
        
        /* ========================================
           АДАПТИВ
           ======================================== */
        
        @media(max-width: 768px) {
            .clock-timer {
                border-width: 1.5px;
                border-radius: 8px;
                padding: 2px;
            }
            
            .clock-timer-text {
                height: 40px;
                min-height: 40px;
                padding: 0px 8px;
                border-radius: 6px;
            }
            
            .clock-timer-char {
                height: 40px;
                width: 22px;
            }
            
            .clock-timer-char.colon {
                font-size: 2em;
                line-height: 40px;
                width: 12px;
            }
            
            .clock-timer-char-slider {
                width: 22px;
            }
            
            .clock-timer-char-slider-option {
                font-size: 1.4em;
                height: 40px;
                line-height: 40px;
                width: 22px;
            }
            
            .clock-timer-char-slider-option.active {
                font-size: 2em;
            }
        }
        
        @media(max-width: 480px) {
            .clock-timer {
                border-width: 1px;
                border-radius: 6px;
                padding: 1.5px;
            }
            
            .clock-timer-text {
                height: 32px;
                min-height: 32px;
                padding: 0px 6px;
                border-radius: 4px;
            }
            
            .clock-timer-char {
                height: 32px;
                width: 18px;
            }
            
            .clock-timer-char.colon {
                font-size: 1.6em;
                line-height: 32px;
                width: 10px;
            }
            
            .clock-timer-char-slider {
                width: 18px;
            }
            
            .clock-timer-char-slider-option {
                font-size: 1em;
                height: 32px;
                line-height: 32px;
                width: 18px;
            }
            
            .clock-timer-char-slider-option.active {
                font-size: 1.6em;
            }
        }
    `;
    document.head.appendChild(style);
}
injectClockStyles();

if (typeof window !== 'undefined') {
    window.DigitalClock = DigitalClock;
}

console.log('🕐 Clock загружен');