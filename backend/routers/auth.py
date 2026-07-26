from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from database import get_database, USERS_COLLECTION, TOKEN_BLACKLIST_COLLECTION
from models import UserCreate, UserLogin, UserResponse, Token
from auth import get_password_hash, verify_password, create_access_token, get_current_active_user, get_current_user, oauth2_scheme
from config import settings
from bson import ObjectId
from typing import Dict, Any
from jose import JWTError, jwt

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
        # Don't set created_at - let MongoDB use the default from the model
        
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


@router.get("/me", response_model=dict)
async def get_current_user_info(current_user = Depends(get_current_active_user)):
    """Get current user information"""
    try:
        db = get_database()
        users_collection = db[USERS_COLLECTION]
        
        # Validate user_id format
        if not current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user_id"
            )
        
        # Convert string ID to ObjectId
        try:
            user_object_id = ObjectId(current_user.user_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: invalid user_id format - {str(e)}"
            )
        
        user = await users_collection.find_one({"_id": user_object_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Handle created_at field - convert datetime to string
        created_at = user.get("created_at")
        if created_at is None:
            created_at = datetime.utcnow().isoformat()
        elif hasattr(created_at, 'isoformat'):
            created_at = created_at.isoformat()
        else:
            # If it's already a string or other type, convert to string
            created_at = str(created_at)
        
        # Build response with proper type conversion
        response_data = {
            "id": str(user["_id"]),
            "full_name": str(user.get("full_name", "")),
            "email": str(user.get("email", "")),
            "phone": str(user.get("phone", "")),
            "role": str(user.get("role", "customer")),
            "created_at": created_at
        }
        
        return response_data
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error in /me endpoint: {str(e)}")
        print(f"Traceback: {error_detail}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}"
        )


@router.post("/logout", response_model=Dict[str, str])
async def logout(current_user = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    """Logout user and invalidate token"""
    try:
        db = get_database()
        token_blacklist_collection = db[TOKEN_BLACKLIST_COLLECTION]
        
        # Decode token to get expiration time
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            exp_timestamp = payload.get("exp")
            
            if exp_timestamp:
                # Calculate when the token expires
                expires_at = datetime.utcfromtimestamp(exp_timestamp)
                
                # Add token to blacklist
                await token_blacklist_collection.insert_one({
                    "token": token,
                    "user_id": current_user.user_id,
                    "expires_at": expires_at,
                    "created_at": datetime.utcnow()
                })
        except JWTError:
            # If we can't decode the token, still return success (client-side cleanup will handle it)
            pass
        
        return {
            "message": "Logged out successfully",
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}"
        )
