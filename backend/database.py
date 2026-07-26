from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from config import settings


class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None


db = Database()


async def connect_to_mongo():
    """Create database connection and initialize collections"""
    try:
        db.client = AsyncIOMotorClient(settings.mongodb_uri)
        db.database = db.client[settings.database_name]
        
        # Initialize collections for Art In Glass project
        await initialize_collections()
        
        print(f"✓ Connected to MongoDB: {settings.database_name}")
        print(f"✓ Database: {settings.database_name}")
        print(f"✓ Collections initialized: users, products, orders")
    except Exception as e:
        print(f"✗ Error connecting to MongoDB: {e}")
        raise


async def initialize_collections():
    """Initialize collections with indexes for Art In Glass project"""
    if db.database is None:
        return
    
    # Users collection
    users_collection = db.database["users"]
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("role")
    
    # Products collection
    products_collection = db.database["products"]
    await products_collection.create_index("category")
    await products_collection.create_index("created_at")
    
    # Orders collection
    orders_collection = db.database["orders"]
    await orders_collection.create_index("customer_id")
    await orders_collection.create_index("order_status")
    await orders_collection.create_index("created_at")


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        print("MongoDB connection closed")


def get_database():
    """Get database instance"""
    return db.database


# Collection names for Art In Glass project
USERS_COLLECTION = "users"
PRODUCTS_COLLECTION = "products"
ORDERS_COLLECTION = "orders"
