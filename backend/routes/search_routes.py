from flask import Blueprint
from controllers.search_controller import SearchController

search_bp = Blueprint('search', __name__)
search_controller = SearchController()

@search_bp.route('', methods=['GET'])
def search():
    return search_controller.search()
