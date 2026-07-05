# server_manager.py
import psutil
import subprocess
import os
import threading
import time
import queue
import sys

class DayZServer:
    def __init__(self, server_path, executable="DayZServer_x64.exe", config="serverDZ.cfg"):
        self.server_path = server_path
        self.executable = executable
        self.config = config
        self.process = None
        self.log_queue = queue.Queue()
        self.reader_thread = None
        self.should_read = False

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
        if mods_config:
            mod_list = []
            
            print("\n" + "="*80)
            print("📋 ФОРМИРОВАНИЕ -mod=")
            print("="*80)
            
            for mod_name, types in mods_config.items():
                if not types.get("connected", False):
                    print(f"  ⚠️ {mod_name}: НЕ добавлен")
                    continue
                
                # 🔥 БЕРЁМ ИМЯ ПАПКИ ИЗ server_links.json
                from server_links import load_server_links
                server_links = load_server_links()
                
                # Получаем mod_folder из server_links
                link_info = server_links.get(mod_name, {})
                mod_folder = link_info.get('mod_folder', '')
                
                if mod_folder:
                    # Добавляем @ перед именем папки
                    mod_list.append('@' + mod_folder)
                    print(f"  ✅ {mod_name}: добавлен как @{mod_folder}")
                else:
                    print(f"  ⚠️ {mod_name}: НЕ найден mod_folder в server_links")
            
            if mod_list:
                mod_string = ';'.join(mod_list)
                command.insert(1, f"-mod={mod_string}")
                print(f"\n📋 Итоговый -mod: {mod_string}")
            else:
                print("\n⚠️ НЕТ МОДОВ для добавления")
            
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
            self.should_read = True
            self.reader_thread = threading.Thread(target=self._read_output, daemon=True)
            self.reader_thread.start()
            
            time.sleep(2)
            
            if self.is_running():
                return True, f"Сервер запущен (PID: {self.process.pid})"
            else:
                return False, "Сервер не запустился, проверьте логи"
                
        except Exception as e:
            self.process = None
            return False, f"Ошибка запуска: {str(e)}"

    def stop(self):
        """Останавливает сервер и все дочерние процессы."""
        if not self.is_running():
            return False, "Сервер не запущен."
        
        self.should_read = False
        
        try:
            parent = psutil.Process(self.process.pid)
            children = parent.children(recursive=True)
            for child in children:
                child.terminate()
            
            gone, alive = psutil.wait_procs(children + [parent], timeout=5)
            for p in alive:
                p.kill()
                
            self.process = None
            return True, "Сервер остановлен."
        except Exception as e:
            return False, f"Ошибка остановки: {str(e)}"

    def is_running(self):
        """Проверяет, жив ли процесс сервера."""
        if self.process is None:
            return False
        return self.process.poll() is None

    def status(self):
        """Возвращает статус сервера."""
        if self.is_running():
            try:
                p = psutil.Process(self.process.pid)
                mem_mb = p.memory_info().rss / 1024 / 1024
                cpu = p.cpu_percent(interval=0.1)
                return {
                    "running": True,
                    "pid": self.process.pid,
                    "memory_mb": f"{mem_mb:.1f}",
                    "cpu_percent": f"{cpu:.1f}"
                }
            except:
                return {"running": True, "pid": self.process.pid}
        return {"running": False}

    def _read_output(self):
        """Читает вывод сервера в отдельном потоке и кладет строки в очередь."""
        while self.should_read and self.process and self.process.stdout:
            line = self.process.stdout.readline()
            if not line:
                break
            self.log_queue.put(line.strip())
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