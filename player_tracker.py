# player_tracker.py
import os
import json
import time
import threading
import re
from datetime import datetime
from collections import deque

# Файл для хранения истории игроков
PLAYER_HISTORY_FILE = os.path.join(os.path.dirname(__file__), 'player_history.json')
MAX_HISTORY = 1000  # Максимальное количество записей в истории

class PlayerTracker:
    def __init__(self):
        self.history = []
        self.current_players = {}  # {steam_id: {name, join_time, ...}}
        self.log_queue = None
        self.running = False
        self.thread = None
        self._load_history()
        
    def set_log_queue(self, queue):
        """Устанавливает очередь для отправки сообщений в консоль."""
        self.log_queue = queue
        
    def _load_history(self):
        """Загружает историю игроков из файла."""
        if os.path.exists(PLAYER_HISTORY_FILE):
            try:
                with open(PLAYER_HISTORY_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.history = data.get('history', [])
                    # Оставляем только MAX_HISTORY записей
                    if len(self.history) > MAX_HISTORY:
                        self.history = self.history[-MAX_HISTORY:]
                    print(f'📋 Загружено {len(self.history)} записей истории игроков')
            except Exception as e:
                print(f'⚠️ Ошибка загрузки истории игроков: {e}')
                self.history = []
    
    def _save_history(self):
        """Сохраняет историю игроков в файл."""
        try:
            data = {
                'last_updated': datetime.now().isoformat(),
                'total_entries': len(self.history),
                'history': self.history[-MAX_HISTORY:]  # Оставляем только последние MAX_HISTORY
            }
            with open(PLAYER_HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f'⚠️ Ошибка сохранения истории игроков: {e}')
            return False
    
    def _parse_player_join(self, line):
        """
        Парсит строку лога для определения входа игрока.
        Возвращает dict с данными игрока или None.
        """
        # Ищем строки вида:
        # 22:27:35.424 Подключился игрок Exbanny (id=nUbp2LgOfRhyNdxqjDc7u8BBxIfAOMR16Um2I1lh1Ts=).
        # 22:27:35.424 Player "Exbanny" (steamID=76561200015496920 pos=<14340.9, 13271.0, 3.3>) is connected
        
        # Вариант 1: русское сообщение
        match = re.search(r'Подключился игрок (.+?) \(id=([^)]+)\)', line)
        if match:
            name = match.group(1).strip()
            steam_id = match.group(2).strip()
            return {'name': name, 'steam_id': steam_id, 'type': 'join'}
        
        # Вариант 2: английское сообщение
        match = re.search(r'Player "(.+?)" \(steamID=(\d+)', line)
        if match:
            name = match.group(1).strip()
            steam_id = match.group(2).strip()
            return {'name': name, 'steam_id': steam_id, 'type': 'join'}
        
        # Вариант 3: Login: Adding player
        match = re.search(r'\[Login\]: Adding player (.+?) \((\d+)\)', line)
        if match:
            name = match.group(1).strip()
            steam_id = match.group(2).strip()
            return {'name': name, 'steam_id': steam_id, 'type': 'join'}
        
        return None
    
    def _parse_player_leave(self, line):
        """
        Парсит строку лога для определения выхода игрока.
        Возвращает dict с данными игрока или None.
        """
        # Ищем строки вида:
        # 22:27:49.366 [Disconnect]: Client 436343729 disconnecting
        # 22:27:49.474 [Disconnect]: Player destroy 436343729
        
        # Вариант 1: [Disconnect]: Client
        match = re.search(r'\[Disconnect\]: Client (\d+) disconnecting', line)
        if match:
            steam_id = match.group(1).strip()
            return {'steam_id': steam_id, 'type': 'leave'}
        
        # Вариант 2: [Disconnect]: Player destroy
        match = re.search(r'\[Disconnect\]: Player destroy (\d+)', line)
        if match:
            steam_id = match.group(1).strip()
            return {'steam_id': steam_id, 'type': 'leave'}
        
        return None
    
    def process_line(self, line):
        """
        Обрабатывает строку лога на предмет входа/выхода игрока.
        Возвращает сообщение для консоли или None.
        """
        # Проверяем вход игрока
        join_data = self._parse_player_join(line)
        if join_data:
            name = join_data['name']
            steam_id = join_data['steam_id']
            
            # Проверяем, не заходил ли уже этот игрок (защита от дублей)
            if steam_id in self.current_players:
                return None
            
            # Добавляем в текущих игроков
            self.current_players[steam_id] = {
                'name': name,
                'steam_id': steam_id,
                'join_time': datetime.now().isoformat()
            }
            
            # Добавляем в историю
            entry = {
                'type': 'join',
                'name': name,
                'steam_id': steam_id,
                'timestamp': datetime.now().isoformat(),
                'time': datetime.now().strftime('%H:%M:%S')
            }
            self.history.append(entry)
            self._save_history()
            
            # Формируем сообщение для консоли
            message = f'🟢 ВОШЁЛ: {name} (ID: {steam_id[:8]}...) [{datetime.now().strftime("%H:%M:%S")}]'
            return {'type': 'player_join', 'message': message, 'player': name, 'steam_id': steam_id}
        
        # Проверяем выход игрока
        leave_data = self._parse_player_leave(line)
        if leave_data:
            steam_id = leave_data['steam_id']
            
            # Ищем игрока в текущих
            if steam_id in self.current_players:
                player_data = self.current_players[steam_id]
                name = player_data['name']
                
                # Удаляем из текущих
                del self.current_players[steam_id]
                
                # Добавляем в историю
                entry = {
                    'type': 'leave',
                    'name': name,
                    'steam_id': steam_id,
                    'timestamp': datetime.now().isoformat(),
                    'time': datetime.now().strftime('%H:%M:%S'),
                    'duration': self._get_duration(player_data['join_time'])
                }
                self.history.append(entry)
                self._save_history()
                
                # Формируем сообщение для консоли
                duration = entry['duration']
                message = f'🔴 ВЫШЕЛ: {name} (ID: {steam_id[:8]}...) [Время: {duration}] [{datetime.now().strftime("%H:%M:%S")}]'
                return {'type': 'player_leave', 'message': message, 'player': name, 'steam_id': steam_id}
        
        return None
    
    def _get_duration(self, join_time):
        """Вычисляет продолжительность пребывания игрока."""
        try:
            join_dt = datetime.fromisoformat(join_time)
            now = datetime.now()
            diff = now - join_dt
            seconds = int(diff.total_seconds())
            
            if seconds < 60:
                return f'{seconds}с'
            elif seconds < 3600:
                minutes = seconds // 60
                secs = seconds % 60
                return f'{minutes}м {secs}с'
            else:
                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                return f'{hours}ч {minutes}м'
        except:
            return 'неизвестно'
    
    def get_current_players(self):
        """Возвращает список текущих игроков."""
        return list(self.current_players.values())
    
    def get_history(self, limit=50):
        """Возвращает последние записи истории."""
        return self.history[-limit:]
    
    def get_history_json(self):
        """Возвращает историю в формате JSON."""
        return {
            'current_players': self.current_players,
            'history': self.history[-100:],  # Последние 100 записей
            'total_players': len(self.history),
            'online_count': len(self.current_players)
        }
    
    def get_online_count(self):
        """Возвращает количество игроков онлайн."""
        return len(self.current_players)