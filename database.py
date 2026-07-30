# database.py
import sqlite3
import json
import os

DB_PATH = 'config/dayzm.db'

def get_db():
    """Получить соединение с БД"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Инициализация БД — создаём таблицы"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Таблица настроек (ключ-значение)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица путей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS paths (
            id TEXT PRIMARY KEY,
            label TEXT,
            path TEXT,
            placeholder TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблица цветов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS colors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            accent TEXT DEFAULT '#7acc7a',
            glow_intensity INTEGER DEFAULT 50,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # ===== НОВАЯ ТАБЛИЦА: СТРАНИЦЫ =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pages (
            id TEXT PRIMARY KEY,
            name TEXT,
            icon TEXT,
            content TEXT,
            is_home INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Вставляем дефолтные значения, если таблица пустая
    cursor.execute('SELECT COUNT(*) FROM colors')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO colors (accent, glow_intensity) VALUES (?, ?)', 
                      ('#7acc7a', 50))
    
    cursor.execute('SELECT COUNT(*) FROM settings')
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO settings (key, value) VALUES (?, ?)', 
                      ('effect', 'fade'))
    
    conn.commit()
    conn.close()
    print('✅ База данных инициализирована')

# ============================================
# РАБОТА С НАСТРОЙКАМИ
# ============================================

def get_setting(key, default=None):
    """Получить настройку по ключу"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM settings WHERE key = ?', (key,))
    row = cursor.fetchone()
    conn.close()
    return row['value'] if row else default

def set_setting(key, value):
    """Сохранить настройку"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    ''', (key, value))
    conn.commit()
    conn.close()

def get_all_settings():
    """Получить все настройки"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT key, value FROM settings')
    rows = cursor.fetchall()
    conn.close()
    return {row['key']: row['value'] for row in rows}

# ============================================
# РАБОТА С ПУТЯМИ
# ============================================

def get_all_paths():
    """Получить все пути"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, label, path, placeholder FROM paths ORDER BY id')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_path(path_id):
    """Получить путь по ID"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, label, path, placeholder FROM paths WHERE id = ?', (path_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_path(path_id, path_value):
    """Сохранить путь"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE paths SET path = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (path_value, path_id))
    conn.commit()
    conn.close()

def save_paths(paths_dict):
    """Сохранить несколько путей"""
    conn = get_db()
    cursor = conn.cursor()
    for path_id, path_value in paths_dict.items():
        cursor.execute('''
            UPDATE paths SET path = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (path_value, path_id))
    conn.commit()
    conn.close()

def init_default_paths():
    """Инициализация дефолтных путей"""
    default_paths = [
        ('server', 'Путь до сервера', 'C:\\DayzServer\\', 'Выберите папку сервера...'),
        ('game_exe', 'Путь до EXE игры', 'D:\\Steam\\steamapps\\common\\DayZ\\', 'Выберите папку с игрой...'),
        ('workshop', 'Папка Workshop', 'D:\\Steam\\steamapps\\workshop\\content\\221100\\', 'Выберите папку Workshop...'),
        ('mods', 'Папка со своими модами', 'C:\\DayzM\\Mods\\', 'Выберите папку с модами...')
    ]
    
    conn = get_db()
    cursor = conn.cursor()
    
    for path_id, label, default_path, placeholder in default_paths:
        cursor.execute('''
            INSERT OR IGNORE INTO paths (id, label, path, placeholder)
            VALUES (?, ?, ?, ?)
        ''', (path_id, label, default_path, placeholder))
    
    conn.commit()
    conn.close()

# ============================================
# РАБОТА С ЦВЕТАМИ
# ============================================

def get_colors():
    """Получить цвета"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT accent, glow_intensity FROM colors ORDER BY id DESC LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    return {
        'accent': row['accent'] if row else '#7acc7a',
        'glowIntensity': row['glow_intensity'] if row else 50
    }

def save_colors(accent, glow_intensity):
    """Сохранить цвета"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO colors (accent, glow_intensity, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    ''', (accent, glow_intensity))
    conn.commit()
    conn.close()

# ============================================
# РАБОТА СО СТРАНИЦАМИ (НОВОЕ)
# ============================================

def get_all_pages():
    """Получить все страницы (кроме домашней)"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, icon, content, sort_order 
        FROM pages 
        WHERE is_home = 0 
        ORDER BY sort_order
    ''')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_home_page():
    """Получить домашнюю страницу"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, icon, content 
        FROM pages 
        WHERE is_home = 1 
        LIMIT 1
    ''')
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def init_default_pages():
    """Инициализация дефолтных страниц"""
    default_pages = [
        # Домашняя страница
        ('home', 'Главная', '', 
         '<div class="welcome-screen"><div class="welcome-logo"><span class="welcome-dayz">Dayz</span><span class="welcome-m">M</span></div><p class="welcome-subtitle">Платформа управления сервером</p><div class="loader"><div class="inner one"></div><div class="inner two"></div><div class="inner three"></div></div></div>',
         1, 0),
        # Остальные страницы
        ('server', 'Сервер', 
         '<svg viewBox="0 0 24 24" fill="none" stroke="#7d827d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>',
         '<div class="content-card"><h1>Сервер</h1><p>Управление сервером DayzM. Мониторинг производительности, настройка параметров и управление подключениями.</p></div><div class="grid-2"><div class="stat-box"><div class="stat-value">45ms</div><div class="stat-label">Пинг</div></div><div class="stat-box"><div class="stat-value">98.2%</div><div class="stat-label">Аптайм</div></div></div><div class="content-card"><div class="card-header"><span class="card-badge">v2.4.1</span></div><p>Текущая версия сервера. Все системы работают в штатном режиме.</p></div>',
         0, 1),
        ('client', 'Клиент',
         '<svg viewBox="0 0 24 24" fill="none" stroke="#7d827d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
         '<div class="content-card"><h1>Клиент</h1><p>Настройки клиентской части. Управление интерфейсом, графикой и пользовательскими параметрами.</p></div><div class="grid-2"><div class="stat-box"><div class="stat-value">144</div><div class="stat-label">FPS</div></div><div class="stat-box"><div class="stat-value">2.1GB</div><div class="stat-label">Память</div></div></div>',
         0, 2),
        ('mods', 'Моды',
         '<svg viewBox="0 0 24 24" fill="none" stroke="#7d827d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
         '<div class="content-card"><h1>Моды</h1><p>Управление модификациями. Установка, обновление и настройка пользовательских модов.</p></div><div class="content-card"><div class="card-header"><span class="card-badge">12 активных</span><span class="card-badge">3 ожидают</span></div><p>Всего установлено 24 мода. Требуется обновление для 2 из них.</p></div>',
         0, 3),
        ('editors', 'Редакторы',
         '<svg viewBox="0 0 24 24" fill="none" stroke="#7d827d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>',
         '<div class="content-card"><h1>Редакторы</h1><p>Инструменты редактирования контента. Создание и изменение игровых ресурсов.</p></div><div class="grid-2"><div class="stat-box"><div class="stat-value">7</div><div class="stat-label">Проектов</div></div><div class="stat-box"><div class="stat-value">342</div><div class="stat-label">Ассетов</div></div></div>',
         0, 4)
    ]
    
    conn = get_db()
    cursor = conn.cursor()
    
    for page_id, name, icon, content, is_home, sort_order in default_pages:
        cursor.execute('''
            INSERT OR IGNORE INTO pages (id, name, icon, content, is_home, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (page_id, name, icon, content, is_home, sort_order))
    
    conn.commit()
    conn.close()
    print('✅ Дефолтные страницы загружены в БД')