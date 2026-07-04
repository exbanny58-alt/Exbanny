from flask import Flask
from routes import register_routes
from flaskwebgui import FlaskUI
import logging
import sys

app = Flask(__name__)

# Регистрируем все маршруты из routes.py
register_routes(app)

if __name__ == '__main__':
    # Отключаем логи FlaskWebGUI
    flaskwebgui_logger = logging.getLogger('flaskwebgui')
    flaskwebgui_logger.setLevel(logging.ERROR)
    
    # Отключаем логи от werkzeug (это логи Flask)
    # Если хотите оставить стандартные логи Flask - закомментируйте эти строки
    # log = logging.getLogger('werkzeug')
    # log.setLevel(logging.ERROR)
    
    FlaskUI(
        app=app,
        server="flask",
        width=1300,
        height=850,
        fullscreen=False
    ).run()