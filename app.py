from flask import Flask, render_template
from routes.config_routes import config_bp
from routes.settings_routes import settings_bp

app = Flask(__name__)

# Регистрируем蓝图
app.register_blueprint(config_bp)
app.register_blueprint(settings_bp)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)