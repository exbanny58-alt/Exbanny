from flask import Blueprint, jsonify, request
import database as db

paths_bp = Blueprint('paths', __name__)

@paths_bp.route('/api/paths/load', methods=['GET'])
def load_paths():
    """Загрузить все пути"""
    try:
        paths = db.get_all_paths()
        return jsonify({'success': True, 'paths': paths})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@paths_bp.route('/api/paths/save', methods=['POST'])
def save_paths():
    """Сохранить пути"""
    data = request.get_json()
    paths = data.get('paths', {})
    
    try:
        db.save_paths(paths)
        return jsonify({'success': True, 'message': 'Пути сохранены'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@paths_bp.route('/api/paths/reset', methods=['POST'])
def reset_paths():
    """Сбросить пути к дефолтным"""
    try:
        db.init_default_paths()
        paths = db.get_all_paths()
        return jsonify({'success': True, 'paths': paths})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500