from flask import Flask, render_template
from routes import config_bp, settings_bp, paths_bp, misc_bp  # ← ДОБАВИЛИ misc_bp
import database as db
import json
import os

app = Flask(__name__)

# Регистрируем все роуты
app.register_blueprint(config_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(paths_bp)
app.register_blueprint(misc_bp)  # ← НОВОЕ

# Инициализируем БД при старте
db.init_db()
db.init_default_paths()
db.init_default_pages()

# Формируем CSS переменные
def get_css_variables():
    colors = db.get_colors()
    accent = colors.get('accent', '#7acc7a')
    glow_intensity = colors.get('glowIntensity', 50)
    intensity_float = glow_intensity / 100
    glow_size = glow_intensity * 1.5
    
    min_alpha = 5
    max_alpha = 51
    alpha = round(min_alpha + (max_alpha - min_alpha) * intensity_float)
    alpha_hex = hex(alpha)[2:].zfill(2)
    
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

@app.route('/')
def index():
    colors = db.get_colors()
    effect = db.get_setting('effect', 'fade')
    pages = db.get_all_pages()
    home_page = db.get_home_page()
    
    return render_template(
        'index.html',
        colors=colors,
        effect=effect,
        css_vars=get_css_variables(),
        pages=pages,
        home_page=home_page
    )

if __name__ == '__main__':
    app.run(debug=True, port=5000)