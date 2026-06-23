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

# ????Swagger (API ?辣)
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
        "title": "撖湎AR - PetBar API",
        "description": "? PetBar 瘣駁?蝡嗆???剖像?啁? API ?辣???? API ?賢甇文?蝢抵?皜祈岫??,
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
