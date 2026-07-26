from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database, PRODUCTS_COLLECTION
from models import ProductCreate, ProductResponse
from auth import get_current_active_user, require_any_role
from bson import ObjectId
from typing import List, Dict, Any

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_all_products():
    """Fetch all active resin art products"""
    try:
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        # Only fetch active products for customers
        products_cursor = products_collection.find({"is_active": True})
        products = await products_cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        result = []
        for product in products:
            result.append({
                "id": str(product["_id"]),
                "title": product["title"],
                "description": product["description"],
                "base_price": product["base_price"],
                "category": product["category"],
                "images": product.get("images", []),
                "is_customizable": product.get("is_customizable", False),
                "customization_options": product.get("customization_options", {}),
                "rating": product.get("rating", 0.0),
                "estimated_days": product.get("estimated_days", 3),
                "is_active": product.get("is_active", True),
                "created_at": product["created_at"]
            })
        
        return result
    
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
        
        product = await products_collection.find_one({"_id": ObjectId(product_id), "is_active": True})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return {
            "id": str(product["_id"]),
            "title": product["title"],
            "description": product["description"],
            "base_price": product["base_price"],
            "category": product["category"],
            "images": product.get("images", []),
            "is_customizable": product.get("is_customizable", False),
            "customization_options": product.get("customization_options", {}),
            "rating": product.get("rating", 0.0),
            "estimated_days": product.get("estimated_days", 3),
            "is_active": product.get("is_active", True),
            "created_at": product["created_at"]
        }
    
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
        
        # Only fetch active products
        products_cursor = products_collection.find({"category": category, "is_active": True})
        products = await products_cursor.to_list(length=None)
        
        # Convert ObjectId to string for JSON serialization
        result = []
        for product in products:
            result.append({
                "id": str(product["_id"]),
                "title": product["title"],
                "description": product["description"],
                "base_price": product["base_price"],
                "category": product["category"],
                "images": product.get("images", []),
                "is_customizable": product.get("is_customizable", False),
                "customization_options": product.get("customization_options", {}),
                "rating": product.get("rating", 0.0),
                "estimated_days": product.get("estimated_days", 3),
                "is_active": product.get("is_active", True),
                "created_at": product["created_at"]
            })
        
        return result
    
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
        product_dict["created_at"] = None  # Will use MongoDB default
        
        # Insert product
        result = await products_collection.insert_one(product_dict)
        
        # Get created product
        created_product = await products_collection.find_one({"_id": result.inserted_id})
        
        return {
            "id": str(created_product["_id"]),
            "title": created_product["title"],
            "description": created_product["description"],
            "base_price": created_product["base_price"],
            "category": created_product["category"],
            "images": created_product.get("images", []),
            "is_customizable": created_product.get("is_customizable", False),
            "customization_options": created_product.get("customization_options", {}),
            "rating": created_product.get("rating", 0.0),
            "estimated_days": created_product.get("estimated_days", 3),
            "is_active": created_product.get("is_active", True),
            "created_at": created_product["created_at"]
        }
    
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
        
        result = await products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product update failed"
            )
        
        # Get updated product
        updated_product = await products_collection.find_one({"_id": ObjectId(product_id)})
        
        return {
            "id": str(updated_product["_id"]),
            "title": updated_product["title"],
            "description": updated_product["description"],
            "base_price": updated_product["base_price"],
            "category": updated_product["category"],
            "images": updated_product.get("images", []),
            "is_customizable": updated_product.get("is_customizable", False),
            "customization_options": updated_product.get("customization_options", {}),
            "rating": updated_product.get("rating", 0.0),
            "estimated_days": updated_product.get("estimated_days", 3),
            "is_active": updated_product.get("is_active", True),
            "created_at": updated_product["created_at"]
        }
    
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