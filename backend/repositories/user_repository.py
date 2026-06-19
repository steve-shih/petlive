from infrastructure.database import Database

class UserRepository:
    def __init__(self):
        self.db = Database.get_db()
        self.collection = self.db.users

    def find_by_id(self, user_id):
        return self.collection.find_one({"id": user_id}, {"_id": 0})

    def search_users(self, keyword):
        """
        模糊搜尋使用者名稱，排除管理員與測試帳號
        """
        query = {
            "name": {"$regex": keyword, "$options": "i"},
            "role": {"$ne": "ADMIN"},
            "is_test": {"$ne": True}
        }
        return list(self.collection.find(query, {"_id": 0}).limit(10))
