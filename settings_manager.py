import os
import json

# ============================================
# ПУТИ К ФАЙЛАМ НАСТРОЕК
# ============================================

# Путь к файлу с основными настройками (пути к серверу, игре и т.д.)
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'settings.json')

# Путь к файлу с настройками модов (включен/выключен)
MODS_CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'mods_config.json')

# Путь к файлу с состоянием редакторов и сервера
SERVER_CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'server_config.json')

# Путь к файлу с настройками подключений сервера
SERVER_LINKS_FILE = os.path.join(os.path.dirname(__file__), 'server_links.json')

# Путь к файлу с настройками подключений игры
GAME_LINKS_FILE = os.path.join(os.path.dirname(__file__), 'game_links.json')


# ============================================
# ОСНОВНЫЕ НАСТРОЙКИ (settings.json)
# ============================================

def load_settings():
    """Загружает основные настройки из JSON файла"""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_settings(settings):
    """Сохраняет основные настройки в JSON файл"""
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f'❌ Ошибка сохранения настроек: {e}')
        return False

def get_setting(key, default=None):
    """Получает конкретную настройку"""
    settings = load_settings()
    return settings.get(key, default)

def set_setting(key, value):
    """Устанавливает конкретную настройку"""
    settings = load_settings()
    settings[key] = value
    return save_settings(settings)


# ============================================
# НАСТРОЙКИ МОДОВ (mods_config.json)
# ============================================

