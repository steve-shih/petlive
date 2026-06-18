import uuid
from pymongo import MongoClient

# 連接本地 MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['petlive']

# 為了方便產生唯一的 ID
def generate_uuid():
    return str(uuid.uuid4())
