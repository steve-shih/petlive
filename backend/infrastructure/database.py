import os
from pymongo import MongoClient
from infrastructure.config_loader import ConfigLoader

class Database:
    _client = None
    _db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            # 優先讀取環境變數，若無則使用 config.json
            mongo_uri = os.environ.get('MONGO_URI') or ConfigLoader.get('database', 'mongo_uri')
            db_name = os.environ.get('DB_NAME') or ConfigLoader.get('database', 'db_name', 'petlive')
            
            try:
                cls._client = MongoClient(mongo_uri)
                # 如果 URI 中有預設 DB 就用預設的，否則使用 config 的 db_name
                try:
                    cls._db = cls._client.get_default_database()
                except Exception:
                    cls._db = cls._client[db_name]
            except Exception as e:
                print(f"MongoDB connection error: {e}")
                raise e
        return cls._db
