from flask import Blueprint
from controllers.product_controller import ProductController

product_bp = Blueprint('product_routes', __name__)
controller = ProductController()

# 將原本定義在 api.py 的路由對應到 controller
product_bp.route('', methods=['GET'], strict_slashes=False)(controller.get_products)
product_bp.route('', methods=['POST'], strict_slashes=False)(controller.create_product)
product_bp.route('/<product_id>', methods=['GET'])(controller.get_product)
product_bp.route('/<product_id>', methods=['DELETE'])(controller.delete_product)
product_bp.route('/<product_id>/status', methods=['POST'])(controller.update_product_status)
product_bp.route('/<product_id>/view', methods=['POST'])(controller.view_product)
