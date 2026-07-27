# app.py - ДОЛЖНО БЫТЬ (ПРАВИЛЬНО)
from flask import Flask
from routes import init_routes

app = Flask(__name__)

# Регистрируем все роуты из routes.py
init_routes(app)

if __name__ == "__main__":
    app.run(debug=True)