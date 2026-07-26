from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from database import get_database, USERS_COLLECTION
from models import UserCreate, UserLogin, UserResponse, Token
from auth import get_password_hash, verify_password, create_access_token, get_current_active_user
from config import settings
from bson import ObjectId
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user (customer or admin)"""
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        
        # Check if email already exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if phone already exists
        existing_phone = await users_collection.find_one({"phone": user_data.phone})
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        
        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Create user document
        user_dict = user_data.dict()
        user_dict.pop("password")
        user_dict["password_hash"] = password_hash
        user_dict["created_at"] = user_dict.get("created_at", None)  # Will use default
        
        # Insert user
        result = await users_collection.insert_one(user_dict)
        
        # Get created user
        created_user = await users_collection.find_one({"_id": result.inserted_id})
        
        # Convert to response format
        user_response = {
            "id": str(created_user["_id"]),
            "full_name": created_user["full_name"],
            "email": created_user["email"],
            "phone": created_user["phone"],
            "role": created_user["role"],
            "created_at": created_user["created_at"]
        }
        
        return {
            "message": "User registered successfully",
            "user": user_response
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        
        # Find user by email
        user = await users_collection.find_one({"email": credentials.email})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user["_id"]), "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(user["_id"]),
            "role": user["role"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_active_user)):
    """Get current user information"""
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        
        user = await users_collection.find_one({"_id": ObjectId(current_user.user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user["email"],
            "phone": user["phone"],
            "role": user["role"],
            "created_at": user["created_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}"
        )