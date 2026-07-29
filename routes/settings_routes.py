from flask import Blueprint, jsonify, request
import json
import os

settings_bp = Blueprint('settings', __name__)

SETTINGS_FILE = 'config/settings.json'

def load_json_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_json_file(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

@settings_bp.route('/api/settings/load')
def load_settings():
    return jsonify(load_json_file(SETTINGS_FILE))

@settings_bp.route('/api/settings/save', methods=['POST'])
def save_settings():
    data = request.get_json()
    settings = load_json_file(SETTINGS_FILE)
    
    if data:
        settings.update(data)
    
    save_json_file(SETTINGS_FILE, settings)
    return jsonify({'success': True, 'settings': settings})