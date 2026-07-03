from flask import Flask, render_template, send_from_directory, request, jsonify
import os
import json

app = Flask(__name__)

# Путь к файлу с настройками
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'settings.json')

def load_settings():
    """Загружает настройки из JSON файла"""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_settings(settings):
    """Сохраняет настройки в JSON файл"""
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f'❌ Ошибка сохранения: {e}')
        return False

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/manager')
def index():
    return render_template('index.html')

@app.route('/static/webfonts/<path:filename>')
def serve_webfonts(filename):
    return send_from_directory('static/webfonts', filename)

@app.route('/static/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/images', filename)

# ============================================
# API ДЛЯ НАСТРОЕК (пути к папкам)
# ============================================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Получить настройки"""
    settings = load_settings()
    return jsonify(settings)

@app.route('/api/settings', methods=['POST'])
def save_settings_api():
    """Сохранить настройки"""
    try:
        data = request.get_json()
        if data:
            if save_settings(data):
                return jsonify({'success': True, 'message': 'Настройки сохранены'})
            return jsonify({'success': False, 'message': 'Ошибка сохранения'}), 500
        return jsonify({'success': False, 'message': 'Нет данных'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)