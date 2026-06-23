import os
from flask import Flask
from flask_cors import CORS
from models import db, generate_uuid
from routes.api import api_bp
from routes.product_routes import product_bp
from routes.search_routes import search_bp
from controllers.live_controller import live_bp
from datetime import datetime, timedelta
from flasgger import Swagger

app = Flask(__name__, static_folder='uploads', static_url_path='/uploads')
CORS(app)

# 初始化 Swagger (API 文件)
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec_1',
            "route": '/apispec_1.json',
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}

swagger_template = {
    "info": {
        "title": "寵BAR - PetBar API",
        "description": "這是 PetBar 活體競標與直播平台的 API 文件。所有的 API 都在此定義與測試。",
        "version": "1.0.0"
    }
}

swagger = Swagger(app, config=swagger_config, template=swagger_template)

app.register_blueprint(api_bp, url_prefix='/api')
app.register_blueprint(product_bp, url_prefix='/api/products')
app.register_blueprint(search_bp, url_prefix='/api/search')
app.register_blueprint(live_bp)



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
