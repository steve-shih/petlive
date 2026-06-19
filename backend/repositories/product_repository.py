from infrastructure.database import Database

class ProductRepository:
    def __init__(self):
        self.db = Database.get_db()
        self.collection = self.db.products

    def find_all(self, query):
        """
        根據條件查詢所有產品
        """
        return list(self.collection.find(query, {"_id": 0}))

    def find_by_id(self, product_id):
        """
        根據 ID 查詢單一產品
        """
        return self.collection.find_one({"id": product_id}, {"_id": 0})

    def insert(self, product_data):
        """
        新增產品
        """
        self.collection.insert_one(product_data)
        return product_data

    def update_status(self, product_id, new_status):
        """
        更新產品狀態
        """
        result = self.collection.update_one(
            {"id": product_id}, 
            {"$set": {"status": new_status}}
        )
        return result.modified_count > 0

    def increment_view(self, product_id):
        """
        增加產品瀏覽量
        """
        self.collection.update_one(
            {"id": product_id}, 
            {"$inc": {"views": 1}}
        )

    def search_products(self, keyword):
        """
        模糊搜尋產品名稱或描述
        """
        query = {
            "$or": [
                {"title": {"$regex": keyword, "$options": "i"}},
                {"description": {"$regex": keyword, "$options": "i"}}
            ]
        }
        return list(self.collection.find(query, {"_id": 0}).limit(10))