def load_mods_config():
    """Загружает конфиг модов"""
    if os.path.exists(MODS_CONFIG_FILE):
        try:
            with open(MODS_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_mods_config(config):
    """Сохраняет конфиг модов"""
    try:
        with open(MODS_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f'❌ Ошибка сохранения конфига модов: {e}')
        return False

def get_mod_state(mod_id, attr):
    """Получить состояние конкретного атрибута мода"""
    config = load_mods_config()
    if mod_id in config:
        return config[mod_id].get(attr, False)
    return False

def set_mod_state(mod_id, attr, value):
    """Установить состояние конкретного атрибута мода"""
    config = load_mods_config()
    if mod_id not in config:
        config[mod_id] = {}
    config[mod_id][attr] = value
    return save_mods_config(config)

def get_mod_full_state(mod_id):
    """Получить полное состояние мода"""
    config = load_mods_config()
    if mod_id in config:
        return config[mod_id]
    return {
        'server': False,
        'server_mod': False,
        'client': True
    }

def init_mods_config(mods):
    """Инициализирует конфиг для новых модов (если их нет)"""
    config = load_mods_config()
    changed = False
    
    for mod in mods:
        mod_id = mod['id']
        if mod_id not in config:
            config[mod_id] = {
                'server': False,
                'server_mod': False,
                'client': True  # По умолчанию клиентский мод включён
            }
            changed = True
    
    if changed:
        save_mods_config(config)
    
    return config

def reset_all_mods():
    """Сбрасывает все настройки модов"""
    try:
        if os.path.exists(MODS_CONFIG_FILE):
            os.remove(MODS_CONFIG_FILE)
        return True
    except Exception as e:
        print(f'❌ Ошибка сброса модов: {e}')
        return False


# ============================================
# СОСТОЯНИЕ СЕРВЕРА И РЕДАКТОРОВ (server_config.json)
# ============================================

def load_server_config_state():
    """
    Загружает сохранённое состояние настроек сервера и редакторов.
    Используется для сохранения выбранной карты, последних настроек и т.д.
    """
    if os.path.exists(SERVER_CONFIG_FILE):
        try:
            with open(SERVER_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_server_config_state(state):
    """
    Сохраняет состояние настроек сервера и редакторов.
    """
    try:
        with open(SERVER_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f'❌ Ошибка сохранения состояния сервера: {e}')
        return False

# ----- Настройки serverDZ.cfg -----

def get_server_template():
    """Возвращает сохранённый шаблон миссии"""
    state = load_server_config_state()
    server_state = state.get('serverDZ', {})
    return server_state.get('template', 'dayzOffline.chernarusplus')

def set_server_template(template):
    """Сохраняет шаблон миссии"""
    state = load_server_config_state()
    if 'serverDZ' not in state:
        state['serverDZ'] = {}
    state['serverDZ']['template'] = template
    return save_server_config_state(state)

def get_server_hostname():
    """Возвращает сохранённое имя сервера"""
    state = load_server_config_state()
    server_state = state.get('serverDZ', {})
    return server_state.get('hostname', 'DayZ Server')

def set_server_hostname(hostname):
    """Сохраняет имя сервера"""
    state = load_server_config_state()
    if 'serverDZ' not in state:
        state['serverDZ'] = {}
    state['serverDZ']['hostname'] = hostname
    return save_server_config_state(state)

def get_server_max_players():
    """Возвращает сохранённое максимальное количество игроков"""
    state = load_server_config_state()
    server_state = state.get('serverDZ', {})
    return server_state.get('maxPlayers', 60)

def set_server_max_players(max_players):
    """Сохраняет максимальное количество игроков"""
    state = load_server_config_state()
    if 'serverDZ' not in state:
        state['serverDZ'] = {}
    state['serverDZ']['maxPlayers'] = max_players
    return save_server_config_state(state)

def get_server_password_admin():
    """Возвращает сохранённый admin пароль"""
    state = load_server_config_state()
    server_state = state.get('serverDZ', {})
    return server_state.get('passwordAdmin', '')

def set_server_password_admin(password):
    """Сохраняет admin пароль"""
    state = load_server_config_state()
    if 'serverDZ' not in state:
        state['serverDZ'] = {}
    state['serverDZ']['passwordAdmin'] = password
    return save_server_config_state(state)

def get_server_password():
    """Возвращает сохранённый пароль для входа"""
    state = load_server_config_state()
    server_state = state.get('serverDZ', {})
    return server_state.get('password', '')

def set_server_password(password):
    """Сохраняет пароль для входа"""
    state = load_server_config_state()
    if 'serverDZ' not in state:
        state['serverDZ'] = {}
    state['serverDZ']['password'] = password
    return save_server_config_state(state)

def get_server_all_settings():
    """Возвращает все сохранённые настройки serverDZ"""
    state = load_server_config_state()
    return state.get('serverDZ', {})

def set_server_all_settings(settings):
    """Сохраняет все настройки serverDZ"""
    state = load_server_config_state()
    state['serverDZ'] = settings
    return save_server_config_state(state)

# ----- Состояние редакторов -----

def get_editor_state(editor_name):
    """
    Загружает состояние конкретного редактора.
    editor_name: 'mpg_editor', 'fc_fish_editor', 'loot_extractor' и т.д.
    """
    state = load_server_config_state()
    return state.get(editor_name, {})

def save_editor_state(editor_name, data):
    """
    Сохраняет состояние конкретного редактора.
    editor_name: 'mpg_editor', 'fc_fish_editor', 'loot_extractor' и т.д.
    """
    state = load_server_config_state()
    state[editor_name] = data
    return save_server_config_state(state)

def get_editor_setting(editor_name, key, default=None):
    """Получает конкретную настройку редактора"""
    editor_state = get_editor_state(editor_name)
    return editor_state.get(key, default)

def set_editor_setting(editor_name, key, value):
    """Устанавливает конкретную настройку редактора"""
    editor_state = get_editor_state(editor_name)
    editor_state[key] = value
    return save_editor_state(editor_name, editor_state)


# ============================================
# НАСТРОЙКИ ПОДКЛЮЧЕНИЙ (server_links.json)
# ============================================

def load_server_links():
    """Загружает настройки подключений сервера"""
    if os.path.exists(SERVER_LINKS_FILE):
        try:
            with open(SERVER_LINKS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_server_links(links):
    """Сохраняет настройки подключений сервера"""
    try:
        with open(SERVER_LINKS_FILE, 'w', encoding='utf-8') as f:
            json.dump(links, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f'❌ Ошибка сохранения связей сервера: {e}')
        return False

def get_server_link(mod_id):
    """Получает связь для конкретного мода"""
    links = load_server_links()
    return links.get(mod_id, {})

def set_server_link(mod_id, data):
    """Устанавливает связь для конкретного мода"""
    links = load_server_links()
    links[mod_id] = data
    return save_server_links(links)

def remove_server_link(mod_id):
    """Удаляет связь для конкретного мода"""
    links = load_server_links()
    if mod_id in links:
        del links[mod_id]
        return save_server_links(links)
    return True

def clear_server_links():
    """Очищает все связи сервера"""
    return save_server_links({})


# ============================================
# НАСТРОЙКИ ПОДКЛЮЧЕНИЙ ИГРЫ (game_links.json)
# ============================================

def load_game_links():
    """Загружает настройки подключений игры"""
    if os.path.exists(GAME_LINKS_FILE):
        try:
            with open(GAME_LINKS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_game_links(links):
    """Сохраняет настройки подключений игры"""
    try:
        with open(GAME_LINKS_FILE, 'w', encoding='utf-8') as f:
            json.dump(links, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f'❌ Ошибка сохранения связей игры: {e}')
        return False

def get_game_link(mod_id):
    """Получает связь для конкретного мода в игре"""
    links = load_game_links()
    return links.get(mod_id, {})

def set_game_link(mod_id, data):
    """Устанавливает связь для конкретного мода в игре"""
    links = load_game_links()
    links[mod_id] = data
    return save_game_links(links)

def remove_game_link(mod_id):
    """Удаляет связь для конкретного мода в игре"""
    links = load_game_links()
    if mod_id in links:
        del links[mod_id]
        return save_game_links(links)
    return True

def clear_game_links():
    """Очищает все связи игры"""
    return save_game_links({})


# ============================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# ============================================

def get_all_configs_info():
    """Возвращает информацию о всех конфигах для отладки"""
    return {
        'settings': load_settings(),
        'mods_config': load_mods_config(),
        'server_config': load_server_config_state(),
        'server_links': load_server_links(),
        'game_links': load_game_links()
    }

def reset_all_configs():
    """Сбрасывает все конфиги (осторожно!)"""
    try:
        for file in [SETTINGS_FILE, MODS_CONFIG_FILE, SERVER_CONFIG_FILE, 
                     SERVER_LINKS_FILE, GAME_LINKS_FILE]:
            if os.path.exists(file):
                os.remove(file)
        return True
    except Exception as e:
        print(f'❌ Ошибка сброса всех конфигов: {e}')
        return False

def ensure_configs_exist():
    """Создаёт пустые конфиги если их нет"""
    configs = [
        (SETTINGS_FILE, {}),
        (MODS_CONFIG_FILE, {}),
        (SERVER_CONFIG_FILE, {}),
        (SERVER_LINKS_FILE, {}),
        (GAME_LINKS_FILE, {})
    ]
    
    for file_path, default_data in configs:
        if not os.path.exists(file_path):
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, indent=2, ensure_ascii=False)
                print(f'✅ Создан файл: {file_path}')
            except Exception as e:
                print(f'❌ Ошибка создания {file_path}: {e}')
                return False
    return True