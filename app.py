from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def landing():
    """Главная страница (заставка)"""
    return render_template('landing.html')

@app.route('/manager')
def index():
    return render_template('index.html')

@app.route('/static/webfonts/<path:filename>')
def serve_webfonts(filename):
    return send_from_directory('static/webfonts', filename)

@app.route('/static/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/images', filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)