from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta
from database import (
    get_database,
    USERS_COLLECTION,
    TOKEN_BLACKLIST_COLLECTION,
    PRODUCTS_COLLECTION,
    ORDERS_COLLECTION,
    SUPPORT_TICKETS_COLLECTION,
    ensure_user_profile_fields,
)
from models import (
    UserCreate,
    UserLogin,
    Token,
    UserProfileUpdate,
    SupportTicketCreate,
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    get_current_user,
    oauth2_scheme,
    require_any_role,
)
from config import settings
from bson import ObjectId
from typing import Dict, Any, Optional
from jose import JWTError, jwt
import re

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])

DEFAULT_NOTIFICATION_PREFS = {
    "order_updates": True,
    "promotions": False,
    "push_enabled": True,
}


def _to_iso(value) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _serialize_user(user: dict) -> Dict[str, Any]:
    """Full profile payload for /me and profile updates."""
    prefs = user.get("notification_preferences") or DEFAULT_NOTIFICATION_PREFS
    return {
        "id": str(user["_id"]),
        "full_name": str(user.get("full_name", "")),
        "email": str(user.get("email", "")),
        "phone": str(user.get("phone", "")),
        "role": str(user.get("role", "customer")),
        "is_active": bool(user.get("is_active", True)),
        "default_shipping_address": user.get("default_shipping_address"),
        "notification_preferences": {
            "order_updates": bool(prefs.get("order_updates", True)),
            "promotions": bool(prefs.get("promotions", False)),
            "push_enabled": bool(prefs.get("push_enabled", True)),
        },
        "created_at": _to_iso(user.get("created_at")) or datetime.utcnow().isoformat(),
        "updated_at": _to_iso(user.get("updated_at")),
    }


async def _get_user_or_404(user_id: str) -> dict:
    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: invalid user_id",
        )
    db = get_database()
    user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    # Backfill missing profile fields without breaking existing data
    patch = await ensure_user_profile_fields(user)
    if patch:
        await db[USERS_COLLECTION].update_one({"_id": user["_id"]}, {"$set": patch})
        user.update(patch)
    return user


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new customer with full profile fields."""
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]

        email = (user_data.email or "").strip().lower()
        existing_user = await users_collection.find_one({
            "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        existing_phone = await users_collection.find_one({"phone": user_data.phone})
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered",
            )

        now = datetime.utcnow()
        user_dict = {
            "full_name": user_data.full_name.strip(),
            "email": email,
            "phone": user_data.phone.strip(),
            "role": "customer",
            "password_hash": get_password_hash(user_data.password),
            "is_active": True,
            "default_shipping_address": None,
            "notification_preferences": dict(DEFAULT_NOTIFICATION_PREFS),
            "created_at": now,
            "updated_at": now,
        }

        result = await users_collection.insert_one(user_dict)
        created_user = await users_collection.find_one({"_id": result.inserted_id})

        return {
            "message": "User registered successfully",
            "user": _serialize_user(created_user),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token (works for customer, admin, ops_admin)."""
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]

        email = (credentials.email or "").strip().lower()
        password = credentials.password or ""

        # Case-insensitive email match (admin + customer)
        user = await users_collection.find_one({
            "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
        })
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        password_hash = user.get("password_hash") or ""
        if not password_hash or not verify_password(password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        role = str(user.get("role") or "customer").strip().lower()
        if role not in {"customer", "admin", "ops_admin"}:
            role = "customer"

        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user["_id"]), "role": role},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(user["_id"]),
            "role": role
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/me", response_model=dict)
async def get_current_user_info(current_user=Depends(get_current_active_user)):
    """Get current user profile (customer + admin)."""
    try:
        user = await _get_user_or_404(current_user.user_id)
        return _serialize_user(user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}",
        )


