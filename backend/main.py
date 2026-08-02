from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import (
    connect_to_mongo,
    close_mongo_connection,
    get_database,
    USERS_COLLECTION,
    PRODUCTS_COLLECTION,
)
from routers import auth, products, orders, wishlist
from auth import get_password_hash
from datetime import datetime
from config import settings


DEFAULT_NOTIFICATION_PREFS = {
    "order_updates": True,
    "promotions": False,
    "push_enabled": True,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup — do not abort process if Mongo is briefly unavailable on Render
    mongo_ok = await connect_to_mongo(raise_on_error=False)
    if not mongo_ok:
        print("[WARN] Starting API without MongoDB connection; set MONGODB_URI (Atlas) on Render.")
        yield
        await close_mongo_connection()
        return

    # Backfill legacy products missing is_active so they appear in the customer catalog
    try:
        db = get_database()
        if db is None:
            raise RuntimeError("Database not initialized")
        products_collection = db[PRODUCTS_COLLECTION]
        repair_result = await products_collection.update_many(
            {"is_active": {"$exists": False}},
            {"$set": {"is_active": True}},
        )
        if repair_result.modified_count:
            print(f"[OK] Activated {repair_result.modified_count} legacy product(s)")
    except Exception as e:
        print(f"[ERROR] Error repairing product is_active flags: {e}")

    # Backfill profile fields on users missing them (safe, additive only)
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        now = datetime.utcnow()
        # notification_preferences
        r1 = await users_collection.update_many(
            {"notification_preferences": {"$exists": False}},
            {"$set": {"notification_preferences": DEFAULT_NOTIFICATION_PREFS}},
        )
        r2 = await users_collection.update_many(
            {"default_shipping_address": {"$exists": False}},
            {"$set": {"default_shipping_address": None}},
        )
        r3 = await users_collection.update_many(
            {"is_active": {"$exists": False}},
            {"$set": {"is_active": True}},
        )
        r4 = await users_collection.update_many(
            {"created_at": {"$exists": False}},
            {"$set": {"created_at": now}},
        )
        r5 = await users_collection.update_many(
            {"updated_at": {"$exists": False}},
            {"$set": {"updated_at": now}},
        )
        patched = (
            r1.modified_count
            + r2.modified_count
            + r3.modified_count
            + r4.modified_count
            + r5.modified_count
        )
        if patched:
            print(f"[OK] Backfilled profile fields on users ({patched} field updates)")
    except Exception as e:
        print(f"[ERROR] Error backfilling user profile fields: {e}")
    
    # Ensure Ops Admin can always log in (RBAC: ops_admin)
    try:
        from auth import verify_password

        db = get_database()
        users_collection = db[USERS_COLLECTION]

        admin_email = "ops@artinglass.com"
        admin_password = "AdminPassword123!"
        now = datetime.utcnow()

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
                "is_active": True,
                "default_shipping_address": None,
                "notification_preferences": dict(DEFAULT_NOTIFICATION_PREFS),
                "created_at": now,
                "updated_at": now,
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

            if "notification_preferences" not in existing_admin:
                repairs["notification_preferences"] = dict(DEFAULT_NOTIFICATION_PREFS)
            if "default_shipping_address" not in existing_admin:
                repairs["default_shipping_address"] = None
            if "is_active" not in existing_admin:
                repairs["is_active"] = True
            if "created_at" not in existing_admin:
                repairs["created_at"] = now
            if "updated_at" not in existing_admin:
                repairs["updated_at"] = now

            if repairs:
                await users_collection.update_one(
                    {"_id": existing_admin["_id"]},
                    {"$set": repairs},
                )
                print("[OK] Ops Admin credentials / profile repaired")
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

# CORS — include live Render URL; "*" kept for mobile APK clients
_cors_origins = settings.get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(wishlist.router)


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
    """Health check endpoint (also used to wake Render free-tier)."""
    return {
        "status": "healthy",
        "public_base_url": settings.public_base_url,
        "environment": settings.environment,
    }


if __name__ == "__main__":
    import os
    import uvicorn

    # Render sets PORT; fall back to settings / 8000 locally
    port = int(os.environ.get("PORT", settings.port))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.environment == "development",
    )