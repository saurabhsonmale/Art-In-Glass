from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from config import settings


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


async def connect_to_mongo():
    """Create database connection and initialize collections"""
    try:
        db.client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
            connectTimeoutMS=settings.mongodb_server_selection_timeout_ms,
        )
        db.database = db.client[settings.database_name]

        # Fail fast if Atlas/network blocks Render (instead of hanging forever)
        await db.client.admin.command("ping")

        await initialize_collections()

        print(f"[OK] Connected to MongoDB: {settings.database_name}")
        print(
            "[OK] Collections initialized: "
            "users, products, orders, token_blacklist, wishlists, support_tickets"
        )
    except Exception as e:
        print(f"[ERROR] Error connecting to MongoDB: {e}")
        print(
            "[HINT] On MongoDB Atlas → Network Access, allow Render / public access "
            "(0.0.0.0/0) or the hosting CIDRs: 74.220.49.0/24, 74.220.57.0/24"
        )
        raise


async def initialize_collections():
    """Initialize collections with indexes and required schema defaults."""
    if db.database is None:
        return

    # Users — profile, auth, saved address, notification prefs
    users_collection = db.database[USERS_COLLECTION]
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("phone")
    await users_collection.create_index("role")
    await users_collection.create_index("created_at")

    # Products — catalog for customers + admin
    products_collection = db.database[PRODUCTS_COLLECTION]
    await products_collection.create_index("category")
    await products_collection.create_index("is_active")
    await products_collection.create_index("created_at")

    # Orders — customer purchase + admin queue
    orders_collection = db.database[ORDERS_COLLECTION]
    await orders_collection.create_index("customer_id")
    await orders_collection.create_index("order_status")
    await orders_collection.create_index("created_at")
    await orders_collection.create_index([("customer_id", 1), ("created_at", -1)])

    # Token blacklist — logout / revoke
    token_blacklist_collection = db.database[TOKEN_BLACKLIST_COLLECTION]
    await token_blacklist_collection.create_index("token", unique=True)
    await token_blacklist_collection.create_index("expires_at", expireAfterSeconds=0)
    await token_blacklist_collection.create_index("user_id")

    # Wishlists — customer saved products
    wishlists_collection = db.database[WISHLISTS_COLLECTION]
    await wishlists_collection.create_index("user_id", unique=True)
    await wishlists_collection.create_index("updated_at")

    # Support tickets — help & support from profile
    support_collection = db.database[SUPPORT_TICKETS_COLLECTION]
    await support_collection.create_index("user_id")
    await support_collection.create_index("status")
    await support_collection.create_index("created_at")


async def ensure_user_profile_fields(user_doc: dict) -> dict:
    """
    Return $set patch for missing profile fields on a user document.
    Safe to call on login /me / update — does not overwrite existing values.
    """
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
        print("MongoDB connection closed")


def get_database():
    """Get database instance"""
    return db.database
