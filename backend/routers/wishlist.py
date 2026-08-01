from fastapi import APIRouter, HTTPException, status, Depends
from database import get_database, WISHLISTS_COLLECTION, PRODUCTS_COLLECTION
from models import WishlistUpdate
from auth import get_current_active_user
from bson import ObjectId
from typing import Dict, Any, List
from datetime import datetime

router = APIRouter(prefix="/api/v1/wishlist", tags=["wishlist"])


def _serialize_product(product: dict) -> Dict[str, Any]:
    return {
        "id": str(product["_id"]),
        "title": product.get("title", ""),
        "description": product.get("description", ""),
        "base_price": product.get("base_price", 0),
        "category": product.get("category", ""),
        "images": product.get("images", []),
        "is_customizable": product.get("is_customizable", False),
        "rating": product.get("rating", 0.0),
        "estimated_days": product.get("estimated_days", 3),
        "is_active": product.get("is_active", True),
    }


async def _get_or_create_wishlist(user_id: str) -> dict:
    db = get_database()
    wishlists = db[WISHLISTS_COLLECTION]
    doc = await wishlists.find_one({"user_id": user_id})
    if doc:
        return doc
    now = datetime.utcnow()
    new_doc = {
        "user_id": user_id,
        "product_ids": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await wishlists.insert_one(new_doc)
    new_doc["_id"] = result.inserted_id
    return new_doc


@router.get("", response_model=Dict[str, Any])
async def get_wishlist(current_user=Depends(get_current_active_user)):
    """Get current user's wishlist products."""
    try:
        db = get_database()
        wishlist = await _get_or_create_wishlist(current_user.user_id)
        product_ids = wishlist.get("product_ids") or []

        products: List[Dict[str, Any]] = []
        if product_ids:
            object_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]
            if object_ids:
                cursor = db[PRODUCTS_COLLECTION].find({
                    "_id": {"$in": object_ids},
                    "is_active": {"$ne": False},
                })
                found = await cursor.to_list(length=None)
                by_id = {str(p["_id"]): p for p in found}
                # Preserve wishlist order
                for pid in product_ids:
                    if pid in by_id:
                        products.append(_serialize_product(by_id[pid]))

        return {
            "product_ids": [p["id"] for p in products],
            "products": products,
            "count": len(products),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch wishlist: {str(e)}",
        )


@router.post("", response_model=Dict[str, Any])
async def add_to_wishlist(
    payload: WishlistUpdate,
    current_user=Depends(get_current_active_user),
):
    """Add a product to wishlist."""
    try:
        product_id = (payload.product_id or "").strip()
        if not ObjectId.is_valid(product_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid product ID",
            )

        db = get_database()
        product = await db[PRODUCTS_COLLECTION].find_one({
            "_id": ObjectId(product_id),
            "is_active": {"$ne": False},
        })
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        wishlist = await _get_or_create_wishlist(current_user.user_id)
        product_ids = list(wishlist.get("product_ids") or [])
        if product_id not in product_ids:
            product_ids.append(product_id)
            await db[WISHLISTS_COLLECTION].update_one(
                {"_id": wishlist["_id"]},
                {"$set": {"product_ids": product_ids, "updated_at": datetime.utcnow()}},
            )

        return {
            "message": "Added to wishlist",
            "product_ids": product_ids,
            "count": len(product_ids),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add to wishlist: {str(e)}",
        )


@router.delete("/{product_id}", response_model=Dict[str, Any])
async def remove_from_wishlist(
    product_id: str,
    current_user=Depends(get_current_active_user),
):
    """Remove a product from wishlist."""
    try:
        db = get_database()
        wishlist = await _get_or_create_wishlist(current_user.user_id)
        product_ids = [pid for pid in (wishlist.get("product_ids") or []) if pid != product_id]
        await db[WISHLISTS_COLLECTION].update_one(
            {"_id": wishlist["_id"]},
            {"$set": {"product_ids": product_ids, "updated_at": datetime.utcnow()}},
        )
        return {
            "message": "Removed from wishlist",
            "product_ids": product_ids,
            "count": len(product_ids),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove from wishlist: {str(e)}",
        )
