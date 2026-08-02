"""
Verify Atlas credentials from the single backend/.env (gitignored).
Usage (from backend/):
  python verify_atlas.py
"""
from pathlib import Path

from dotenv import load_dotenv
import os

from mongo_client import create_sync_client

env_path = Path(__file__).resolve().parent / ".env"
if not env_path.exists():
    raise SystemExit("Missing backend/.env")

load_dotenv(env_path)
uri = os.getenv("MONGODB_URI", "")
if not uri or "USERNAME" in uri or "<db_username>" in uri or "ReplaceMe" in uri:
    raise SystemExit("MONGODB_URI still has a placeholder username")

client = create_sync_client(uri, timeout_ms=15000)
client.admin.command("ping")
db_name = os.getenv("DATABASE_NAME", "resin_art_db")
names = client[db_name].list_collection_names()
print(f"[OK] Atlas connected database={db_name} collections={names}")