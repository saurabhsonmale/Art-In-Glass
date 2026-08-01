from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database, ORDERS_COLLECTION, USERS_COLLECTION
from models import (
    OrderCreate,
    OrderStatusUpdate,
    ORDER_STATUSES,
    ORDER_STATUS_TRANSITIONS,
)
from auth import get_current_active_user, require_any_role
from bson import ObjectId
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


def _serialize_order(order: dict) -> Dict[str, Any]:
    """Convert a MongoDB order document to API response format."""
    return {
        "id": str(order["_id"]),
        "customer_id": str(order["customer_id"]),
        "items": order["items"],
        "total_amount": order["total_amount"],
        "shipping_address": order["shipping_address"],
        "payment_method": order.get("payment_method", "cod"),
        "order_status": order["order_status"],
        "tracking_details": order.get("tracking_details"),
        "created_at": order["created_at"],
        "updated_at": order.get("updated_at", order["created_at"]),
    }


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
        order_dict["payment_details"] = {
            "method": order_data.payment_method or "cod",
            "status": "PENDING"
        }
        now = datetime.utcnow()
        order_dict["created_at"] = now
        order_dict["updated_at"] = now
        
        # Insert order
        result = await orders_collection.insert_one(order_dict)
        
        # Get created order
        created_order = await orders_collection.find_one({"_id": result.inserted_id})
        
        return _serialize_order(created_order)
    
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
        
        return [_serialize_order(order) for order in orders]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}"
        )


@router.get("", response_model=List[Dict[str, Any]])
async def get_all_orders_admin(
    current_user=Depends(require_any_role(["ops_admin", "admin"]))
):
    """Fetch all orders (Ops Admin only)"""
    try:
        db = get_database()
        orders_collection = db[ORDERS_COLLECTION]

        orders_cursor = orders_collection.find({}).sort("created_at", -1)
        orders = await orders_cursor.to_list(length=None)

        return [_serialize_order(order) for order in orders]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}"
        )


@router.put("/{order_id}/status", response_model=Dict[str, Any])
async def update_order_status_admin(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user=Depends(require_any_role(["ops_admin", "admin"]))
):
    """Update order status (Ops Admin only)"""
    try:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid order ID"
            )

        new_status = status_update.order_status
        if new_status not in ORDER_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(ORDER_STATUSES)}"
            )

        db = get_database()
        orders_collection = db[ORDERS_COLLECTION]

        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        current_status = order["order_status"]
        allowed = ORDER_STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from {current_status} to {new_status}"
            )

        update_data = {
            "order_status": new_status,
            "updated_at": datetime.utcnow(),
        }

        if status_update.tracking_details:
            update_data["tracking_details"] = status_update.tracking_details.dict()

        if new_status == "DISPATCHED" and not order.get("tracking_details") and not status_update.tracking_details:
            update_data["tracking_details"] = {
                "courier_name": "Standard Delivery",
                "tracking_number": f"AIG-{order_id[-8:].upper()}",
                "dispatch_date": datetime.utcnow().isoformat(),
            }

        await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": update_data}
        )

        updated_order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        return _serialize_order(updated_order)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order status: {str(e)}"
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
        
        return _serialize_order(order)
    
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
        
        return _serialize_order(order)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch order: {str(e)}"
        )