// ============================================
// УПРАВЛЕНИЕ СЕРВЕРОМ И ИГРОЙ (РЕАЛЬНЫЕ ВЫЗОВЫ)
// ============================================

// Состояние кнопок
let isServerActionInProgress = false;
let isGameActionInProgress = false;

// ============================================
// УПРАВЛЕНИЕ СЕРВЕРОМ
// ============================================

async function controlServer(action, event) {
    // Предотвращаем переход по ссылке
    if (event) {
        event.preventDefault();
    }
    
    if (isServerActionInProgress) {
        if (typeof notifications !== 'undefined') {
            notifications.warning('Подождите, выполняется предыдущая операция...');
        }
        return;
    }
    
    const actionNames = {
        'start': 'Запуск сервера',
        'restart': 'Перезапуск сервера',
        'stop': 'Остановка сервера'
    };
    
    const actionIcons = {
        'start': '▶️',
        'restart': '🔄',
        'stop': '⏹️'
    };
    
    console.log(`${actionIcons[action]} ${actionNames[action]}`);
    
    // Находим кнопку
    const btn = document.querySelector(`.control-btn.control-${action === 'start' ? 'start' : action === 'restart' ? 'restart' : 'stop'}`);
    if (btn) {
        btn.classList.add('loading');
        btn.style.opacity = '0.6';
        btn.style.pointerEvents = 'none';
    }
    
    isServerActionInProgress = true;
    
    try {
        const endpoint = `/api/server/${action}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (typeof notifications !== 'undefined') {
                notifications.success(data.message || `${actionNames[action]} выполнен`);
            }
        } else {
            if (typeof notifications !== 'undefined') {
                notifications.error(data.message || `Ошибка ${actionNames[action]}`);
            }
        }
        
        // Обновляем статус сервера
        await updateServerStatus();
        
    } catch (e) {
        console.error('❌ Ошибка:', e);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка: ' + e.message);
        }
    }
    
    // Восстанавливаем кнопку
    if (btn) {
        btn.classList.remove('loading');
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
    
    isServerActionInProgress = false;
}

// ============================================
// ПОЛУЧЕНИЕ СТАТУСА СЕРВЕРА
// ============================================

async function updateServerStatus() {
    try {
        const response = await fetch('/api/server/status');
        const data = await response.json();
        
        if (data.success && data.status) {
            const status = data.status;
            
            // Обновляем индикацию в меню
            const startBtn = document.querySelector('.control-btn.control-start');
            const stopBtn = document.querySelector('.control-btn.control-stop');
            const restartBtn = document.querySelector('.control-btn.control-restart');
            
            if (status.running) {
                // Сервер запущен
                if (startBtn) {
                    startBtn.style.opacity = '0.5';
                    startBtn.title = 'Сервер уже запущен';
                }
                if (stopBtn) {
                    stopBtn.style.opacity = '1';
                    stopBtn.title = 'Остановить сервер';
                }
                if (restartBtn) {
                    restartBtn.style.opacity = '1';
                    restartBtn.title = 'Перезапустить сервер';
                }
                
                // Добавляем индикатор статуса в меню
                updateStatusIndicator(true, status);
                
            } else {
                // Сервер остановлен
                if (startBtn) {
                    startBtn.style.opacity = '1';
                    startBtn.title = 'Запустить сервер';
                }
                if (stopBtn) {
                    stopBtn.style.opacity = '0.5';
                    stopBtn.title = 'Сервер не запущен';
                }
                if (restartBtn) {
                    restartBtn.style.opacity = '0.5';
                    restartBtn.title = 'Сервер не запущен';
                }
                
                updateStatusIndicator(false, null);
            }
        }
    } catch (e) {
        console.warn('⚠️ Ошибка получения статуса сервера:', e);
    }
}

// ============================================
// ИНДИКАТОР СТАТУСА В МЕНЮ
// ============================================

function updateStatusIndicator(running, status) {
    // Удаляем старый индикатор
    const oldIndicator = document.querySelector('.server-status-indicator');
    if (oldIndicator) {
        oldIndicator.remove();
    }
    
    const menuBottom = document.querySelector('.menu-bottom');
    if (!menuBottom) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'server-status-indicator';
    indicator.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        margin: 4px 12px;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 500;
        background: ${running ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)'};
        border: 1px solid ${running ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
        color: ${running ? '#4ade80' : 'rgba(255, 255, 255, 0.3)'};
    `;
    
    const dot = document.createElement('span');
    dot.style.cssText = `
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${running ? '#4ade80' : 'rgba(255, 255, 255, 0.15)'};
        ${running ? 'box-shadow: 0 0 10px rgba(74, 222, 128, 0.3);' : ''}
        ${running ? 'animation: pulse-dot 1.5s ease-in-out infinite;' : ''}
    `;
    
    const text = document.createElement('span');
    text.textContent = running ? 
        `🟢 Сервер запущен (PID: ${status?.pid || '?'})` : 
        '⚪ Сервер остановлен';
    
    indicator.appendChild(dot);
    indicator.appendChild(text);
    
    // Вставляем перед блоком настроек
    const settingsBlock = menuBottom.querySelector('.menu-block-settings');
    if (settingsBlock) {
        menuBottom.insertBefore(indicator, settingsBlock);
    } else {
        menuBottom.appendChild(indicator);
    }
}

// ============================================
// УПРАВЛЕНИЕ ИГРОЙ
// ============================================

function controlGame(action, event) {
    // Предотвращаем переход по ссылке
    if (event) {
        event.preventDefault();
    }
    
    if (isGameActionInProgress) {
        if (typeof notifications !== 'undefined') {
            notifications.warning('Подождите, выполняется предыдущая операция...');
        }
        return;
    }
    
    const actionNames = {
        'start': 'Запуск игры',
        'stop': 'Остановка игры'
    };
    
    const actionIcons = {
        'start': '🎮',
        'stop': '⏹️'
    };
    
    console.log(`${actionIcons[action]} ${actionNames[action]}`);
    
    // TODO: Здесь будет реальная логика запуска игры
    // Пока что заглушка с уведомлением
    
    if (typeof notifications !== 'undefined') {
        notifications.info(`${actionIcons[action]} ${actionNames[action]} (в разработке)`);
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Добавляем стили для пульсации индикатора
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse-dot {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.5;
                transform: scale(1.3);
            }
        }
        
        .control-btn.loading {
            position: relative;
        }
        
        .control-btn.loading .nav-text::after {
            content: '...';
            animation: dots 1.2s steps(3, end) infinite;
        }
        
        @keyframes dots {
            0% { content: ''; }
            33% { content: '.'; }
            66% { content: '..'; }
            100% { content: '...'; }
        }
    `;
    document.head.appendChild(style);
    
    // Проверяем статус сервера при загрузке
    setTimeout(() => {
        updateServerStatus();
    }, 1000);
    
    // Обновляем статус каждые 10 секунд
    setInterval(() => {
        updateServerStatus();
    }, 10000);
});

// ============================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================

window.controlServer = controlServer;
window.controlGame = controlGame;
window.updateServerStatus = updateServerStatus;

console.log('🎮 controls.js загружен (с реальным API)');