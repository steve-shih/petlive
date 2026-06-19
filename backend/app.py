import os
from flask import Flask
from flask_cors import CORS
from models import db, generate_uuid
from routes.api import api_bp
from routes.product_routes import product_bp
from routes.search_routes import search_bp
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='uploads', static_url_path='/uploads')
CORS(app)

app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(product_bp, url_prefix='/api/products')
app.register_blueprint(search_bp, url_prefix='/api/search')



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
