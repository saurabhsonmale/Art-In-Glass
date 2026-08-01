from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database, PRODUCTS_COLLECTION
from models import ProductCreate, ProductResponse
from auth import get_current_active_user, require_any_role
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/products", tags=["products"])

# Treat missing is_active as active (legacy/seeded docs); exclude only explicit False
ACTIVE_PRODUCT_FILTER = {"is_active": {"$ne": False}}


def _normalize_customization_options(options: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Keep admin and customer field names in sync for customization."""
    if not options:
        return {}

    normalized = dict(options)
    text_enabled = bool(
        normalized.get("has_text_input")
        or normalized.get("text_enabled")
        or False
    )
    normalized["has_text_input"] = text_enabled
    normalized["text_enabled"] = text_enabled
    return normalized


def _serialize_product(product: dict) -> Dict[str, Any]:
    """Convert a MongoDB product document to API response format."""
    return {
        "id": str(product["_id"]),
        "title": product.get("title", ""),
        "description": product.get("description", ""),
        "base_price": product.get("base_price", 0),
        "category": product.get("category", ""),
        "images": product.get("images", []),
        "is_customizable": product.get("is_customizable", False),
        "customization_options": _normalize_customization_options(
            product.get("customization_options")
        ),
        "rating": product.get("rating", 0.0),
        "estimated_days": product.get("estimated_days", 3),
        "is_active": product.get("is_active", True),
        "created_at": product.get("created_at") or datetime.utcnow(),
    }


@router.get("", response_model=List[Dict[str, Any]])
async def get_all_products():
    """Fetch all active resin art products"""
    try:
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        # Active products for customers (legacy docs without is_active still show)
        products_cursor = products_collection.find(ACTIVE_PRODUCT_FILTER).sort("created_at", -1)
        products = await products_cursor.to_list(length=None)
        
        return [_serialize_product(product) for product in products]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )


@router.get("/{product_id}", response_model=Dict[str, Any])
async def get_product_by_id(product_id: str):
    """Get single product details (only active products)"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product ID"
            )
        
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        product = await products_collection.find_one({
            "_id": ObjectId(product_id),
            **ACTIVE_PRODUCT_FILTER,
        })
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return _serialize_product(product)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch product: {str(e)}"
        )


@router.get("/category/{category}", response_model=List[Dict[str, Any]])
async def get_products_by_category(category: str):
    """Fetch active products by category"""
    try:
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        products_cursor = products_collection.find({
            "category": category,
            **ACTIVE_PRODUCT_FILTER,
        }).sort("created_at", -1)
        products = await products_cursor.to_list(length=None)
        
        return [_serialize_product(product) for product in products]
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )


# Admin Product Management Endpoints


@router.post("/admin/products", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_product_admin(
    product_data: ProductCreate,
    current_user = Depends(require_any_role(["ops_admin", "admin"]))
):
    """Create a new product (Ops Admin only)"""
    try:
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        # Create product document with is_active=True by default
        product_dict = product_data.dict()
        product_dict["is_active"] = True
        product_dict["created_at"] = datetime.utcnow()
        product_dict["customization_options"] = _normalize_customization_options(
            product_dict.get("customization_options")
        )
        
        # Insert product
        result = await products_collection.insert_one(product_dict)
        
        # Get created product
        created_product = await products_collection.find_one({"_id": result.inserted_id})
        
        return _serialize_product(created_product)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )


@router.put("/admin/products/{product_id}", response_model=Dict[str, Any])
async def update_product_admin(
    product_id: str,
    product_data: ProductCreate,
    current_user = Depends(require_any_role(["ops_admin", "admin"]))
):
    """Update a product (Ops Admin only)"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product ID"
            )
        
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        # Check if product exists
        existing_product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Update product
        update_data = product_data.dict()
        update_data["is_active"] = True  # Ensure product remains active
        update_data["customization_options"] = _normalize_customization_options(
            update_data.get("customization_options")
        )
        
        result = await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product update failed"
            )
        
        # Get updated product
        updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
        
        return _serialize_product(updated_product)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update product: {str(e)}"
        )


@router.delete("/admin/products/{product_id}", response_model=Dict[str, Any])
async def delete_product_admin(
    product_id: str,
    current_user = Depends(require_any_role(["ops_admin", "admin"]))
):
    """Soft delete a product by setting is_active=False (Ops Admin only)"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product ID"
            )
        
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        # Check if product exists
        existing_product = await products_collection.find_one({"_id": ObjectId(product_id)})
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Soft delete - set is_active to False
        result = await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"is_active": False}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product deletion failed"
            )
        
        return {
            "message": "Product deleted successfully",
            "product_id": product_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )