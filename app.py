from flask import Flask, render_template
from routes.config_routes import config_bp
from routes.settings_routes import settings_bp
import json
import os

app = Flask(__name__)

# Регистрируем蓝图
app.register_blueprint(config_bp)
app.register_blueprint(settings_bp)

# Загружаем конфиги при старте сервера
def load_json_file(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

# Загружаем конфиги в глобальную переменную
CONFIG = load_json_file('config/pages.json')
SETTINGS = load_json_file('config/settings.json')

# Извлекаем цвета и эффекты
COLORS = SETTINGS.get('colors', {})
EFFECT = SETTINGS.get('effect', 'fadeBlurIn')

# Формируем CSS переменные для вставки в HTML
def get_css_variables():
    accent = COLORS.get('accent', '#7acc7a')
    glow_intensity = COLORS.get('glowIntensity', 50)
    intensity_float = glow_intensity / 100
    glow_size = glow_intensity * 1.5
    
    # Вычисляем alpha для glow
    min_alpha = 5
    max_alpha = 51
    alpha = round(min_alpha + (max_alpha - min_alpha) * intensity_float)
    alpha_hex = hex(alpha)[2:].zfill(2)
    
    # Исправлено: преобразуем в строку
    glow_size_str = str(max(glow_size, 2))
    
    return {
        '--accent': accent,
        '--accent-dim': accent + 'cc',
        '--accent-bg': accent + '0f',
        '--accent-glow': accent + alpha_hex,
        '--accent-glow-strong': accent + alpha_hex,
        '--accent-glow-size': glow_size_str + 'px',
        '--loader-color': accent
    }

CSS_VARS = get_css_variables()

@app.route('/')
def index():
    return render_template(
        'index.html',
        colors=COLORS,
        effect=EFFECT,
        css_vars=CSS_VARS,
        config=CONFIG,
        settings=SETTINGS
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)