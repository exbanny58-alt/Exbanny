# server_manager.py
import psutil
import subprocess
import os
import threading
import time
import queue
import sys
import json
from rpt_monitor import RPTMonitor
from pid_manager import save_pid, load_pid, clear_pid, is_process_running
import server_links  # Импортируем весь модуль


class DayZServer:
    def __init__(self, server_path, executable="DayZServer_x64.exe", config="serverDZ.cfg"):
        self.server_path = server_path
        self.executable = executable
        self.config = config
        self.process = None
        self._using_pid = False
        self._pid = None
        self.log_queue = queue.Queue()
        self.reader_thread = None
        self.should_read = False
        
        # RPT монитор
        self.rpt_monitor = None
        self.rpt_monitor_thread = None
        self.should_monitor_rpt = False
        self.rpt_log_queue = queue.Queue()
        
        # Путь к папке profiles
        self.profiles_dir = os.path.join(server_path, "profiles") if server_path else ""
        
        # Пытаемся восстановить PID
        self._restore_pid()
        
        # Запускаем RPT монитор
        self._init_rpt_monitor()

    def _restore_pid(self):
        """Восстанавливает PID сервера из файла"""
        pid = load_pid('server')
        if pid and is_process_running(pid):
            print(f'🔄 Восстановлен PID сервера: {pid}')
            self._pid = pid
            self._using_pid = True
            self.process = None
            return True
        
        if pid:
            print(f'⚠️ PID сервера {pid} не активен, очищаем')
            clear_pid('server')
        return False

    def _init_rpt_monitor(self):
        """Инициализирует и запускает RPT монитор."""
        if not self.profiles_dir or not os.path.exists(self.profiles_dir):
            if self.server_path:
                alt_profiles = os.path.join(self.server_path, "profiles")
                if os.path.exists(alt_profiles):
                    self.profiles_dir = alt_profiles
                    print(f"✅ Найдена папка profiles: {self.profiles_dir}")
                else:
                    try:
                        os.makedirs(alt_profiles, exist_ok=True)
                        self.profiles_dir = alt_profiles
                        print(f"✅ Создана папка profiles: {self.profiles_dir}")
                    except:
                        print(f"❌ Не удалось создать папку profiles")
                        return
        
        try:
            self.rpt_monitor = RPTMonitor(self.profiles_dir)
            self.should_monitor_rpt = True
            self.rpt_monitor_thread = threading.Thread(target=self._rpt_monitor_loop, daemon=True)
            self.rpt_monitor_thread.start()
            print(f"📟 RPT монитор запущен, папка: {self.profiles_dir}")
        except Exception as e:
            print(f"❌ Ошибка запуска RPT монитора: {e}")

    def _rpt_monitor_loop(self):
        """Запускает RPT монитор в отдельном потоке и передаёт логи."""
        if not self.rpt_monitor:
            return
        
        self.rpt_monitor.start()
        
        while self.should_monitor_rpt and self.rpt_monitor:
            try:
                logs = self.rpt_monitor.get_logs()
                for log in logs:
                    self.rpt_log_queue.put(log)
                time.sleep(0.1)
            except Exception as e:
                print(f"⚠️ Ошибка в RPT мониторе: {e}")
                time.sleep(1)
        
        if self.rpt_monitor:
            self.rpt_monitor.stop()

    def is_running(self):
        """Проверяет, жив ли процесс сервера."""
        if self._using_pid and self._pid:
            return is_process_running(self._pid)
        if self.process is None:
            return False
        return self.process.poll() is None

    def _get_mod_folder_from_cache(self, mod_id):
        """Получает папку мода из кеша"""
        try:
            cache_file = os.path.join(os.path.dirname(__file__), 'mods_cache.json')
            if os.path.exists(cache_file):
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cache = json.load(f)
                    for mod in cache.get('mods', []):
                        if mod.get('id') == mod_id:
                            return mod.get('folder', '')
        except:
            pass
        return ''

    def start(self, mods_config=None):
        """Запускает сервер, если он еще не запущен."""
        if self.is_running():
            return False, "Сервер уже запущен."

        if not self.server_path or not os.path.exists(self.server_path):
            return False, f"Папка сервера не найдена: {self.server_path}"

        executable_path = os.path.join(self.server_path, self.executable)
        if not os.path.exists(executable_path):
            return False, f"Исполняемый файл не найден: {executable_path}"

        command = [
            executable_path,
            f"-config={self.config}",
            "-profiles=profiles",
            "-port=2302",
            "-freezecheck",
            "-noFilePatching",
            "-doLogs",
            "-adminLog",
            "-netLog",
            "-pid=dayz.pid"
        ]
        
        # ============ ФОРМИРУЕМ АРГУМЕНТЫ МОДОВ ============
        from settings_manager import load_mods_config
        
        server_links_data = server_links.load_server_links()
        mods_config_from_settings = load_mods_config()
        
        # Списки для аргументов
        mod_list = []           # для -mod= (server_mod)
        servermod_list = []     # для -servermod= (server)
        
        print("\n" + "="*80)
        print("📋 ФОРМИРОВАНИЕ -mod= и -servermod=")
        print("="*80)
        
        # Проходим по всем подключённым модам
        for mod_id, link_info in server_links_data.items():
            if not link_info.get('enabled', True):
                continue
            
            # Получаем человеческое имя ссылки
            link_name = link_info.get('link_name', '')
            
            # Если link_name нет, генерируем из mod_folder
            if not link_name:
                mod_folder = link_info.get('mod_folder', '')
                mod_name = link_info.get('mod_name', mod_folder)
                # Генерируем человеческое имя
                link_name = server_links.get_mod_link_name(mod_folder, mod_name)
                # Сохраняем обратно
                link_info['link_name'] = link_name
                server_links.save_server_links(server_links_data)
            
            # Очищаем имя от пробелов и недопустимых символов
            clean_link_name = server_links.clean_mod_name_for_path(link_name)
            
            # Проверяем тип мода в конфиге
            is_server = False
            is_server_mod = False
            
            if mod_id in mods_config_from_settings:
                is_server = mods_config_from_settings[mod_id].get('server', False)
                is_server_mod = mods_config_from_settings[mod_id].get('server_mod', False)
            
            # Если мод отмечен как server — добавляем в -servermod=
            if is_server:
                servermod_list.append(clean_link_name)
                print(f"  🟡 {mod_id}: добавлен в -servermod= как {clean_link_name}")
            
            # Если мод отмечен как server_mod — добавляем в -mod=
            if is_server_mod:
                mod_list.append(clean_link_name)
                print(f"  🔵 {mod_id}: добавлен в -mod= как {clean_link_name}")
        
        # Формируем строки команд
        if mod_list:
            mod_string = ';'.join(mod_list)
            command.insert(1, f"-mod={mod_string}")
            print(f"\n📋 -mod: {mod_string}")
        else:
            print("\n⚠️ НЕТ модов для -mod=")
        
        if servermod_list:
            servermod_string = ';'.join(servermod_list)
            if mod_list:
                command.insert(2, f"-servermod={servermod_string}")
            else:
                command.insert(1, f"-servermod={servermod_string}")
            print(f"📋 -servermod: {servermod_string}")
        else:
            print("\n⚠️ НЕТ модов для -servermod=")
        
        print("="*80 + "\n")
        
        # ============ ВЫВОДИМ КОМАНДУ ============
        print("\n" + "="*80)
        print("🚀 ФИНАЛЬНАЯ КОМАНДА ЗАПУСКА:")
        print("="*80)
        print(' '.join(command))
        print("="*80 + "\n")
        
        try:
            creationflags = 0
            if sys.platform == 'win32':
                creationflags = subprocess.CREATE_NEW_CONSOLE
            
            self.process = subprocess.Popen(
                command,
                cwd=self.server_path,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                universal_newlines=True,
                encoding='utf-8',
                errors='replace',
                creationflags=creationflags
            )
            
            if self.process.pid:
                save_pid('server', self.process.pid)
                self._pid = self.process.pid
                self._using_pid = False
            
            self.should_read = True
            self.reader_thread = threading.Thread(target=self._read_output, daemon=True)
            self.reader_thread.start()
            
            time.sleep(2)
            
            if self.is_running():
                return True, f"Сервер запущен (PID: {self.process.pid})"
            else:
                clear_pid('server')
                return False, "Сервер не запустился, проверьте логи"
                
        except Exception as e:
            self.process = None
            clear_pid('server')
            return False, f"Ошибка запуска: {str(e)}"

    def stop(self):
        """Останавливает сервер и все дочерние процессы."""
        if not self.is_running():
            return False, "Сервер не запущен."
        
        self.should_read = False
        
        try:
            if self._using_pid and self._pid:
                try:
                    p = psutil.Process(self._pid)
                    children = p.children(recursive=True)
                    for child in children:
                        try:
                            child.terminate()
                        except:
                            pass
                    p.terminate()
                    gone, alive = psutil.wait_procs(children + [p], timeout=5)
                    for proc in alive:
                        try:
                            proc.kill()
                        except:
                            pass
                except psutil.NoSuchProcess:
                    pass
            else:
                try:
                    parent = psutil.Process(self.process.pid)
                    children = parent.children(recursive=True)
                    for child in children:
                        try:
                            child.terminate()
                        except:
                            pass
                    gone, alive = psutil.wait_procs(children + [parent], timeout=5)
                    for proc in alive:
                        try:
                            proc.kill()
                        except:
                            pass
                except psutil.NoSuchProcess:
                    pass
            
            clear_pid('server')
            self._pid = None
            self._using_pid = False
            self.process = None
            
            return True, "Сервер остановлен."
        except Exception as e:
            return False, f"Ошибка остановки: {str(e)}"

    def status(self):
        """Возвращает статус сервера."""
        if self.is_running():
            try:
                pid = self._pid if self._using_pid else self.process.pid
                p = psutil.Process(pid)
                mem_mb = p.memory_info().rss / 1024 / 1024
                cpu = p.cpu_percent(interval=0.1)
                return {
                    "running": True,
                    "pid": pid,
                    "memory_mb": f"{mem_mb:.1f}",
                    "cpu_percent": f"{cpu:.1f}"
                }
            except:
                return {"running": True, "pid": pid}
        return {"running": False}

    def _read_output(self):
        """Читает вывод сервера в отдельном потоке и кладет строки в очередь."""
        while self.should_read and self.process and self.process.stdout:
            try:
                line = self.process.stdout.readline()
                if not line:
                    break
                self.log_queue.put(line.strip())
            except:
                break
        self.log_queue.put(None)

    def get_logs(self):
        """Извлекает все накопленные логи из очереди."""
        logs = []
        while True:
            try:
                line = self.log_queue.get_nowait()
                if line is None:
                    logs.append("--- Сервер остановлен ---")
                    break
                logs.append(line)
            except queue.Empty:
                break
        return logs

    def get_rpt_logs(self):
        """Извлекает все накопленные RPT логи из очереди."""
        logs = []
        while True:
            try:
                item = self.rpt_log_queue.get_nowait()
                logs.append(item)
            except queue.Empty:
                break
        return logs
    
    def is_rpt_active(self):
        """Проверяет, активен ли RPT монитор."""
        return (self.rpt_monitor is not None and 
                self.rpt_monitor.is_running() and 
                self.should_monitor_rpt)