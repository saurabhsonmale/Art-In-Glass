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
    
    # Ensure Ops Admin can always log in (RBAC: ops_admin)
    try:
        from auth import verify_password

        db = get_database()
        users_collection = db[USERS_COLLECTION]

        admin_email = "ops@artinglass.com"
        admin_password = "AdminPassword123!"

        existing_admin = await users_collection.find_one({
            "email": {"$regex": f"^{admin_email}$", "$options": "i"}
        })

        if not existing_admin:
            admin_data = {
                "full_name": "Ops Admin",
                "email": admin_email,
                "phone": "+919876543210",
                "role": "ops_admin",
                "password_hash": get_password_hash(admin_password),
            }
            result = await users_collection.insert_one(admin_data)
            print("[OK] Ops Admin user created successfully!")
            print(f"  Email: {admin_email}")
            print(f"  Password: {admin_password}")
            print(f"  Role: ops_admin")
            print(f"  User ID: {result.inserted_id}")
        else:
            repairs = {}
            current_role = str(existing_admin.get("role") or "").strip().lower()
            if current_role != "ops_admin":
                repairs["role"] = "ops_admin"

            # Repair broken/missing hash so default admin credentials work
            stored_hash = existing_admin.get("password_hash") or ""
            password_ok = False
            if stored_hash:
                try:
                    password_ok = verify_password(admin_password, stored_hash)
                except Exception:
                    password_ok = False
            if not password_ok:
                repairs["password_hash"] = get_password_hash(admin_password)

            # Keep email normalized lowercase for reliable login
            if existing_admin.get("email") != admin_email:
                repairs["email"] = admin_email

            if repairs:
                await users_collection.update_one(
                    {"_id": existing_admin["_id"]},
                    {"$set": repairs},
                )
                print("[OK] Ops Admin credentials repaired")
            else:
                print("[OK] Ops Admin user ready")

            print(f"  Email: {admin_email}")
            print(f"  Password: {admin_password}")
            print("  Role: ops_admin")
    except Exception as e:
        print(f"[ERROR] Error seeding admin user: {e}")
    
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