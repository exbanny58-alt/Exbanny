from flask import Blueprint, jsonify, request
import database as db

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/api/settings/load', methods=['GET'])
def load_settings():
    """Загрузить настройки"""
    try:
        colors = db.get_colors()
        effect = db.get_setting('effect', 'fade')
        return jsonify({
            'success': True,
            'colors': colors,
            'effect': effect
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@settings_bp.route('/api/settings/save', methods=['POST'])
def save_settings():
    """Сохранить настройки"""
    data = request.get_json()
    
    try:
        if 'colors' in data:
            colors = data['colors']
            db.save_colors(
                colors.get('accent', '#7acc7a'), 
                colors.get('glowIntensity', 50)
            )
        
        if 'effect' in data:
            db.set_setting('effect', data['effect'])
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500