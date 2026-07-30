from flask import Blueprint, jsonify
import database as db

config_bp = Blueprint('config', __name__)

@config_bp.route('/api/config')
def get_config():
    """Получить конфиг страниц из БД"""
    try:
        pages = db.get_all_pages()
        home = db.get_home_page()
        
        return jsonify({
            'success': True,
            'pages': pages,
            'home_page': home
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500