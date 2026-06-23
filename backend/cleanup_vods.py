import os
import json
import datetime
from pymongo import MongoClient
from google.cloud import storage

# Read config
config_path = os.path.join(os.path.dirname(__file__), 'config.json')
with open(config_path, 'r', encoding='utf-8') as f:
    config = json.load(f)
mongo_uri = config.get("database", {}).get("mongo_uri")

if not mongo_uri:
    print("MONGO_URI not found in config.json")
    exit(1)

# Connect to DB
client = MongoClient(mongo_uri)
db = client.petbar

# Initialize GCS
try:
    gcs_client = storage.Client()
    bucket = gcs_client.bucket("petpa")
    use_gcs = True
except Exception as e:
    print(f"Failed to initialize GCS client: {e}")
    use_gcs = False

# 12 hours ago
threshold_time = datetime.datetime.utcnow() - datetime.timedelta(hours=12)
threshold_iso = threshold_time.isoformat()

print(f"[{datetime.datetime.utcnow().isoformat()}] Starting cleanup job. Deleting VODs older than {threshold_iso}")

query = {
    "type": "LIVE_RECORD",
    "is_permanent": {"$ne": True},
    "created_at": {"$lt": threshold_iso}
}

old_records = list(db.media.find(query))

if not old_records:
    print("No old VODs to delete.")
else:
    for record in old_records:
        record_id = record.get('id')
        url = record.get('url', '')
        print(f"Deleting record {record_id}...")
        
        # Delete from GCS
        if use_gcs and "storage.googleapis.com" in url or "petpa" in url:
            try:
                # url typically: https://storage.googleapis.com/petpa/petbar_vods/filename.webm
                # we just extract the blob name
                blob_name = url.split("petpa/")[-1] 
                if blob_name.startswith("petbar_vods/"):
                    blob = bucket.blob(blob_name)
                    blob.delete()
                    print(f" - Deleted from GCS: {blob_name}")
            except Exception as e:
                print(f" - Failed to delete from GCS: {e}")
        
        # Delete from DB
        db.media.delete_one({"_id": record["_id"]})
        print(f" - Deleted from MongoDB: {record_id}")

print("Cleanup job finished.")
