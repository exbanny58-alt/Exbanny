// ============================================
// ПЛАВАЮЩАЯ КОНСОЛЬ С RPT ЛОГАМИ
// ============================================

let isConsoleOpen = false;
let consoleLines = [];
let rptPollingInterval = null;
let isRptPolling = false;
let isRptEnabled = true;

// ============================================
// ИНИЦИАЛИЗАЦИЯ КОНСОЛИ
// ============================================
function initConsole() {
    console.log('📟 Инициализация консоли с RPT поддержкой');
    
    // Создаём кнопку
    createConsoleButton();
    
    // Создаём окно консоли (скрытое)
    createConsoleWindow();
    
    // Добавляем кнопку RPT
    addRptToggleButton();
    
    // Запускаем опрос RPT логов
    startRptPolling();
}

// ============================================
// СОЗДАНИЕ ПЛАВАЮЩЕЙ КНОПКИ
// ============================================
function createConsoleButton() {
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
                <span class="rpt-badge" id="rptStatusBadge">RPT ●</span>
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
            <div class="console-line console-system">[Система] Консоль загружена</div>
            <div class="console-line console-system">[Система] Ожидание RPT логов сервера...</div>
        </div>
    `;
    
    document.body.appendChild(window);
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
        // При открытии подгружаем свежие RPT логи
        fetchRPTLogs();
    } else {
        window.classList.remove('show');
        window.classList.add('hidden');
        btn.classList.remove('active');
    }
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
    while (body.children.length > 1000) {
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
    addConsoleLine('system', '[Система] Консоль очищена');
}

// ============================================
// ПОЛУЧЕНИЕ RPT ЛОГОВ С СЕРВЕРА
// ============================================
async function fetchRPTLogs() {
    if (!isRptEnabled) return;
    
    try {
        const response = await fetch('/api/server/rpt-logs');
        const data = await response.json();
        
        if (data.success && data.logs && data.logs.length > 0) {
            data.logs.forEach(log => {
                let type = log.type || 'info';
                let message = log.message || log.raw || '';
                
                // Пропускаем пустые сообщения
                if (!message.trim()) return;
                
                // Обрезаем слишком длинные строки
                if (message.length > 500) {
                    message = message.substring(0, 500) + '...';
                }
                
                addConsoleLine(type, message);
            });
            
            // Обновляем статус RPT
            updateRptStatus(true);
        }
    } catch (e) {
        console.warn('⚠️ Ошибка получения RPT логов:', e);
    }
}

// ============================================
// ОБНОВЛЕНИЕ СТАТУСА RPT
// ============================================
function updateRptStatus(active) {
    const badge = document.getElementById('rptStatusBadge');
    if (!badge) return;
    
    if (active && isRptEnabled) {
        badge.textContent = 'RPT ●';
        badge.style.color = 'rgba(74, 222, 128, 0.7)';
        badge.style.borderColor = 'rgba(74, 222, 128, 0.2)';
        badge.style.background = 'rgba(74, 222, 128, 0.08)';
    } else {
        badge.textContent = 'RPT ○';
        badge.style.color = 'rgba(255, 255, 255, 0.2)';
        badge.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        badge.style.background = 'rgba(255, 255, 255, 0.02)';
    }
}

// ============================================
// ЗАПУСК/ОСТАНОВКА ОПРОСА RPT ЛОГОВ
// ============================================
function startRptPolling() {
    if (isRptPolling || !isRptEnabled) return;
    
    isRptPolling = true;
    console.log('📟 Запуск опроса RPT логов...');
    
    // Первый запрос сразу
    setTimeout(() => fetchRPTLogs(), 500);
    
    // Затем каждые 2 секунды
    rptPollingInterval = setInterval(() => {
        fetchRPTLogs();
    }, 2000);
}

function stopRptPolling() {
    isRptPolling = false;
    if (rptPollingInterval) {
        clearInterval(rptPollingInterval);
        rptPollingInterval = null;
        console.log('📟 Остановка опроса RPT логов');
    }
    updateRptStatus(false);
}

// ============================================
// КНОПКА ВКЛ/ВЫКЛ RPT ЛОГОВ
// ============================================
function addRptToggleButton() {
    if (document.getElementById('rptToggleBtn')) return;
    
    const window = document.getElementById('consoleWindow');
    if (!window) return;
    
    const header = window.querySelector('.console-window-header');
    if (!header) return;
    
    const actions = header.querySelector('.console-window-actions');
    if (!actions) return;
    
    const btn = document.createElement('button');
    btn.id = 'rptToggleBtn';
    btn.className = 'rpt-toggle-btn';
    btn.style.cssText = `
        background: rgba(74, 222, 128, 0.06);
        border: 1px solid rgba(74, 222, 128, 0.12);
        color: rgba(74, 222, 128, 0.5);
        width: 32px;
        height: 28px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.3px;
        font-family: "Nunito", sans-serif;
    `;
    btn.textContent = 'RPT';
    btn.title = 'Включить/выключить RPT логи';
    btn.dataset.active = 'true';
    
    btn.onclick = toggleRptLogs;
    
    actions.insertBefore(btn, actions.firstChild);
}

function toggleRptLogs() {
    const btn = document.getElementById('rptToggleBtn');
    if (!btn) return;
    
    const isActive = btn.dataset.active === 'true';
    
    if (isActive) {
        // Выключаем RPT
        btn.dataset.active = 'false';
        btn.style.background = 'rgba(255, 255, 255, 0.02)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        btn.style.color = 'rgba(255, 255, 255, 0.15)';
        btn.title = 'RPT логи отключены';
        isRptEnabled = false;
        stopRptPolling();
        addConsoleLine('system', '📟 RPT логи отключены');
        updateRptStatus(false);
    } else {
        // Включаем RPT
        btn.dataset.active = 'true';
        btn.style.background = 'rgba(74, 222, 128, 0.06)';
        btn.style.borderColor = 'rgba(74, 222, 128, 0.12)';
        btn.style.color = 'rgba(74, 222, 128, 0.5)';
        btn.title = 'Включить/выключить RPT логи';
        isRptEnabled = true;
        addConsoleLine('system', '📟 RPT логи включены');
        startRptPolling();
        // Сразу подгружаем логи
        setTimeout(() => fetchRPTLogs(), 300);
    }
}

// ============================================
// ФОРМАТИРОВАНИЕ СООБЩЕНИЙ RPT
// ============================================
function formatRptMessage(log) {
    if (!log) return null;
    
    const type = log.type || 'info';
    const message = log.message || log.raw || '';
    
    // Специальная обработка для определённых типов
    switch(type) {
        case 'save':
            return {
                type: 'save',
                message: message,
                prefix: '💾'
            };
        case 'player_join':
            return {
                type: 'player_join',
                message: message,
                prefix: '👤'
            };
        case 'player_leave':
            return {
                type: 'player_leave',
                message: message,
                prefix: '🚪'
            };
        case 'death':
            return {
                type: 'death',
                message: message,
                prefix: '💀'
            };
        case 'start':
            return {
                type: 'start',
                message: message,
                prefix: '🚀'
            };
        case 'error':
            return {
                type: 'error',
                message: message,
                prefix: '❌'
            };
        case 'warning':
            return {
                type: 'warning',
                message: message,
                prefix: '⚠️'
            };
        case 'system':
            return {
                type: 'system',
                message: message,
                prefix: '⚙️'
            };
        default:
            return {
                type: type,
                message: message,
                prefix: ''
            };
    }
}

// ============================================
// ПОЛУЧЕНИЕ СТАТУСА RPT МОНИТОРА
// ============================================
async function checkRptStatus() {
    try {
        const response = await fetch('/api/server/rpt-status');
        const data = await response.json();
        
        if (data.success) {
            const isMonitoring = data.monitoring || false;
            updateRptStatus(isMonitoring && isRptEnabled);
            
            if (!isMonitoring && isRptEnabled) {
                // Если монитор не активен, но должен быть - пробуем перезапустить
                addConsoleLine('system', '⚠️ RPT монитор не активен, попытка перезапуска...');
                // Перезапускаем опрос
                stopRptPolling();
                setTimeout(() => startRptPolling(), 1000);
            }
        }
    } catch (e) {
        console.warn('⚠️ Ошибка проверки статуса RPT:', e);
    }
}

// ============================================
// ПЕРИОДИЧЕСКАЯ ПРОВЕРКА СТАТУСА
// ============================================
let statusCheckInterval = null;

function startStatusCheck() {
    if (statusCheckInterval) return;
    
    statusCheckInterval = setInterval(() => {
        checkRptStatus();
    }, 30000); // Каждые 30 секунд
}

function stopStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================
window.initConsole = initConsole;
window.toggleConsole = toggleConsole;
window.addConsoleLine = addConsoleLine;
window.clearConsoleWindow = clearConsoleWindow;
window.fetchRPTLogs = fetchRPTLogs;
window.startRptPolling = startRptPolling;
window.stopRptPolling = stopRptPolling;
window.toggleRptLogs = toggleRptLogs;
window.checkRptStatus = checkRptStatus;
window.updateRptStatus = updateRptStatus;
window.formatRptMessage = formatRptMessage;

// Запускаем проверку статуса
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        startStatusCheck();
        checkRptStatus();
    }, 2000);
});

console.log('📟 console.js загружен с RPT поддержкой');