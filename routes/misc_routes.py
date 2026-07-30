from flask import Blueprint, jsonify, request
import database as db

misc_bp = Blueprint('misc', __name__)

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