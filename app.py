from flask import Flask
from routes import register_routes
import logging
import sys
from server_manager import DayZServer
from game_manager import DayZGame  # ← НОВЫЙ ИМПОРТ
import os

app = Flask(__name__)

# Глобальные экземпляры
server_instance = None
game_instance = None  # ← НОВЫЙ ЭКЗЕМПЛЯР

def get_server():
    """Возвращает экземпляр сервера, создавая его при необходимости"""
    global server_instance
    if server_instance is None:
        from settings_manager import load_settings
        settings = load_settings()
        server_exe = settings.get('server_exe', '')
        if server_exe and server_exe.strip():
            server_dir = os.path.dirname(server_exe)
            server_instance = DayZServer(server_dir)
        else:
            server_instance = DayZServer('')
    return server_instance

def get_game():  # ← НОВАЯ ФУНКЦИЯ
    """Возвращает экземпляр игры, создавая его при необходимости"""
    global game_instance
    if game_instance is None:
        from settings_manager import load_settings
        settings = load_settings()
        game_exe = settings.get('game_exe', '')
        if game_exe and game_exe.strip():
            game_dir = os.path.dirname(game_exe)
            game_instance = DayZGame(game_dir)
        else:
            game_instance = DayZGame('')
    return game_instance

# Регистрируем все маршруты из routes.py
register_routes(app)

if __name__ == '__main__':
    # Проверяем аргументы командной строки
    if '--gui' in sys.argv:
        # Запуск в GUI режиме
        from flaskwebgui import FlaskUI
        
        flaskwebgui_logger = logging.getLogger('flaskwebgui')
        flaskwebgui_logger.setLevel(logging.ERROR)
        
        # Инициализируем сервер до запуска GUI
        # (RPT монитор запустится автоматически)
        get_server()
        
        FlaskUI(
            app=app,
            server="flask",
            width=1300,
            height=850,
            fullscreen=False
        ).run()
    else:
        # Запуск в браузере (по умолчанию)
        # Инициализируем сервер до запуска
        get_server()
        
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=True
        )