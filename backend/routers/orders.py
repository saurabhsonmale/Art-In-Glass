from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database, ORDERS_COLLECTION, USERS_COLLECTION
from models import OrderCreate, OrderResponse, OrderItem
from auth import get_current_active_user
from bson import ObjectId
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_order(order_data: OrderCreate, current_user = Depends(get_current_active_user)):
    """Place a new order with standard/custom items"""
    try:
        db = get_database()
        orders_collection = db[ORDERS_COLLECTION]
        users_collection = db[USERS_COLLECTION]
        
        # Verify user exists
        user = await users_collection.find_one({"_id": ObjectId(current_user.user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create order document
        order_dict = order_data.dict()
        order_dict["customer_id"] = current_user.user_id
        order_dict["order_status"] = "PENDING"
        order_dict["tracking_details"] = None
        order_dict["created_at"] = None  # Will use default
        order_dict["updated_at"] = None  # Will use default
        
        # Insert order
        result = await orders_collection.insert_one(order_dict)
        
        # Get created order
        created_order = await orders_collection.find_one({"_id": result.inserted_id})
        
        return {
            "id": str(created_order["_id"]),
            "customer_id": str(created_order["customer_id"]),
            "items": created_order["items"],
            "total_amount": created_order["total_amount"],
            "shipping_address": created_order["shipping_address"],
            "order_status": created_order["order_status"],
            "tracking_details": created_order.get("tracking_details"),
            "created_at": created_order["created_at"],
            "updated_at": created_order["updated_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.get("/my-orders", response_model=List[Dict[str, Any]])
async def get_my_orders(current_user = Depends(get_current_active_user)):
    """Fetch customer's order history"""
    try:
        db = get_database()
        orders_collection = db[ORDERS_COLLECTION]
        
        # Find all orders for the current user
        orders_cursor = orders_collection.find({"customer_id": current_user.user_id}).sort("created_at", -1)
        orders = await orders_cursor.to_list(length=None)
        
        # Convert to response format
        result = []
        for order in orders:
            result.append({
                "id": str(order["_id"]),
                "customer_id": str(order["customer_id"]),
                "items": order["items"],
                "total_amount": order["total_amount"],
                "shipping_address": order["shipping_address"],
                "order_status": order["order_status"],
                "tracking_details": order.get("tracking_details"),
                "created_at": order["created_at"],
                "updated_at": order["updated_at"]
            })
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}"
        )


@router.get("/{order_id}/track", response_model=Dict[str, Any])
async def track_order(order_id: str, current_user = Depends(get_current_active_user)):
    """Get detailed tracking status for an order"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(order_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid order ID"
            )
        
        db = get_database()
        orders_collection = db[ORDERS_COLLECTION]
        
        # Find order
        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Verify order belongs to current user
        if order["customer_id"] != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This order does not belong to you"
            )
        
        return {
            "id": str(order["_id"]),
            "order_status": order["order_status"],
            "tracking_details": order.get("tracking_details"),
            "created_at": order["created_at"],
            "updated_at": order["updated_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track order: {str(e)}"
        )


@router.get("/{order_id}", response_model=Dict[str, Any])
async def get_order_by_id(order_id: str, current_user = Depends(get_current_active_user)):
    """Get order details by ID"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(order_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid order ID"
            )
        
        db = get_database()
        orders_collection = db[ORDERS_COLLECTION]
        
        # Find order
        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Verify order belongs to current user
        if order["customer_id"] != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This order does not belong to you"
            )
        
        return {
            "id": str(order["_id"]),
            "customer_id": str(order["customer_id"]),
            "items": order["items"],
            "total_amount": order["total_amount"],
            "shipping_address": order["shipping_address"],
            "order_status": order["order_status"],
            "tracking_details": order.get("tracking_details"),
            "created_at": order["created_at"],
            "updated_at": order["updated_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch order: {str(e)}"
        )