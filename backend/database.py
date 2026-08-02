from typing import Optional, Dict, Any

from motor.motor_asyncio import AsyncIOMotorClient

from config import settings
from mongo_client import create_motor_client


class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None


db = Database()


# Collection names for Art In Glass project
USERS_COLLECTION = "users"
PRODUCTS_COLLECTION = "products"
ORDERS_COLLECTION = "orders"
TOKEN_BLACKLIST_COLLECTION = "token_blacklist"
WISHLISTS_COLLECTION = "wishlists"
SUPPORT_TICKETS_COLLECTION = "support_tickets"


async def connect_to_mongo() -> None:
    """Create MongoDB client, ping, and initialize indexes.

    Raises on failure with an actionable message (no silent localhost fallback).
    """
    try:
        db.client = create_motor_client(
            settings.mongodb_uri,
            timeout_ms=settings.mongodb_server_selection_timeout_ms,
        )
        db.database = db.client[settings.database_name]

        await db.client.admin.command("ping")
        await initialize_collections()

        print(
            f"[OK] Connected to MongoDB db={settings.database_name} "
            f"host={settings.mongo_host_for_logs}"
        )
        print(
            "[OK] Collections initialized: "
            "users, products, orders, token_blacklist, wishlists, support_tickets"
        )
    except Exception as e:
        db.client = None
        db.database = None
        err = str(e)
        print(f"[ERROR] MongoDB connection failed: {e}")
        print(
            "[ERROR] Fix checklist:\n"
            "  1) Atlas → Network Access → Allow Access from Anywhere (0.0.0.0/0)\n"
            "     (SSL TLSV1_ALERT_INTERNAL_ERROR usually means IP not whitelisted)\n"
            "  2) MONGODB_URI must be mongodb+srv://... (Atlas), not localhost\n"
            "  3) certifi/dnspython installed (see requirements.txt)"
        )
        if "SSL" in err or "TLS" in err:
            print(
                "[ERROR] SSL handshake failed — almost always Atlas Network Access. "
                "Add 0.0.0.0/0, wait 1–2 minutes, redeploy."
            )
        raise RuntimeError(
            "MongoDB connection failed. Allow 0.0.0.0/0 in Atlas Network Access "
            "and confirm MONGODB_URI is mongodb+srv://..."
        ) from e


async def ping_mongo() -> Dict[str, Any]:
    """Lightweight DB connectivity check for /health."""
    if db.client is None or db.database is None:
        return {
            "ok": False,
            "database": "disconnected",
            "host": settings.mongo_host_for_logs,
            "error": "MongoDB client not initialized",
        }
    try:
        await db.client.admin.command("ping")
        return {
            "ok": True,
            "database": "connected",
            "host": settings.mongo_host_for_logs,
            "name": settings.database_name,
        }
    except Exception as e:
        return {
            "ok": False,
            "database": "error",
            "host": settings.mongo_host_for_logs,
            "error": str(e),
        }


async def initialize_collections():
    """Initialize collections with indexes and required schema defaults."""
    if db.database is None:
        return

    users_collection = db.database[USERS_COLLECTION]
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("phone")
    await users_collection.create_index("role")
    await users_collection.create_index("created_at")

    products_collection = db.database[PRODUCTS_COLLECTION]
    await products_collection.create_index("category")
    await products_collection.create_index("is_active")
    await products_collection.create_index("created_at")

    orders_collection = db.database[ORDERS_COLLECTION]
    await orders_collection.create_index("customer_id")
    await orders_collection.create_index("order_status")
    await orders_collection.create_index("created_at")
    await orders_collection.create_index([("customer_id", 1), ("created_at", -1)])

    token_blacklist_collection = db.database[TOKEN_BLACKLIST_COLLECTION]
    await token_blacklist_collection.create_index("token", unique=True)
    await token_blacklist_collection.create_index("expires_at", expireAfterSeconds=0)
    await token_blacklist_collection.create_index("user_id")

    wishlists_collection = db.database[WISHLISTS_COLLECTION]
    await wishlists_collection.create_index("user_id", unique=True)
    await wishlists_collection.create_index("updated_at")

    support_collection = db.database[SUPPORT_TICKETS_COLLECTION]
    await support_collection.create_index("user_id")
    await support_collection.create_index("status")
    await support_collection.create_index("created_at")


async def ensure_user_profile_fields(user_doc: dict) -> dict:
    """Return $set patch for missing profile fields on a user document."""
    patch = {}
    if user_doc.get("created_at") is None:
        from datetime import datetime
        patch["created_at"] = datetime.utcnow()
    if "updated_at" not in user_doc:
        from datetime import datetime
        patch["updated_at"] = user_doc.get("created_at") or datetime.utcnow()
    if "default_shipping_address" not in user_doc:
        patch["default_shipping_address"] = None
    if "notification_preferences" not in user_doc:
        patch["notification_preferences"] = {
            "order_updates": True,
            "promotions": False,
            "push_enabled": True,
        }
    if "is_active" not in user_doc:
        patch["is_active"] = True
    return patch


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        db.client = None
        db.database = None
        print("MongoDB connection closed")


def get_database():
    """Get database instance"""
    return db.database
