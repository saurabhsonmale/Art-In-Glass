"""
Seed script to create Ops Admin user on app startup
"""
from database import connect_to_mongo, get_database, USERS_COLLECTION
from auth import get_password_hash
from config import settings
import asyncio


async def seed_admin_user():
    """Create default Ops Admin user if not exists"""
    try:
        # Connect to MongoDB
        await connect_to_mongo()
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        
        # Check if admin already exists
        existing_admin = await users_collection.find_one({"email": "ops@artinglass.com"})
        
        if existing_admin:
            print("✓ Ops Admin user already exists")
            print(f"  Email: ops@artinglass.com")
            print(f"  Role: {existing_admin.get('role', 'customer')}")
            return
        
        # Create admin user
        admin_data = {
            "full_name": "Ops Admin",
            "email": "ops@artinglass.com",
            "phone": "+919876543210",
            "role": "ops_admin",
            "password_hash": get_password_hash("AdminPassword123!"),
            "created_at": None  # Will use MongoDB default
        }
        
        result = await users_collection.insert_one(admin_data)
        
        print("✓ Ops Admin user created successfully!")
        print(f"  Email: ops@artinglass.com")
        print(f"  Password: AdminPassword123!")
        print(f"  Role: ops_admin")
        print(f"  User ID: {result.inserted_id}")
        print("\n⚠️  Please change the password after first login!")
        
    except Exception as e:
        print(f"✗ Error seeding admin user: {e}")
        raise
    finally:
        # Close connection
        from database import close_mongo_connection
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(seed_admin_user())