# routes.py
from flask import render_template, jsonify, request
from file_manager import file_manager
from file_dialogs import select_folder_dialog, select_file_dialog

def init_routes(app):
    """Инициализирует все роуты приложения"""
    
    # ============================================
    # СТРАНИЦЫ
    # ============================================
    
    @app.route("/")
    def index():
        return render_template("index.html")
    
    # ============================================
    # API: НАСТРОЙКИ
    # ============================================
    
    @app.route("/api/settings", methods=['GET', 'POST'])
    def handle_settings():
        if request.method == 'GET':
            return jsonify(file_manager.get_all_settings())
        
        if request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            success = True
            for key, value in data.items():
                if not file_manager.set_setting(key, value):
                    success = False
            
            if success:
                return jsonify({'success': True, 'settings': file_manager.get_all_settings()})
            return jsonify({'success': False, 'error': 'Failed to save some settings'}), 500
    
    @app.route("/api/settings/<key>", methods=['GET', 'PUT', 'DELETE'])
    def handle_setting(key):
        if request.method == 'GET':
            value = file_manager.get_setting(key)
            if value is not None:
                return jsonify({'key': key, 'value': value})
            return jsonify({'error': 'Setting not found'}), 404
        
        if request.method == 'PUT':
            data = request.get_json()
            if not data or 'value' not in data:
                return jsonify({'error': 'Value required'}), 400
            
            if file_manager.set_setting(key, data['value']):
                return jsonify({'success': True, 'key': key, 'value': data['value']})
            return jsonify({'success': False, 'error': 'Failed to save'}), 500
        
        if request.method == 'DELETE':
            if file_manager.reset_setting(key):
                return jsonify({'success': True, 'key': key})
            return jsonify({'success': False, 'error': 'Failed to reset'}), 500
    
    @app.route("/api/settings/reset/all", methods=['POST'])
    def reset_all_settings():
        if file_manager.reset_all_settings():
            return jsonify({'success': True, 'settings': file_manager.get_all_settings()})
        return jsonify({'success': False, 'error': 'Failed to reset'}), 500
    
    # ============================================
    # API: ДИАЛОГИ ВЫБОРА (ОТКРЫТИЕ ПРОВОДНИКА)
    # ============================================
    
    @app.route("/api/browse/file", methods=['POST'])
    def browse_file():
        """Открывает диалог выбора файла"""
        data = request.get_json()
        if not data or 'field' not in data:
            return jsonify({'success': False, 'error': 'Field required'}), 400
        
        selected_path = select_file_dialog()
        
        if selected_path:
            return jsonify({
                'success': True,
                'path': selected_path,
                'field': data['field']
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Путь не выбран'
            })
    
    @app.route("/api/browse/folder", methods=['POST'])
    def browse_folder():
        """Открывает диалог выбора папки"""
        data = request.get_json()
        if not data or 'field' not in data:
            return jsonify({'success': False, 'error': 'Field required'}), 400
        
        selected_path = select_folder_dialog()
        
        if selected_path:
            return jsonify({
                'success': True,
                'path': selected_path,
                'field': data['field']
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Путь не выбран'
            })
    
    @app.route("/api/open/explorer", methods=['POST'])
    def open_explorer():
        """Открывает путь в проводнике"""
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'success': False, 'error': 'Path required'}), 400
        
        path = data['path']
        if not file_manager.path_exists(path):
            return jsonify({
                'success': False,
                'message': f'Путь не существует: {path}'
            }), 404
        
        if file_manager.open_in_explorer(path):
            return jsonify({
                'success': True,
                'message': f'Открыто: {path}'
            })
        return jsonify({
            'success': False,
            'message': 'Ошибка открытия проводника'
        }), 500
    
    # ============================================
    # API: ПРОВЕРКА СУЩЕСТВОВАНИЯ ПУТИ
    # ============================================
    
    @app.route("/api/path/exists", methods=['POST'])
    def check_path_exists():
        """Проверяет существование пути"""
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Path required'}), 400
        
        path = data['path']
        exists = file_manager.path_exists(path)
        is_file = file_manager.is_file(path) if exists else False
        is_dir = file_manager.is_dir(path) if exists else False
        
        return jsonify({
            'path': path,
            'exists': exists,
            'is_file': is_file,
            'is_dir': is_dir
        })
    
    # ============================================
    # API: СЕРВЕР
    # ============================================
    
    @app.route("/api/server/start", methods=['POST'])
    def server_start():
        return jsonify({'success': True, 'message': 'Сервер запускается...'})
    
    @app.route("/api/server/stop", methods=['POST'])
    def server_stop():
        return jsonify({'success': True, 'message': 'Сервер останавливается...'})
    
    @app.route("/api/server/restart", methods=['POST'])
    def server_restart():
        return jsonify({'success': True, 'message': 'Сервер перезапускается...'})
    
    @app.route("/api/server/status", methods=['GET'])
    def server_status():
        return jsonify({
            'status': 'running',
            'uptime': '2h 15m',
            'players': 12,
            'max_players': 60
        })
    
    # ============================================
    # API: ИГРА
    # ============================================
    
    @app.route("/api/game/start", methods=['POST'])
    def game_start():
        return jsonify({'success': True, 'message': 'Игра запускается...'})
    
    @app.route("/api/game/stop", methods=['POST'])
    def game_stop():
        return jsonify({'success': True, 'message': 'Игра останавливается...'})
    
    @app.route("/api/game/status", methods=['GET'])
    def game_status():
        return jsonify({
            'status': 'running',
            'process_id': 12345
        })
    
    # ============================================
    # API: МОДЫ
    # ============================================
    
    @app.route('/api/mods/debug/paths', methods=['GET'])
    def debug_paths():
        """Отладочный эндпоинт для проверки путей"""
        try:
            from settings_manager import load_settings
            import os
            settings = load_settings()
            
            workshop = settings.get('workshop', '')
            custom_mods = settings.get('custom_mods', '')
            
            return jsonify({
                'workshop': {
                    'path': workshop,
                    'exists': os.path.exists(workshop) if workshop else False
                },
                'custom_mods': {
                    'path': custom_mods,
                    'exists': os.path.exists(custom_mods) if custom_mods else False
                },
                'all_settings': settings
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/mods/cache', methods=['GET'])
    def get_mods_from_cache():
        try:
            from mods_scanner import get_mods_cache
            from settings_manager import load_mods_config
            
            cache = get_mods_cache()
            if cache and cache.get('mods'):
                config = load_mods_config()
                
                mods = cache.get('mods')
                for mod in mods:
                    if mod['id'] in config:
                        mod['server'] = config[mod['id']].get('server', False)
                        mod['server_mod'] = config[mod['id']].get('server_mod', False)
                        mod['client'] = config[mod['id']].get('client', True)
                
                return jsonify({
                    'success': True,
                    'from_cache': True,
                    'timestamp': cache.get('timestamp'),
                    'mods': mods,
                    'stats': {
                        'total': len(mods),
                        'workshop': len([m for m in mods if m.get('type') == 'workshop']),
                        'custom': len([m for m in mods if m.get('type') == 'custom']),
                        'enabled': len([m for m in mods if m.get('enabled', True)])
                    }
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Кеш не найден'
                }), 404
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/mods/scan', methods=['GET'])
    def scan_mods_api():
        try:
            from settings_manager import load_settings, load_mods_config
            from mods_scanner import scan_mods
            
            settings = load_settings()
            workshop = settings.get('workshop', '')
            custom_mods = settings.get('custom_mods', '')
            
            if not workshop and not custom_mods:
                return jsonify({
                    'success': False,
                    'message': 'Не указаны папки с модами в настройках'
                }), 400
            
            mods = scan_mods(workshop, custom_mods)
            
            config = load_mods_config()
            for mod in mods:
                if mod['id'] in config:
                    mod['server'] = config[mod['id']].get('server', False)
                    mod['server_mod'] = config[mod['id']].get('server_mod', False)
                    mod['client'] = config[mod['id']].get('client', True)
            
            return jsonify({
                'success': True,
                'mods': mods,
                'stats': {
                    'total': len(mods),
                    'workshop': len([m for m in mods if m['type'] == 'workshop']),
                    'custom': len([m for m in mods if m['type'] == 'custom']),
                    'enabled': len([m for m in mods if m.get('enabled', True)])
                }
            })
        
        except Exception as e:
            print(f'❌ Ошибка сканирования модов: {e}')
            return jsonify({
                'success': False,
                'message': str(e)
            }), 500

    @app.route('/api/mods/scan-and-cache', methods=['POST'])
    def scan_and_cache_mods():
        try:
            from settings_manager import load_settings, init_mods_config
            from mods_scanner import scan_mods, save_mods_cache
            
            settings = load_settings()
            workshop = settings.get('workshop', '')
            custom_mods = settings.get('custom_mods', '')
            
            if not workshop and not custom_mods:
                return jsonify({
                    'success': False,
                    'message': 'Не указаны папки с модами в настройках'
                }), 400
            
            mods = scan_mods(workshop, custom_mods)
            
            config = init_mods_config(mods)
            
            for mod in mods:
                if mod['id'] in config:
                    mod['server'] = config[mod['id']].get('server', False)
                    mod['server_mod'] = config[mod['id']].get('server_mod', False)
                    mod['client'] = config[mod['id']].get('client', True)
            
            save_mods_cache(mods)
            
            return jsonify({
                'success': True,
                'message': f'Кеш обновлён, найдено {len(mods)} модов',
                'mods': mods,
                'stats': {
                    'total': len(mods),
                    'workshop': len([m for m in mods if m.get('type') == 'workshop']),
                    'custom': len([m for m in mods if m.get('type') == 'custom']),
                    'enabled': len([m for m in mods if m.get('enabled', True)])
                }
            })
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/mods/config', methods=['GET'])
    def get_mods_config():
        try:
            from settings_manager import load_mods_config
            config = load_mods_config()
            return jsonify({
                'success': True,
                'config': config
            })
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/mods/config/<mod_id>', methods=['GET'])
    def get_mod_config(mod_id):
        try:
            from settings_manager import get_mod_full_state
            state = get_mod_full_state(mod_id)
            return jsonify({
                'success': True,
                'mod_id': mod_id,
                'state': state
            })
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/mods/config/<mod_id>/<attr>', methods=['POST'])
    def set_mod_config(mod_id, attr):
        try:
            from settings_manager import set_mod_state
            data = request.get_json()
            value = data.get('value', False)
            
            if attr not in ['server', 'server_mod', 'client']:
                return jsonify({'success': False, 'message': 'Неверный атрибут'}), 400
            
            result = set_mod_state(mod_id, attr, value)
            
            if result:
                return jsonify({
                    'success': True,
                    'mod_id': mod_id,
                    'attr': attr,
                    'value': value,
                    'message': f'{attr} = {value}'
                })
            else:
                return jsonify({'success': False, 'message': 'Ошибка сохранения'}), 500
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/mods/config/init', methods=['POST'])
    def init_mods_config_api():
        try:
            from settings_manager import load_settings, init_mods_config
            from mods_scanner import scan_mods
            
            settings = load_settings()
            workshop = settings.get('workshop', '')
            custom_mods = settings.get('custom_mods', '')
            
            mods = scan_mods(workshop, custom_mods)
            
            config = init_mods_config(mods)
            
            return jsonify({
                'success': True,
                'message': f'Инициализировано {len(config)} модов',
                'config': config
            })
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/mods/toggle', methods=['POST'])
    def toggle_mod():
        try:
            from settings_manager import set_mod_state
            data = request.get_json()
            mod_id = data.get('mod_id')
            enabled = data.get('enabled')
            
            if not mod_id:
                return jsonify({'success': False, 'message': 'Не указан ID мода'}), 400
            
            set_mod_state(mod_id, 'server_mod', enabled)
            
            return jsonify({
                'success': True,
                'message': f'Мод {"включён" if enabled else "выключен"}'
            })
        
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    @app.route('/api/mods/state', methods=['GET'])
    def get_mods_state():
        try:
            from settings_manager import load_mods_config
            config = load_mods_config()
            state = {}
            for mod_id, attrs in config.items():
                state[mod_id] = attrs.get('server_mod', False)
            return jsonify({'success': True, 'state': state})
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500

    # ============================================
    # API: РЕДАКТОРЫ
    # ============================================
    
    @app.route("/api/editor/open", methods=['POST'])
    def editor_open():
        data = request.get_json()
        if not data or 'path' not in data:
            return jsonify({'error': 'Path required'}), 400
        
        content = file_manager.read_file(data['path'])
        if content is not None:
            return jsonify({
                'success': True,
                'path': data['path'],
                'content': content
            })
        return jsonify({
            'success': False,
            'error': 'Failed to read file'
        }), 500

    @app.route('/api/mods/debug/meta/<mod_id>', methods=['GET'])
    def debug_meta(mod_id):
        """Отладочный эндпоинт для проверки парсинга meta.cpp конкретного мода"""
        try:
            from settings_manager import load_settings
            from mods_scanner import get_mod_info, parse_meta_cpp
            import os
            
            settings = load_settings()
            workshop = settings.get('workshop', '')
            custom_mods = settings.get('custom_mods', '')
            
            # Ищем мод
            mod_path = None
            
            if workshop and os.path.exists(workshop):
                for item in os.listdir(workshop):
                    if item == mod_id:
                        mod_path = os.path.join(workshop, item)
                        break
            
            if not mod_path and custom_mods and os.path.exists(custom_mods):
                for item in os.listdir(custom_mods):
                    if item == mod_id:
                        mod_path = os.path.join(custom_mods, item)
                        break
            
            if not mod_path:
                return jsonify({'error': 'Мод не найден'}), 404
            
            meta_path = os.path.join(mod_path, 'meta.cpp')
            meta_content = None
            parsed_name = None
            parsed_version = None
            
            if os.path.exists(meta_path):
                with open(meta_path, 'r', encoding='utf-8', errors='ignore') as f:
                    meta_content = f.read()
                parsed_name, parsed_version = parse_meta_cpp(meta_path)
            
            mod_info = get_mod_info(mod_path, 'workshop')
            
            return jsonify({
                'mod_path': mod_path,
                'mod_info': mod_info,
                'meta_exists': os.path.exists(meta_path),
                'meta_content': meta_content[:500] if meta_content else None,  # Первые 500 символов
                'parsed_name': parsed_name,
                'parsed_version': parsed_version
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    @app.route("/api/editor/save", methods=['POST'])
    def editor_save():
        data = request.get_json()
        if not data or 'path' not in data or 'content' not in data:
            return jsonify({'error': 'Path and content required'}), 400
        
        if file_manager.write_file(data['path'], data['content']):
            return jsonify({
                'success': True,
                'path': data['path'],
                'message': 'Файл сохранён'
            })
        return jsonify({
            'success': False,
            'error': 'Failed to save file'
        }), 500
    
    print('✅ Все роуты зарегистрированы')


