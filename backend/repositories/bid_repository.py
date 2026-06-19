from infrastructure.database import Database

class BidRepository:
    def __init__(self):
        self.db = Database.get_db()
        self.collection = self.db.bids

    def find_by_product_id(self, product_id):
        return list(self.collection.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1))
