// ============================================
// ПЛАВАЮЩАЯ КОНСОЛЬ
// ============================================

let isConsoleOpen = false;
let consoleLines = [];

// ============================================
// ИНИЦИАЛИЗАЦИЯ КОНСОЛИ
// ============================================
function initConsole() {
    console.log('📟 Инициализация консоли');
    
    // Создаём кнопку
    createConsoleButton();
    
    // Создаём окно консоли (скрытое)
    createConsoleWindow();
}

// ============================================
// СОЗДАНИЕ ПЛАВАЮЩЕЙ КНОПКИ
// ============================================
function createConsoleButton() {
    // Проверяем, не создана ли уже
    if (document.getElementById('consoleFloatBtn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'consoleFloatBtn';
    btn.className = 'console-float-btn';
    btn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4,17 10,11 4,5"/>
            <line x1="12" y1="19" x2="20" y2="19"/>
        </svg>
    `;
    btn.title = 'Открыть консоль';
    btn.onclick = toggleConsole;
    
    document.body.appendChild(btn);
}

// ============================================
// СОЗДАНИЕ ОКНА КОНСОЛИ
// ============================================
function createConsoleWindow() {
    // Проверяем, не создано ли уже
    if (document.getElementById('consoleWindow')) return;
    
    const window = document.createElement('div');
    window.id = 'consoleWindow';
    window.className = 'console-window hidden';
    
    window.innerHTML = `
        <div class="console-window-header">
            <span class="console-window-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="4,17 10,11 4,5"/>
                    <line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
                Консоль
            </span>
            <div class="console-window-actions">
                <button class="console-clear-btn" onclick="clearConsoleWindow()" title="Очистить">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                    </svg>
                </button>
                <button class="console-close-btn" onclick="toggleConsole()" title="Закрыть">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="console-window-body" id="consoleWindowBody">
            <div class="console-line console-info">[Система] Консоль загружена</div>
            <div class="console-line console-info">[Система] Готова к работе</div>
        </div>
        <div class="console-window-input">
            <input type="text" id="consoleInput" placeholder="Введите команду..." class="console-input-field">
            <button class="console-send-btn" onclick="sendConsoleCommand()">Отправить</button>
        </div>
    `;
    
    document.body.appendChild(window);
    
    // Обработчик Enter
    const input = document.getElementById('consoleInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendConsoleCommand();
            }
        });
    }
}

// ============================================
// ОТКРЫТЬ/ЗАКРЫТЬ КОНСОЛЬ
// ============================================
function toggleConsole() {
    const window = document.getElementById('consoleWindow');
    const btn = document.getElementById('consoleFloatBtn');
    
    if (!window) return;
    
    isConsoleOpen = !isConsoleOpen;
    
    if (isConsoleOpen) {
        window.classList.remove('hidden');
        window.classList.add('show');
        btn.classList.add('active');
        // Фокус на поле ввода
        setTimeout(() => {
            const input = document.getElementById('consoleInput');
            if (input) input.focus();
        }, 300);
    } else {
        window.classList.remove('show');
        window.classList.add('hidden');
        btn.classList.remove('active');
    }
}

// ============================================
// ОТПРАВКА КОМАНДЫ (ЗАГЛУШКА)
// ============================================
function sendConsoleCommand() {
    const input = document.getElementById('consoleInput');
    if (!input) return;
    
    const command = input.value.trim();
    if (!command) return;
    
    // Добавляем команду в консоль
    addConsoleLine('command', `> ${command}`);
    input.value = '';
    
    // TODO: Здесь будет отправка команды на сервер
    console.log(`📟 Команда: ${command}`);
    
    // Заглушка - эхо
    setTimeout(() => {
        addConsoleLine('info', `[Ответ] Команда "${command}" выполнена (заглушка)`);
    }, 300);
}

// ============================================
// ДОБАВИТЬ СТРОКУ В КОНСОЛЬ
// ============================================
function addConsoleLine(type, message) {
    const body = document.getElementById('consoleWindowBody');
    if (!body) return;
    
    const line = document.createElement('div');
    line.className = `console-line console-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${message}`;
    
    body.appendChild(line);
    
    // Автоскролл вниз
    body.scrollTop = body.scrollHeight;
    
    // Ограничиваем количество строк
    while (body.children.length > 500) {
        body.removeChild(body.firstChild);
    }
}

// ============================================
// ОЧИСТКА КОНСОЛИ
// ============================================
function clearConsoleWindow() {
    const body = document.getElementById('consoleWindowBody');
    if (!body) return;
    
    body.innerHTML = '';
    addConsoleLine('info', '[Система] Консоль очищена');
}

// ============================================
// ЭКСПОРТ
// ============================================
window.initConsole = initConsole;
window.toggleConsole = toggleConsole;
window.sendConsoleCommand = sendConsoleCommand;
window.addConsoleLine = addConsoleLine;
window.clearConsoleWindow = clearConsoleWindow;

console.log('📟 console.js загружен');