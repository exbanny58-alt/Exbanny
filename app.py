from flask import Flask
from routes import register_routes

app = Flask(__name__)

# Регистрируем все маршруты
register_routes(app)

# ============================================
# ЗАПУСК СЕРВЕРА
# ============================================
if __name__ == '__main__':
    print("=" * 50)
    print("🚀 DayZ Менеджер запущен!")
    print("📁 Адрес: http://127.0.0.1:5000")
    print("⚙️  Настройки открываются в основном контенте")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)