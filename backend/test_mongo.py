import json
import os
import sys

# Try importing pymongo, if not, print error
try:
    from pymongo import MongoClient
except ImportError:
    print("pymongo not installed!")
    sys.exit(1)

# Read config
config_path = os.path.join(os.path.dirname(__file__), 'config.json')
try:
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    mongo_uri = config.get("database", {}).get("mongo_uri")
    if not mongo_uri:
        print("MONGO_URI not found in config.json")
        sys.exit(1)
except Exception as e:
    print(f"Error reading config: {e}")
    sys.exit(1)

try:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("SUCCESS: Connected to MongoDB successfully!")
except Exception as e:
    print(f"FAILED: Connection to MongoDB failed: {e}")
    sys.exit(1)
