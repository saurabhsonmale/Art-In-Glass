"""
Verify Atlas credentials from backend/.env.production (gitignored).
Usage (from backend/):
  python verify_atlas.py
"""
from pathlib import Path

from dotenv import load_dotenv
import os
from pymongo import MongoClient

env_path = Path(__file__).resolve().parent / ".env.production"
if not env_path.exists():
    raise SystemExit("Missing backend/.env.production")

load_dotenv(env_path)
uri = os.getenv("MONGODB_URI", "")
if not uri or "ReplaceMe" in uri or "<db_username>" in uri:
    raise SystemExit("MONGODB_URI still has a placeholder username")

client = MongoClient(uri, serverSelectionTimeoutMS=15000)
client.admin.command("ping")
db_name = os.getenv("DATABASE_NAME", "resin_art_db")
names = client[db_name].list_collection_names()
print(f"[OK] Atlas connected database={db_name} collections={names}")
