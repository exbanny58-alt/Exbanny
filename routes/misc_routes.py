from flask import Blueprint, jsonify, request
import database as db
import os
import uuid

misc_bp = Blueprint('misc', __name__)
UPLOAD_FOLDER = 'static/uploads/audio'

# ============================================
# БАЗА ДАННЫХ — просмотр
# ============================================

@misc_bp.route('/api/database/tables')
def api_get_tables():
    """Получить список всех таблиц"""
    try:
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row['name'] for row in cursor.fetchall()]
        conn.close()
        return jsonify({'success': True, 'tables': tables})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@misc_bp.route('/api/database/table/<table_name>')
def api_get_table_data(table_name):
    """Получить данные из таблицы"""
    try:
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name}")
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        data = [dict(row) for row in rows]
        conn.close()
        return jsonify({
            'success': True,
            'columns': columns,
            'data': data,
            'count': len(data)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# ЗДЕСЬ МОЖНО ДОБАВЛЯТЬ ДРУГИЕ МЕЛКИЕ РОУТЫ
# ============================================

# Пример: проверка статуса сервера
@misc_bp.route('/api/status')
def api_status():
    """Проверка статуса сервера"""
    try:
        # Проверяем подключение к БД
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        
        return jsonify({
            'success': True,
            'status': 'online',
            'database': 'connected'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'error',
            'error': str(e)
        }), 500

# Пример: получение информации о приложении
@misc_bp.route('/api/info')
def api_info():
    """Информация о приложении"""
    return jsonify({
        'success': True,
        'app': 'DayzM',
        'version': '1.0.0',
        'database': 'SQLite'
    })

@misc_bp.route('/api/database/clear/<table_name>', methods=['POST'])
def api_clear_table(table_name):
    """Очистить таблицу (DELETE FROM)"""
    try:
        # Защита от удаления системных таблиц
        forbidden = ['sqlite_sequence', 'sqlite_stat1', 'sqlite_stat4']
        if table_name in forbidden:
            return jsonify({'success': False, 'error': 'Нельзя очистить системную таблицу'}), 403
        
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {table_name}")
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': f'Таблица {table_name} очищена'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@misc_bp.route('/api/pages/update', methods=['POST'])
def api_update_page():
    """Обновить страницу"""
    data = request.get_json()
    page_id = data.get('id')
    name = data.get('name')
    content = data.get('content')
    
    if not page_id:
        return jsonify({'success': False, 'error': 'ID страницы не указан'}), 400
    
    try:
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE pages 
            SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (name, content, page_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Страница обновлена'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# ПЛЕЙЛИСТ — ЗАГРУЗКА ФАЙЛОВ
# ============================================

@misc_bp.route('/api/playlist/upload', methods=['POST'])
def api_upload_audio():
    """Загрузить аудиофайл на сервер"""
    try:
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Нет файла'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Пустое имя файла'}), 400
        
        # Генерируем уникальное имя
        ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_name)
        
        file.save(file_path)
        
        file_url = f"/static/uploads/audio/{unique_name}"
        
        # Пытаемся прочитать теги через mutagen
        title = file.filename.replace(ext, '')
        artist = 'Неизвестный'
        
        try:
            from mutagen import File as MutagenFile
            audio = MutagenFile(file_path)
            if audio:
                if 'title' in audio:
                    title = str(audio['title'][0])
                if 'artist' in audio:
                    artist = str(audio['artist'][0])
        except:
            pass
        
        return jsonify({
            'success': True,
            'url': file_url,
            'file_name': file.filename,
            'title': title,
            'artist': artist
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@misc_bp.route('/api/playlist/load', methods=['GET'])
def api_load_playlist():
    """Загрузить плейлист из БД"""
    try:
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, title, artist, file_path, file_name, sort_order
            FROM playlist
            ORDER BY sort_order
        ''')
        rows = cursor.fetchall()
        conn.close()
        
        playlist = []
        for row in rows:
            # Проверяем, существует ли файл
            file_exists = os.path.exists(os.path.join('static/uploads/audio', os.path.basename(row['file_path'])))
            playlist.append({
                'id': row['id'],
                'title': row['title'],
                'artist': row['artist'],
                'file_path': row['file_path'],
                'file_name': row['file_name'],
                'exists': file_exists
            })
        
        return jsonify({'success': True, 'playlist': playlist})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@misc_bp.route('/api/playlist/save', methods=['POST'])
def api_save_playlist():
    """Сохранить плейлист в БД"""
    try:
        data = request.get_json()
        playlist = data.get('playlist', [])
        
        conn = db.get_db()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM playlist')
        
        for idx, track in enumerate(playlist):
            cursor.execute('''
                INSERT INTO playlist (title, artist, file_path, file_name, sort_order)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                track.get('title', 'Без названия'),
                track.get('artist', 'Неизвестный'),
                track.get('file_path', ''),
                track.get('file_name', ''),
                idx
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Плейлист сохранён'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@misc_bp.route('/api/playlist/clear', methods=['POST'])
def api_clear_playlist():
    """Очистить плейлист"""
    try:
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM playlist')
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Плейлист очищен'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@misc_bp.route('/api/playlist/delete/<int:track_id>', methods=['DELETE'])
def api_delete_track(track_id):
    """Удалить трек из плейлиста и файл с диска"""
    try:
        conn = db.get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT file_path FROM playlist WHERE id = ?', (track_id,))
        row = cursor.fetchone()
        
        if row and row['file_path']:
            # Удаляем файл с диска
            file_path = row['file_path']
            full_path = os.path.join('.', file_path.lstrip('/'))
            if os.path.exists(full_path):
                os.remove(full_path)
        
        cursor.execute('DELETE FROM playlist WHERE id = ?', (track_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Трек удалён'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500