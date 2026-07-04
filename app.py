from flask import Flask, render_template, send_from_directory, request, jsonify
import os
import json
import subprocess
import platform
import tkinter as tk
from tkinter import filedialog
import threading

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

def select_folder_dialog():
    """Открыть диалог выбора папки через tkinter"""
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        
        folder_path = filedialog.askdirectory(
            title="Выберите папку",
            initialdir=os.path.expanduser("~")
        )
        
        root.destroy()
        return folder_path
    except Exception as e:
        print(f'❌ Ошибка tkinter: {e}')
        return None

def select_file_dialog():
    """Открыть диалог выбора файла через tkinter"""
    try:
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        
        file_path = filedialog.askopenfilename(
            title="Выберите файл",
            initialdir=os.path.expanduser("~"),
            filetypes=[
                ("Исполняемые файлы", "*.exe"),
                ("Все файлы", "*.*")
            ]
        )
        
        root.destroy()
        return file_path
    except Exception as e:
        print(f'❌ Ошибка tkinter: {e}')
        return None

# ============================================
# ГЛАВНАЯ СТРАНИЦА
# ============================================
@app.route('/')
def index():
    """Главная страница - сразу менеджер"""
    return render_template('index.html')

# ============================================
# СТАТИЧЕСКИЕ ФАЙЛЫ
# ============================================
@app.route('/static/webfonts/<path:filename>')
def serve_webfonts(filename):
    return send_from_directory('static/webfonts', filename)

@app.route('/static/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/images', filename)

@app.route('/static/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('static/css', filename)

@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

# ============================================
# СТРАНИЦА НАСТРОЕК (внутри контента)
# ============================================
@app.route('/settings-content')
def settings_content():
    """Возвращает HTML с настройками для вставки в контент"""
    return render_template('settings_content.html')

# ============================================
# API ДЛЯ НАСТРОЕК
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
        if data is None:
            return jsonify({'success': False, 'message': 'Нет данных'}), 400
        
        if save_settings(data):
            return jsonify({'success': True, 'message': 'Настройки сохранены'})
        return jsonify({'success': False, 'message': 'Ошибка сохранения'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/settings/reset/<field>', methods=['POST'])
def reset_setting(field):
    """Сбросить конкретную настройку (установить пустую строку)"""
    try:
        settings = load_settings()
        settings[field] = ""
        save_settings(settings)
        return jsonify({'success': True, 'message': f'Поле {field} сброшено'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# API ДЛЯ ОТКРЫТИЯ ПРОВОДНИКА
# ============================================
@app.route('/api/browse/file', methods=['POST'])
def browse_file():
    """Открыть диалог выбора файла через tkinter"""
    try:
        data = request.get_json()
        field = data.get('field')
        input_id = data.get('inputId')
        
        result = [None]
        
        def thread_func():
            result[0] = select_file_dialog()
        
        thread = threading.Thread(target=thread_func)
        thread.start()
        thread.join(timeout=60)
        
        file_path = result[0]
        
        if file_path and file_path.strip():
            return jsonify({
                'success': True,
                'path': file_path,
                'field': field,
                'inputId': input_id,
                'message': 'Файл выбран'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Файл не выбран'
            })
    
    except Exception as e:
        print(f'❌ Ошибка: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/browse/folder', methods=['POST'])
def browse_folder():
    """Открыть диалог выбора папки через tkinter"""
    try:
        data = request.get_json()
        field = data.get('field')
        input_id = data.get('inputId')
        
        result = [None]
        
        def thread_func():
            result[0] = select_folder_dialog()
        
        thread = threading.Thread(target=thread_func)
        thread.start()
        thread.join(timeout=60)
        
        folder_path = result[0]
        
        if folder_path and folder_path.strip():
            return jsonify({
                'success': True,
                'path': folder_path,
                'field': field,
                'inputId': input_id,
                'message': 'Папка выбрана'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Папка не выбрана'
            })
    
    except Exception as e:
        print(f'❌ Ошибка: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# ============================================
# API ДЛЯ ОТКРЫТИЯ ПАПКИ В ПРОВОДНИКЕ
# ============================================
@app.route('/api/open/explorer', methods=['POST'])
def open_explorer():
    """Открыть папку в проводнике"""
    try:
        data = request.get_json()
        path = data.get('path', '').strip()
        
        if not path:
            return jsonify({
                'success': False,
                'message': 'Путь не указан'
            })
        
        if not os.path.exists(path):
            return jsonify({
                'success': False,
                'message': f'Путь не существует: {path}'
            })
        
        # Определяем ОС и открываем проводник
        system = platform.system()
        
        if system == 'Windows':
            os.startfile(path)
        elif system == 'Darwin':  # macOS
            subprocess.Popen(['open', path])
        else:  # Linux
            subprocess.Popen(['xdg-open', path])
        
        return jsonify({
            'success': True,
            'message': f'Открыто: {path}'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

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