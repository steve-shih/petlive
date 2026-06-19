from flask import request, jsonify
from services.search_service import SearchService

class SearchController:
    def __init__(self):
        self.search_service = SearchService()

    def search(self):
        keyword = request.args.get('q', '').strip()
        if not keyword:
            return jsonify({"products": [], "users": []}), 200
            
        results = self.search_service.global_search(keyword)
        return jsonify(results), 200
