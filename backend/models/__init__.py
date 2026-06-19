import uuid
from pymongo import MongoClient

import os

# 優先讀取環境變數，若無則使用你的 Atlas MongoDB
# 注意結尾加上了 /petlive 來指定資料庫名稱
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://shihcarl_db_user:yYoKdzstKkas1T5r@cluster0.5j6fbvu.mongodb.net/petlive?appName=Cluster0')

try:
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
except Exception as e:
    print(f"MongoDB connection error: {e}")
    # Fallback to test db name if no default db is provided in URI
    db = client['petlive']

# 為了方便產生唯一的 ID
def generate_uuid():
    return str(uuid.uuid4())