@router.put("/me", response_model=dict)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    current_user=Depends(get_current_active_user),
):
    """Update profile fields from Account Settings (all roles)."""
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        user = await _get_user_or_404(current_user.user_id)

        updates: Dict[str, Any] = {}

        if profile_data.full_name is not None:
            name = profile_data.full_name.strip()
            if not name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Full name cannot be empty",
                )
            updates["full_name"] = name

        if profile_data.phone is not None:
            phone = profile_data.phone.strip()
            if not phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone cannot be empty",
                )
            duplicate = await users_collection.find_one({
                "phone": phone,
                "_id": {"$ne": user["_id"]},
            })
            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone number already registered",
                )
            updates["phone"] = phone

        if profile_data.default_shipping_address is not None:
            updates["default_shipping_address"] = profile_data.default_shipping_address.dict()

        if profile_data.notification_preferences is not None:
            updates["notification_preferences"] = profile_data.notification_preferences.dict()

        if not updates:
            return _serialize_user(user)

        updates["updated_at"] = datetime.utcnow()
        await users_collection.update_one({"_id": user["_id"]}, {"$set": updates})
        updated = await users_collection.find_one({"_id": user["_id"]})
        return _serialize_user(updated)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )


@router.get("/admin/stats", response_model=dict)
async def get_admin_profile_stats(
    current_user=Depends(require_any_role(["ops_admin", "admin"])),
):
    """Dashboard counts for Admin Profile screen."""
    try:
        db = get_database()
        products = db[PRODUCTS_COLLECTION]
        orders = db[ORDERS_COLLECTION]

        active_products = await products.count_documents({"is_active": {"$ne": False}})
        total_orders = await orders.count_documents({})
        delivered_orders = await orders.count_documents({"order_status": "DELIVERED"})
        pending_orders = await orders.count_documents({"order_status": "PENDING"})

        return {
            "products": active_products,
            "orders": total_orders,
            "delivered": delivered_orders,
            "pending": pending_orders,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load admin stats: {str(e)}",
        )


@router.post("/support", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_support_ticket(
    ticket: SupportTicketCreate,
    current_user=Depends(get_current_active_user),
):
    """Submit Help & Support message from Profile."""
    try:
        subject = (ticket.subject or "").strip()
        message = (ticket.message or "").strip()
        if not subject or not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subject and message are required",
            )

        db = get_database()
        now = datetime.utcnow()
        doc = {
            "user_id": current_user.user_id,
            "role": getattr(current_user, "role", "customer"),
            "subject": subject,
            "message": message,
            "status": "OPEN",
            "created_at": now,
            "updated_at": now,
        }
        result = await db[SUPPORT_TICKETS_COLLECTION].insert_one(doc)
        return {
            "message": "Support request submitted. We will contact you soon.",
            "ticket_id": str(result.inserted_id),
            "status": "OPEN",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit support request: {str(e)}",
        )


@router.post("/logout", response_model=Dict[str, str])
async def logout(current_user = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    """
    Logout for every RBAC role (customer, admin, ops_admin).
    Invalidates the current JWT via blacklist. No role restriction.
    """
    try:
        db = get_database()
        token_blacklist_collection = db[TOKEN_BLACKLIST_COLLECTION]

        # Role comes from JWT (customer | admin | ops_admin)
        role = getattr(current_user, "role", None) or "customer"
        if isinstance(role, str):
            role = role.strip().lower()

        allowed_roles = {"customer", "admin", "ops_admin"}
        if role not in allowed_roles:
            # Still allow logout so the client can clear session
            role = "unknown"

        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            exp_timestamp = payload.get("exp")
            # Prefer role claim from token when present
            token_role = payload.get("role")
            if isinstance(token_role, str) and token_role.strip().lower() in allowed_roles:
                role = token_role.strip().lower()

            expires_at = (
                datetime.utcfromtimestamp(exp_timestamp)
                if exp_timestamp
                else datetime.utcnow() + timedelta(hours=24)
            )

            # Idempotent blacklist: ignore duplicate token inserts
            existing = await token_blacklist_collection.find_one({"token": token})
            if not existing:
                await token_blacklist_collection.insert_one({
                    "token": token,
                    "user_id": current_user.user_id,
                    "role": role,
                    "expires_at": expires_at,
                    "created_at": datetime.utcnow(),
                })
        except JWTError:
            # Client-side cleanup still proceeds; return success
            pass

        return {
            "message": "Logged out successfully",
            "status": "success",
            "role": role,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )
