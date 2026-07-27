# mods_scanner.py
import os
import json
import time
import re
from pathlib import Path

MODS_CACHE_FILE = 'mods_cache.json'

def scan_mods(workshop_path, custom_mods_path):
    """Сканирует папки с модами и возвращает список модов"""
    print(f'🔍 Сканирование модов...')
    print(f'   Workshop: {workshop_path}')
    print(f'   Custom: {custom_mods_path}')
    
    mods = []
    
    # Сканируем Workshop
    if workshop_path and os.path.exists(workshop_path):
        print(f'📁 Сканируем Workshop: {workshop_path}')
        try:
            for item in os.listdir(workshop_path):
                mod_path = os.path.join(workshop_path, item)
                if os.path.isdir(mod_path):
                    mod_info = get_mod_info(mod_path, 'workshop')
                    if mod_info:
                        mods.append(mod_info)
                        print(f'   ✅ Найден мод: {mod_info["name"]} (ID: {mod_info["id"]})')
        except Exception as e:
            print(f'❌ Ошибка сканирования Workshop: {e}')
    else:
        print(f'⚠️ Workshop не найден или путь пуст: {workshop_path}')
    
    # Сканируем кастомные моды
    if custom_mods_path and os.path.exists(custom_mods_path):
        print(f'📁 Сканируем кастомные моды: {custom_mods_path}')
        try:
            for item in os.listdir(custom_mods_path):
                mod_path = os.path.join(custom_mods_path, item)
                if os.path.isdir(mod_path):
                    mod_info = get_mod_info(mod_path, 'custom')
                    if mod_info:
                        mods.append(mod_info)
                        print(f'   ✅ Найден мод: {mod_info["name"]} ({mod_info["folder"]})')
        except Exception as e:
            print(f'❌ Ошибка сканирования кастомных модов: {e}')
    else:
        print(f'⚠️ Кастомные моды не найдены или путь пуст: {custom_mods_path}')
    
    print(f'✅ Всего найдено модов: {len(mods)}')
    return mods

def parse_meta_cpp(meta_path):
    """Парсит meta.cpp и извлекает name и version"""
    name = None
    version = None
    
    try:
        with open(meta_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Ищем name = "Название мода"
        name_match = re.search(r'name\s*=\s*"([^"]+)"', content, re.IGNORECASE)
        if name_match:
            name = name_match.group(1)
        
        # Ищем version = "1.2.3"
        version_match = re.search(r'version\s*=\s*"([^"]+)"', content, re.IGNORECASE)
        if version_match:
            version = version_match.group(1)
        
        # Если name не найден через кавычки, ищем без кавычек
        if not name:
            name_match = re.search(r'name\s*=\s*([^\s;]+)', content, re.IGNORECASE)
            if name_match:
                name = name_match.group(1).strip()
        
        # Если version не найден через кавычки, ищем без кавычек
        if not version:
            version_match = re.search(r'version\s*=\s*([^\s;]+)', content, re.IGNORECASE)
            if version_match:
                version = version_match.group(1).strip()
        
    except Exception as e:
        print(f'   ⚠️ Ошибка парсинга meta.cpp: {e}')
    
    return name, version

# mods_scanner.py - найти функцию get_mod_info и изменить

def get_mod_info(mod_path, mod_type):
    """Получает информацию о моде из папки"""
    try:
        if not os.path.exists(mod_path):
            return None
            
        meta_path = os.path.join(mod_path, 'meta.cpp')
        mod_json_path = os.path.join(mod_path, 'mod.json')
        
        folder_name = os.path.basename(mod_path)
        name = folder_name
        version = '0.0.0'
        has_meta = False
        
        if os.path.exists(meta_path):
            has_meta = True
            parsed_name, parsed_version = parse_meta_cpp(meta_path)
            if parsed_name:
                name = parsed_name
            if parsed_version:
                version = parsed_version
        
        if os.path.exists(mod_json_path):
            try:
                with open(mod_json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('name'):
                        name = data.get('name')
                    if data.get('version'):
                        version = data.get('version')
                    has_meta = True
            except:
                pass
        
        if mod_type == 'workshop':
            mod_id = os.path.basename(mod_path)
        else:
            mod_id = str(hash(mod_path))
        
        return {
            'id': mod_id,
            'name': name,
            'version': version,
            'folder': folder_name,
            'path': mod_path,
            'type': mod_type,
            'has_meta': has_meta,
            'server': False,
            'server_mod': False,
            'client': False  # ← МЕНЯЕМ с True на False
        }
    except Exception as e:
        print(f'❌ Ошибка чтения мода {mod_path}: {e}')
        return None
    
def get_mods_cache():
    """Получает кеш модов из файла"""
    if os.path.exists(MODS_CACHE_FILE):
        try:
            with open(MODS_CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f'❌ Ошибка чтения кеша: {e}')
    return None

def save_mods_cache(mods):
    """Сохраняет кеш модов в файл"""
    try:
        cache_data = {
            'mods': mods,
            'timestamp': time.time()
        }
        with open(MODS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)
        print(f'✅ Кеш сохранён: {len(mods)} модов')
        return True
    except Exception as e:
        print(f'❌ Ошибка сохранения кеша: {e}')
        return False

    