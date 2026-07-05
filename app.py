from flask import Flask
from routes import register_routes
import logging
import sys
from server_manager import DayZServer  # ← НОВЫЙ ИМПОРТ
import os

app = Flask(__name__)

# Глобальный экземпляр сервера (будет инициализирован при первом запуске)
server_instance = None

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
            server_instance = DayZServer('')  # Пустой путь, будет ошибка при запуске
    return server_instance

# Регистрируем все маршруты из routes.py
register_routes(app)

if __name__ == '__main__':
    # Проверяем аргументы командной строки
    if '--gui' in sys.argv:
        # Запуск в GUI режиме
        from flaskwebgui import FlaskUI
        
        flaskwebgui_logger = logging.getLogger('flaskwebgui')
        flaskwebgui_logger.setLevel(logging.ERROR)
        
        FlaskUI(
            app=app,
            server="flask",
            width=1300,
            height=850,
            fullscreen=False
        ).run()
    else:
        # Запуск в браузере (по умолчанию)
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=True
        )