import os
from pymongo import MongoClient
from infrastructure.config_loader import ConfigLoader

class Database:
    _client = None
    _db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            # ?芸?霈?憓??賂??亦?蝙??config.json
            mongo_uri = os.environ.get('MONGO_URI') or ConfigLoader.get('database', 'mongo_uri')
            db_name = os.environ.get('DB_NAME') or ConfigLoader.get('database', 'db_name', 'petbar')
            
            try:
                cls._client = MongoClient(mongo_uri)
                # 憒? URI 銝剜??身 DB 撠梁?身???血?雿輻 config ??db_name
                try:
                    cls._db = cls._client.get_default_database()
                except Exception:
                    cls._db = cls._client[db_name]
            except Exception as e:
                print(f"MongoDB connection error: {e}")
                raise e
        return cls._db
