from repositories.product_repository import ProductRepository
from repositories.user_repository import UserRepository

class SearchService:
    def __init__(self):
        self.product_repo = ProductRepository()
        self.user_repo = UserRepository()

    def global_search(self, keyword):
        if not keyword:
            return {"products": [], "users": []}
            
        products = self.product_repo.search_products(keyword)
        users = self.user_repo.search_users(keyword)
        
        return {
            "products": products,
            "users": users
        }
