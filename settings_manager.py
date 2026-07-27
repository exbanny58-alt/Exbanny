# settings_manager.py
import os
import json

MODS_CONFIG_FILE = 'mods_config.json'

def load_settings():
    """Загружает настройки из settings.json"""
    settings_file = 'settings.json'
    if os.path.exists(settings_file):
        try:
            with open(settings_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def load_mods_config():
    """Загружает конфиг модов"""
    if os.path.exists(MODS_CONFIG_FILE):
        try:
            with open(MODS_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f'❌ Ошибка загрузки конфига: {e}')
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

# settings_manager.py - найти функцию init_mods_config

def init_mods_config(mods):
    """Инициализирует конфиг для новых модов"""
    config = load_mods_config()
    changed = False
    
    for mod in mods:
        mod_id = mod.get('id')
        if mod_id and mod_id not in config:
            config[mod_id] = {
                'server': False,
                'server_mod': False,
                'client': False  # ← МЕНЯЕМ с True на False
            }
            changed = True
    
    if changed:
        save_mods_config(config)
    
    return config

def set_mod_state(mod_id, attr, value):
    """Устанавливает состояние атрибута мода"""
    config = load_mods_config()
    if mod_id not in config:
        config[mod_id] = {}
    config[mod_id][attr] = value
    return save_mods_config(config)

def get_mod_full_state(mod_id):
    """Получает полное состояние мода"""
    config = load_mods_config()
    if mod_id in config:
        return config[mod_id]
    return {'server': False, 'server_mod': False, 'client': False}