from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection, get_database, USERS_COLLECTION
from routers import auth, products, orders
from auth import get_password_hash
import os
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    
    # Seed admin user
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        
        # Check if admin already exists
        existing_admin = await users_collection.find_one({"email": "ops@artinglass.com"})
        
        if not existing_admin:
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
        else:
            print("✓ Ops Admin user already exists")
            print(f"  Email: ops@artinglass.com")
            print(f"  Role: {existing_admin.get('role', 'customer')}")
    except Exception as e:
        print(f"✗ Error seeding admin user: {e}")
    
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="Art In Glass - Resin Art API",
    description="Backend API for Custom Resin Art Business",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Art In Glass - Resin Art API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development"
    )