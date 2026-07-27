# file_manager.py
import os
import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List

class FileManager:
    """Единый менеджер для работы с файлами и настройками"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        self._base_dir = Path(__file__).parent.absolute()
        self._settings_file = self._base_dir / 'settings.json'
        self._mods_config_file = self._base_dir / 'mods_config.json'
        self._config = {}
        self._mods_config = {}
        self._load_all()
    
    def _load_all(self):
        """Загружает все конфиги"""
        self._load_settings()
        self._load_mods_config()
    
    def _load_settings(self):
        """Загружает настройки"""
        if self._settings_file.exists():
            try:
                with open(self._settings_file, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
                    return
            except:
                pass
        self._config = self._get_default_settings()
        self._save_settings()
    
    def _save_settings(self):
        """Сохраняет настройки"""
        try:
            with open(self._settings_file, 'w', encoding='utf-8') as f:
                json.dump(self._config, f, indent=4, ensure_ascii=False)
            return True
        except Exception as e:
            print(f'❌ Ошибка сохранения настроек: {e}')
            return False
    
    def _get_default_settings(self) -> Dict[str, str]:
        """Возвращает настройки по умолчанию"""
        return {
            'server_exe': '',
            'game_exe': '',
            'workshop': '',
            'custom_mods': '',
            'theme': ''
        }
    
    def _load_mods_config(self):
        """Загружает конфиг модов"""
        if self._mods_config_file.exists():
            try:
                with open(self._mods_config_file, 'r', encoding='utf-8') as f:
                    self._mods_config = json.load(f)
                    return
            except:
                pass
        self._mods_config = {}
        self._save_mods_config()
    
    def _save_mods_config(self):
        """Сохраняет конфиг модов"""
        try:
            with open(self._mods_config_file, 'w', encoding='utf-8') as f:
                json.dump(self._mods_config, f, indent=4, ensure_ascii=False)
            return True
        except Exception as e:
            print(f'❌ Ошибка сохранения конфига модов: {e}')
            return False
    
    # ============================================
    # ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ НАСТРОЕК
    # ============================================
    
    def get_setting(self, key: str, default: Any = None) -> Any:
        """Получить настройку"""
        return self._config.get(key, default)
    
    def set_setting(self, key: str, value: Any) -> bool:
        """Установить настройку"""
        self._config[key] = value
        return self._save_settings()
    
    def get_all_settings(self) -> Dict[str, Any]:
        """Получить все настройки"""
        return self._config.copy()
    
    def reset_setting(self, key: str) -> bool:
        """Сбросить настройку к значению по умолчанию"""
        defaults = self._get_default_settings()
        if key in defaults:
            self._config[key] = defaults[key]
            return self._save_settings()
        return False
    
    def reset_all_settings(self) -> bool:
        """Сбросить все настройки"""
        self._config = self._get_default_settings()
        return self._save_settings()
    
    # ============================================
    # ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ МОДОВ
    # ============================================
    
    def get_mod_state(self, mod_id: str, attr: str) -> bool:
        """Получить состояние атрибута мода"""
        if mod_id in self._mods_config:
            return self._mods_config[mod_id].get(attr, False)
        return False
    
    def set_mod_state(self, mod_id: str, attr: str, value: bool) -> bool:
        """Установить состояние атрибута мода"""
        if mod_id not in self._mods_config:
            self._mods_config[mod_id] = {}
        self._mods_config[mod_id][attr] = value
        return self._save_mods_config()
    
    def get_mod_full_state(self, mod_id: str) -> Dict[str, bool]:
        """Получить полное состояние мода"""
        if mod_id in self._mods_config:
            return self._mods_config[mod_id]
        return {'server': False, 'server_mod': False, 'client': False}
    
    def init_mods_config(self, mods: List[Dict]) -> Dict:
        """Инициализирует конфиг для новых модов"""
        changed = False
        for mod in mods:
            mod_id = mod.get('id')
            if mod_id and mod_id not in self._mods_config:
                self._mods_config[mod_id] = {
                    'server': False,
                    'server_mod': False,
                    'client': True  # По умолчанию клиентский мод включён
                }
                changed = True
        if changed:
            self._save_mods_config()
        return self._mods_config
    
    # ============================================
    # ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ ФАЙЛОВОЙ СИСТЕМЫ
    # ============================================
    
    def path_exists(self, path: str) -> bool:
        """Проверяет существование пути"""
        if not path:
            return False
        return Path(path).exists()
    
    def is_file(self, path: str) -> bool:
        """Проверяет, является ли путь файлом"""
        if not path:
            return False
        return Path(path).is_file()
    
    def is_dir(self, path: str) -> bool:
        """Проверяет, является ли путь папкой"""
        if not path:
            return False
        return Path(path).is_dir()
    
    def normalize_path(self, path: str) -> str:
        """Нормализует путь"""
        if not path:
            return ''
        return str(Path(path).resolve())
    
    def get_absolute_path(self, relative_path: str) -> Path:
        """Получает абсолютный путь относительно корня проекта"""
        return (self._base_dir / relative_path).resolve()
    
    def list_files(self, path: str, pattern: str = '*') -> List[Path]:
        """Список файлов в папке"""
        if not path or not self.path_exists(path):
            return []
        try:
            return list(Path(path).glob(pattern))
        except:
            return []
    
    def list_dirs(self, path: str) -> List[Path]:
        """Список папок в папке"""
        if not path or not self.path_exists(path):
            return []
        try:
            return [p for p in Path(path).iterdir() if p.is_dir()]
        except:
            return []
    
    def read_file(self, path: str, encoding: str = 'utf-8') -> Optional[str]:
        """Читает файл"""
        if not path or not self.path_exists(path):
            return None
        try:
            with open(path, 'r', encoding=encoding) as f:
                return f.read()
        except Exception as e:
            print(f'❌ Ошибка чтения файла {path}: {e}')
            return None
    
    def write_file(self, path: str, content: str, encoding: str = 'utf-8') -> bool:
        """Записывает файл"""
        try:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            with open(path, 'w', encoding=encoding) as f:
                f.write(content)
            return True
        except Exception as e:
            print(f'❌ Ошибка записи файла {path}: {e}')
            return False
    
    def read_json(self, path: str) -> Optional[Dict]:
        """Читает JSON файл"""
        content = self.read_file(path)
        if content:
            try:
                return json.loads(content)
            except:
                return None
        return None
    
    def write_json(self, path: str, data: Dict) -> bool:
        """Записывает JSON файл"""
        try:
            content = json.dumps(data, indent=4, ensure_ascii=False)
            return self.write_file(path, content)
        except:
            return False
    
    def copy_file(self, src: str, dst: str) -> bool:
        """Копирует файл"""
        if not src or not self.path_exists(src):
            return False
        try:
            Path(dst).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            return True
        except Exception as e:
            print(f'❌ Ошибка копирования: {e}')
            return False
    
    def move_file(self, src: str, dst: str) -> bool:
        """Перемещает файл"""
        if not src or not self.path_exists(src):
            return False
        try:
            Path(dst).parent.mkdir(parents=True, exist_ok=True)
            shutil.move(src, dst)
            return True
        except Exception as e:
            print(f'❌ Ошибка перемещения: {e}')
            return False
    
    def delete_file(self, path: str) -> bool:
        """Удаляет файл"""
        if not path or not self.path_exists(path):
            return False
        try:
            if Path(path).is_file():
                Path(path).unlink()
                return True
            return False
        except Exception as e:
            print(f'❌ Ошибка удаления: {e}')
            return False
    
    def delete_dir(self, path: str) -> bool:
        """Удаляет папку"""
        if not path or not self.path_exists(path):
            return False
        try:
            if Path(path).is_dir():
                shutil.rmtree(path)
                return True
            return False
        except Exception as e:
            print(f'❌ Ошибка удаления папки: {e}')
            return False
    
    def create_dir(self, path: str) -> bool:
        """Создаёт папку"""
        try:
            Path(path).mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            print(f'❌ Ошибка создания папки: {e}')
            return False
    
    def get_file_size(self, path: str) -> int:
        """Получает размер файла в байтах"""
        if not path or not self.path_exists(path):
            return 0
        try:
            return Path(path).stat().st_size
        except:
            return 0
    
    def get_file_info(self, path: str) -> Dict:
        """Получает информацию о файле"""
        if not path or not self.path_exists(path):
            return {}
        try:
            p = Path(path)
            stat = p.stat()
            return {
                'name': p.name,
                'path': str(p),
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'created': stat.st_ctime,
                'is_file': p.is_file(),
                'is_dir': p.is_dir(),
                'extension': p.suffix if p.is_file() else ''
            }
        except Exception as e:
            print(f'❌ Ошибка получения информации: {e}')
            return {}
    
    def open_in_explorer(self, path: str) -> bool:
        """Открывает путь в проводнике"""
        if not path or not self.path_exists(path):
            return False
        try:
            if os.name == 'nt':  # Windows
                os.startfile(path)
            else:  # Linux/Mac
                subprocess.Popen(['xdg-open', path])
            return True
        except Exception as e:
            print(f'❌ Ошибка открытия проводника: {e}')
            return False
    
    def get_base_dir(self) -> Path:
        """Возвращает базовую директорию проекта"""
        return self._base_dir
    
    def get_settings_file(self) -> Path:
        """Возвращает путь к файлу настроек"""
        return self._settings_file
    
    def get_mods_config_file(self) -> Path:
        """Возвращает путь к файлу конфига модов"""
        return self._mods_config_file

# ============================================
# СОЗДАЁМ ГЛОБАЛЬНЫЙ ЭКЗЕМПЛЯР - ОДИН ДЛЯ ВСЕХ!
# ============================================

file_manager = FileManager()

# ============================================
# ТЕСТОВЫЙ ЗАПУСК
# ============================================

if __name__ == "__main__":
    print('📁 FileManager инициализирован')
    print(f'📂 Базовая директория: {file_manager.get_base_dir()}')
    print(f'📄 Файл настроек: {file_manager.get_settings_file()}')
    print(f'📄 Файл конфига модов: {file_manager.get_mods_config_file()}')
    print('✅ Все готово!')