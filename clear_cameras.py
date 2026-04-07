from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://arunvashisth80_db_user:arun8080@smartresq.fii5rvi.mongodb.net/")

client = MongoClient(MONGO_URI)
db = client["smartresq"]
cameras_col = db["cameras"]

result = cameras_col.delete_many({})
print(f"Successfully deleted {result.deleted_count} cameras.")
client.close()
