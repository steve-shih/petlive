import uuid
from pymongo import MongoClient

import os

# ?芸?霈?憓??賂??亦?蝙?其???Atlas MongoDB
# 瘜冽?蝯偏??鈭?/petbar 靘?摰??澈?迂
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://shihcarl_db_user:yYoKdzstKkas1T5r@cluster0.5j6fbvu.mongodb.net/petbar?appName=Cluster0')

try:
    client = MongoClient(MONGO_URI)
    db = client.get_default_database()
except Exception as e:
    print(f"MongoDB connection error: {e}")
    # Fallback to test db name if no default db is provided in URI
    db = client['petbar']

# ?箔??嫣噶?Ｙ??臭???ID
def generate_uuid():
    return str(uuid.uuid4())
