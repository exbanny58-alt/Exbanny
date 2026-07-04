from flask import Flask
from routes import register_routes
import logging
import sys

app = Flask(__name__)

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