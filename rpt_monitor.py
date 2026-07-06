# rpt_monitor.py
import os
import time
import glob
import threading
import queue
from datetime import datetime

class RPTMonitor:
    def __init__(self, profiles_dir):
        self.profiles_dir = profiles_dir
        self.log_queue = queue.Queue()
        self.running = False
        self.thread = None
        self.current_rpt = None
        self.last_position = 0
        self.server_ready = False
        
    def get_latest_rpt(self):
        """Находит самый новый RPT-файл."""
        if not os.path.exists(self.profiles_dir):
            return None
        rpt_pattern = os.path.join(self.profiles_dir, "*.RPT")
        files = glob.glob(rpt_pattern)
        return max(files, key=os.path.getmtime) if files else None
    
    def _parse_log_line(self, line):
        """
        Анализирует строку лога.
        Возвращает словарь с полями: type, message, raw, timestamp
        Если строка не подходит ни под один фильтр - возвращает None
        """
        stripped = line.strip()
        
        # Если строка пустая - пропускаем
        if not stripped:
            return None
        
        msg_type = None
        message = None
        raw_time = stripped[:8] if len(stripped) > 8 else ""
        
        # ============================================
        # ТОЛЬКО ОСНОВНЫЕ СОБЫТИЯ (как в consoleLog.txt)
        # ============================================
        
        # 1. Создан выделенный сервер
        if "Создан выделенный сервер" in stripped:
            msg_type = 'start'
            message = f"🚀 Создан выделенный сервер"
            
        # 2. SUCCESS: SteamGameServer_Init
        elif "SUCCESS: SteamGameServer_Init" in stripped:
            msg_type = 'steam'
            message = f"🔵 Steam авторизация успешна"
            
        # 3. Роли назначены
        elif "Роли назначены" in stripped:
            msg_type = 'info'
            message = f"📋 Роли назначены"
            
        # 4. Чтение задания
        elif "Чтение задания" in stripped:
            msg_type = 'mission'
            message = f"📁 Чтение задания..."
            
        # 5. [CE][Hive] :: Loading core data
        elif "[CE][Hive] :: Loading core data" in stripped:
            msg_type = 'economy'
            message = f"⚙️ Загрузка основных данных экономики..."
            
        # 6. [CE][Hive] :: Loading map data
        elif "[CE][Hive] :: Loading map data" in stripped:
            msg_type = 'economy'
            message = f"🗺️ Загрузка карты..."
            
        # 7. [CE][Hive] :: Storage load took
        elif "[CE][Hive] :: Storage load took" in stripped:
            msg_type = 'economy'
            # Извлекаем время загрузки
            import re
            match = re.search(r'took:([\d.]+)\s+seconds', stripped)
            if match:
                load_time = match.group(1)
                message = f"💾 Загрузка хранилища: {load_time} сек"
            else:
                message = f"💾 Загрузка хранилища завершена"
            
        # 8. [CE][Hive] :: Initializing
        elif "[CE][Hive] :: Initializing" in stripped:
            msg_type = 'economy'
            message = f"⚙️ Инициализация экономики..."
            
        # 9. [CE][Hive] :: Initializing spawners
        elif "[CE][Hive] :: Initializing spawners" in stripped:
            msg_type = 'economy'
            message = f"🔄 Инициализация спавнеров..."
            
        # 10. Initializing of spawners done
        elif "Initializing of spawners done" in stripped:
            msg_type = 'economy'
            message = f"✅ Инициализация спавнеров завершена"
            
        # 11. Player connect enabled
        elif "Player connect enabled" in stripped:
            msg_type = 'network'
            message = f"🌐 Порты открыты, ожидание игроков"
            
        # 12. [IdleMode] Entering IN - save processed
        elif "[IdleMode] Entering IN - save processed" in stripped:
            msg_type = 'save'
            log_time = raw_time if raw_time else "Время неизвестно"
            message = f"\n💾 [ СОХРАНЕНИЕ МИРА ] {log_time} ---> МИР УСПЕШНО ЗАПИСАН НА ДИСК! Server IDLE."
            self.server_ready = True
            
        # 13. [CE][Hive] :: Init sequence finished
        elif "[CE][Hive] :: Init sequence finished" in stripped:
            msg_type = 'economy'
            message = f"✅ Последовательность инициализации завершена"
            
        # 14. Hostname of server
        elif "Hostname of server" in stripped:
            msg_type = 'info'
            # Извлекаем имя сервера
            import re
            match = re.search(r'"([^"]+)"', stripped)
            if match:
                server_name = match.group(1)
                message = f"🏷️ Имя сервера: {server_name}"
            else:
                message = f"🏷️ Имя сервера установлено"
            
        # 15. [CE][LootRespawner] 
        elif "[CE][LootRespawner]" in stripped and "Initially (re)spawned" in stripped:
            msg_type = 'economy'
            # Извлекаем количество
            import re
            match = re.search(r'Initially \(re\)spawned:(\d+)', stripped)
            if match:
                count = match.group(1)
                message = f"📦 Загружено предметов: {count}"
            else:
                message = f"📦 Загрузка предметов завершена"
            
        # Если ни один фильтр не сработал - пропускаем строку
        if msg_type is None:
            return None
        
        return {
            'type': msg_type,
            'message': message,
            'raw': stripped,
            'timestamp': datetime.now().isoformat(),
            'server_ready': self.server_ready
        }
    
    def _monitor_loop(self):
        """Основной цикл мониторинга RPT файла."""
        self.running = True
        self.current_rpt = self.get_latest_rpt()
        
        # Отправляем системное сообщение о запуске
        self.log_queue.put({
            'type': 'system',
            'message': '📟 Система мониторинга DayZ запущена',
            'raw': '',
            'timestamp': datetime.now().isoformat(),
            'server_ready': False
        })
        
        if not self.current_rpt:
            self.log_queue.put({
                'type': 'system',
                'message': '⏳ Ожидание создания лог-файла сервера...',
                'raw': '',
                'timestamp': datetime.now().isoformat(),
                'server_ready': False
            })
            while not self.current_rpt and self.running:
                time.sleep(1)
                self.current_rpt = self.get_latest_rpt()
            if not self.running:
                return
        
        self.log_queue.put({
            'type': 'system',
            'message': f'📄 Подключено к логу: {os.path.basename(self.current_rpt)}',
            'raw': '',
            'timestamp': datetime.now().isoformat(),
            'server_ready': False
        })
        self.log_queue.put({
            'type': 'system',
            'message': '─' * 50,
            'raw': '',
            'timestamp': datetime.now().isoformat(),
            'server_ready': False
        })
        
        # Открываем файл и читаем с конца
        try:
            f = open(self.current_rpt, "r", encoding="utf-8", errors="ignore")
            f.seek(0, os.SEEK_END)
        except Exception as e:
            self.log_queue.put({
                'type': 'error',
                'message': f'❌ Ошибка открытия RPT файла: {str(e)}',
                'raw': '',
                'timestamp': datetime.now().isoformat(),
                'server_ready': False
            })
            self.running = False
            return
        
        while self.running:
            try:
                # Проверка на рестарт сервера (создание нового RPT)
                latest_rpt = self.get_latest_rpt()
                if latest_rpt and latest_rpt != self.current_rpt:
                    self.log_queue.put({
                        'type': 'system',
                        'message': f'\n🔄 Обнаружен перезапуск сервера! Переключаюсь на: {os.path.basename(latest_rpt)}',
                        'raw': '',
                        'timestamp': datetime.now().isoformat(),
                        'server_ready': False
                    })
                    self.log_queue.put({
                        'type': 'system',
                        'message': '─' * 50,
                        'raw': '',
                        'timestamp': datetime.now().isoformat(),
                        'server_ready': False
                    })
                    self.current_rpt = latest_rpt
                    self.server_ready = False
                    f.close()
                    f = open(self.current_rpt, "r", encoding="utf-8", errors="ignore")
                    f.seek(0, os.SEEK_END)
                
                line = f.readline()
                if not line:
                    time.sleep(0.1)
                    continue
                
                parsed = self._parse_log_line(line)
                if parsed:
                    # Если это сообщение о готовности сервера - добавляем разделитель
                    if parsed['type'] == 'save':
                        parsed['message'] = parsed['message'] + "\n" + "═" * 25 + " [ СЕРВЕР ГОТОВ ] " + "═" * 25
                    self.log_queue.put(parsed)
                
            except UnicodeDecodeError:
                continue
            except Exception as e:
                self.log_queue.put({
                    'type': 'error',
                    'message': f'❌ Ошибка чтения лога: {str(e)}',
                    'raw': '',
                    'timestamp': datetime.now().isoformat(),
                    'server_ready': False
                })
                time.sleep(1)
        
        f.close()
        self.running = False
    
    def start(self):
        """Запускает мониторинг в отдельном потоке."""
        if self.thread and self.thread.is_alive():
            return False
        
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        return True
    
    def stop(self):
        """Останавливает мониторинг."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        return True
    
    def get_logs(self):
        """Возвращает все накопленные логи из очереди."""
        logs = []
        while True:
            try:
                item = self.log_queue.get_nowait()
                logs.append(item)
            except queue.Empty:
                break
        return logs
    
    def is_running(self):
        """Проверяет, запущен ли мониторинг."""
        return self.running and self.thread and self.thread.is_alive()
    
    def is_server_ready(self):
        """Возвращает статус готовности сервера."""
        return self.server_ready