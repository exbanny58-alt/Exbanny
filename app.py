from flask import Flask, render_template, send_from_directory, request, jsonify
import os
import json

app = Flask(__name__)

# Путь к файлу с настройками
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'editor_settings.json')

def load_editor_settings():
    """Загружает настройки редактора из JSON файла"""
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_editor_settings(settings):
    """Сохраняет настройки редактора в JSON файл"""
    try:
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        print('✅ Настройки сохранены!')
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
# API ДЛЯ РЕДАКТОРА CSS
# ============================================

@app.route('/api/editor/settings', methods=['GET'])
def get_editor_settings():
    """Получить настройки редактора"""
    settings = load_editor_settings()
    return jsonify(settings)

@app.route('/api/editor/settings', methods=['POST'])
def save_editor_settings_api():
    """Сохранить настройки редактора"""
    try:
        data = request.get_json()
        if data:
            if save_editor_settings(data):
                return jsonify({'success': True, 'message': 'Настройки сохранены'})
            return jsonify({'success': False, 'message': 'Ошибка сохранения'}), 500
        return jsonify({'success': False, 'message': 'Нет данных'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/editor/settings/defaults', methods=['POST'])
def reset_editor_settings():
    """Сбросить настройки редактора к дефолтным"""
    defaults = {
        "mainBg": "#10153d",
        "mainOpacity": 50,
        "mainBlur": 10,
        "mainRadius": 20,
        "mainPadding": 0,
        "mainGap": 0,
        "menuActiveBg": "#6a6d9b",
        "menuOpacity": 50,
        "textColor": "#ffffff",
        "contentGap": 0,
        "leftPadding": 30,
        "rightPadding": 25,
        "slideOverlayColor": "#261595",
        "slideOverlayOpacity": 80,
        "gradientColor1": "#4a3f8a",
        "gradientColor2": "#1a1145",
        "gradientDirection": "135",
        "useGradient": False,
        "playerBg": "#bcb8c6",
        "playerOpacity": 20,
        "playerBlur": 10,
        "playerPadding": 20,
        "playerRadius": 16,
        "editorBg": "#10153d",
        "editorOpacity": 95,
        "editorBlur": 0,
        "editorRadius": 20,
        "editorPadding": 30,
        "editorBorder": 1,
        "overlayBg": "#000000",
        "overlayOpacity": 70,
        "overlayBlur": 8,
        "isTransparent": False,
        "isBlur": True
    }
    if save_editor_settings(defaults):
        print('🔄 Настройки сброшены!')
        return jsonify({'success': True, 'defaults': defaults})
    return jsonify({'success': False, 'message': 'Ошибка сброса'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)