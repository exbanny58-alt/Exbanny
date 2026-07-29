from flask import Blueprint, jsonify
import json
import os

config_bp = Blueprint('config', __name__)

CONFIG_FILE = 'config/pages.json'

def load_json_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

@config_bp.route('/api/config')
def get_config():
    return jsonify(load_json_file(CONFIG_FILE))