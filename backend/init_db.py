"""
Database initialization script for Art In Glass project
Run this script to initialize the database with required collections and indexes
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings


async def init_database():
    """Initialize Art In Glass database with collections and indexes"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.mongodb_uri)
        db = client[settings.database_name]
        
        print(f"Connecting to MongoDB: {settings.database_name}")
        print(f"Database URL: {settings.mongodb_uri}")
        
        # Create collections with schema validation
        # Users Collection
        users_collection = db["users"]
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("role")
        await users_collection.create_index("created_at")
        print("✓ Created collection: users")
        
        # Products Collection
        products_collection = db["products"]
        await products_collection.create_index("category")
        await products_collection.create_index("created_at")
        await products_collection.create_index("is_customizable")
        print("✓ Created collection: products")
        
        # Orders Collection
        orders_collection = db["orders"]
        await orders_collection.create_index("customer_id")
        await orders_collection.create_index("order_status")
        await orders_collection.create_index("created_at")
        print("✓ Created collection: orders")
        
        # Create a default admin user (optional)
        # Note: Password should be hashed before inserting in production
        admin_exists = await users_collection.find_one({"email": "admin@artinglass.com"})
        if not admin_exists:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            admin_user = {
                "full_name": "Admin User",
                "email": "admin@artinglass.com",
                "phone": "0000000000",
                "role": "admin",
                "password_hash": pwd_context.hash("admin123"),
                "created_at": datetime.utcnow()
            }
            await users_collection.insert_one(admin_user)
            print("✓ Created default admin user: admin@artinglass.com / admin123")
        
        print("\n" + "="*50)
        print("✓ Database initialization completed successfully!")
        print("="*50)
        print(f"Database: {settings.database_name}")
        print(f"Collections: users, products, orders")
        print("\nYou can now start the application with: python main.py")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        raise


if __name__ == "__main__":
    from datetime import datetime
    asyncio.run(init_database())