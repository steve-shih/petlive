from infrastructure.database import Database
from datetime import datetime
import uuid

class LiveRepository:
    def __init__(self):
        self.db = Database.get_db()
        self.rooms_collection = self.db.live_rooms
        self.messages_collection = self.db.live_messages

    def generate_uuid(self):
        return str(uuid.uuid4())

    def create_room(self, room_data):
        self.rooms_collection.insert_one(room_data)

    def get_live_rooms(self):
        return list(self.rooms_collection.find({"status": "LIVE"}, {"_id": 0}))

    def find_room_by_id(self, room_id):
        return self.rooms_collection.find_one({"id": room_id}, {"_id": 0})

    def update_room_status(self, room_id, status):
        self.rooms_collection.update_one({'id': room_id}, {'$set': {'status': status}})

    def update_room_thumbnail(self, room_id, thumbnail):
        self.rooms_collection.update_one({'id': room_id}, {'$set': {'thumbnail_url': thumbnail}})

    def update_streamer_peer(self, room_id, peer_id):
        self.rooms_collection.update_one({"id": room_id}, {"$set": {"streamer_peer_id": peer_id}})

    def update_room_settings(self, room_id, settings_data):
        self.rooms_collection.update_one({"id": room_id}, {"$set": settings_data})

    def add_kicked_user(self, room_id, user_id):
        self.rooms_collection.update_one(
            {"id": room_id}, 
            {"$addToSet": {"kicked_users": user_id}}
        )

    def get_messages(self, room_id):
        return list(self.messages_collection.find({"room_id": room_id}, {"_id": 0}).sort("created_at", 1))

    def create_message(self, message_data):
        self.messages_collection.insert_one(message_data)
