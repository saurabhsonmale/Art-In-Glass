from fastapi import APIRouter, HTTPException, status
from database import get_database, PRODUCTS_COLLECTION
from models import ProductCreate, ProductResponse
from bson import ObjectId
from typing import List, Dict, Any

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_all_products():
    """Fetch all resin art products"""
    try:
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        products_cursor = products_collection.find({})
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
    """Get single product details"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product ID"
            )
        
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        product = await products_collection.find_one({"_id": ObjectId(product_id)})
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
            "created_at": product["created_at"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch product: {str(e)}"
        )


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_product(product_data: ProductCreate):
    """Create a new product (Admin only - can be extended with auth)"""
    try:
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        # Create product document
        product_dict = product_data.dict()
        product_dict["created_at"] = None  # Will use default
        
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
            "created_at": created_product["created_at"]
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )


@router.get("/category/{category}", response_model=List[Dict[str, Any]])
async def get_products_by_category(category: str):
    """Fetch products by category"""
    try:
        db = get_database()
        products_collection = db[PRODUCTS_COLLECTION]
        
        products_cursor = products_collection.find({"category": category})
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
                "created_at": product["created_at"]
            })
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )