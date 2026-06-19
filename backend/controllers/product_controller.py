from flask import jsonify, request
from services.product_service import ProductService

class ProductController:
    def __init__(self):
        self.product_service = ProductService()

    def get_products(self):
        main_cat = request.args.get('main_category')
        sub_cat = request.args.get('sub_category')
        filter_followed = request.args.get('filter_followed', 'true') == 'true'
        user_id = request.args.get('user_id')
        
        result = self.product_service.get_formatted_products(main_cat, sub_cat, filter_followed, user_id)
        return jsonify(result)

    def create_product(self):
        data = request.json
        p_id, error = self.product_service.create_product(data)
        if error:
            return jsonify({'error': error}), 400
            
        return jsonify({'message': 'Product created successfully', 'id': p_id}), 201

    def get_product(self, product_id):
        product = self.product_service.get_product_details(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        return jsonify(product)

    def delete_product(self, product_id):
        success, error = self.product_service.update_status(product_id, "DELETED")
        if not success:
            return jsonify({'error': error}), 404
        return jsonify({'message': 'Product soft deleted successfully'})

    def update_product_status(self, product_id):
        data = request.json
        new_status = data.get('status')
        success, error = self.product_service.update_status(product_id, new_status)
        if not success:
            return jsonify({'error': error}), 400
        return jsonify({'message': 'Product status updated'})

    def view_product(self, product_id):
        self.product_service.increment_view(product_id)
        return jsonify({'message': 'ok'})
