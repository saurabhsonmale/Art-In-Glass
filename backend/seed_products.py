"""
Seed script to populate MongoDB with sample resin art products
Run this script to add 6 realistic products to the database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Sample products data
SAMPLE_PRODUCTS = [
    {
        "title": "Ocean Wave Resin Keychain",
        "description": "Handcrafted resin keychain featuring mesmerizing ocean waves with embedded glitter and seashells. Perfect gift for beach lovers.",
        "base_price": 499,
        "category": "Keychains",
        "images": [
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=500&q=80",
            "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&q=80"
        ],
        "is_customizable": True,
        "is_active": True,
        "customization_options": {
            "has_text_input": True,
            "text_enabled": True,
            "color_shades": [
                {"id": "1", "name": "Ocean Blue", "value": "#3B82F6"},
                {"id": "2", "name": "Turquoise", "value": "#14B8A6"},
                {"id": "3", "name": "Deep Navy", "value": "#1E3A8A"},
                {"id": "4", "name": "Aqua", "value": "#22D3EE"},
            ],
            "photo_required": False
        },
        "rating": 4.8,
        "estimated_days": 2
    },
    {
        "title": "Galaxy Epoxy Resin Table",
        "description": "Stunning dining table with galaxy-themed epoxy resin river. Features stars, nebula effects, and metallic accents. A true conversation piece.",
        "base_price": 45000,
        "category": "Tables",
        "images": [
            "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80",
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"
        ],
        "is_customizable": True,
        "is_active": True,
        "customization_options": {
            "has_text_input": False,
            "text_enabled": False,
            "color_shades": [
                {"id": "1", "name": "Deep Purple", "value": "#6D28D9"},
                {"id": "2", "name": "Cosmic Blue", "value": "#2563EB"},
                {"id": "3", "name": "Midnight Black", "value": "#111827"},
                {"id": "4", "name": "Starlight Silver", "value": "#9CA3AF"},
            ],
            "photo_required": False
        },
        "rating": 4.9,
        "estimated_days": 14
    },
    {
        "title": "Floral Resin Photo Frame",
        "description": "Elegant photo frame with preserved real flowers embedded in crystal-clear resin. Available in multiple sizes to cherish your memories.",
        "base_price": 1299,
        "category": "Frames",
        "images": [
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&q=80"
        ],
        "is_customizable": True,
        "is_active": True,
        "customization_options": {
            "has_text_input": True,
            "text_enabled": True,
            "color_shades": [
                {"id": "1", "name": "Rose Gold", "value": "#E11D48"},
                {"id": "2", "name": "Gold", "value": "#F59E0B"},
                {"id": "3", "name": "Silver", "value": "#9CA3AF"},
                {"id": "4", "name": "Rose Pink", "value": "#EC4899"},
            ],
            "photo_required": True
        },
        "rating": 4.7,
        "estimated_days": 5
    },
    {
        "title": "Geode Crystal Resin Clock",
        "description": "Wall clock inspired by natural geodes with crystal formations. Each piece is unique with vibrant colors and metallic gold accents.",
        "base_price": 2499,
        "category": "Clocks",
        "images": [
            "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=500&q=80",
            "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=500&q=80"
        ],
        "is_customizable": True,
        "is_active": True,
        "customization_options": {
            "has_text_input": False,
            "text_enabled": False,
            "color_shades": [
                {"id": "1", "name": "Amethyst Purple", "value": "#8B5CF6"},
                {"id": "2", "name": "Citrine Yellow", "value": "#EAB308"},
                {"id": "3", "name": "Emerald Green", "value": "#10B981"},
                {"id": "4", "name": "Ruby Red", "value": "#EF4444"},
            ],
            "photo_required": False
        },
        "rating": 4.6,
        "estimated_days": 4
    },
    {
        "title": "Personalized Name Keychain",
        "description": "Custom resin keychain with your name or special message. Choose from various color combinations and add glitter or dried flowers.",
        "base_price": 399,
        "category": "Keychains",
        "images": [
            "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&q=80",
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80"
        ],
        "is_customizable": True,
        "is_active": True,
        "customization_options": {
            "has_text_input": True,
            "text_enabled": True,
            "color_shades": [
                {"id": "1", "name": "Pink Glitter", "value": "#EC4899"},
                {"id": "2", "name": "Blue Ocean", "value": "#3B82F6"},
                {"id": "3", "name": "Green Forest", "value": "#10B981"},
                {"id": "4", "name": "Purple Dream", "value": "#8B5CF6"},
            ],
            "photo_required": False
        },
        "rating": 4.5,
        "estimated_days": 2
    },
    {
        "title": "Resin River Coffee Table",
        "description": "Live edge wooden coffee table with blue epoxy resin river. Features LED lighting underneath for a magical ambiance.",
        "base_price": 28000,
        "category": "Tables",
        "images": [
            "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80",
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"
        ],
        "is_customizable": True,
        "is_active": True,
        "customization_options": {
            "has_text_input": False,
            "text_enabled": False,
            "color_shades": [
                {"id": "1", "name": "Crystal Blue", "value": "#38BDF8"},
                {"id": "2", "name": "Turquoise", "value": "#14B8A6"},
                {"id": "3", "name": "Deep Ocean", "value": "#1D4ED8"},
                {"id": "4", "name": "Midnight Blue", "value": "#1E3A8A"},
            ],
            "photo_required": False
        },
        "rating": 4.9,
        "estimated_days": 10
    }
]


async def seed_products():
    """Insert sample products into MongoDB"""
    try:
        # Align with API settings (MONGODB_URI / resin_art_db)
        mongodb_url = (
            os.getenv("MONGODB_URI")
            or os.getenv("MONGODB_URL")
            or "mongodb://localhost:27017"
        )
        db_name = os.getenv("DATABASE_NAME", "resin_art_db")
        
        print(f"Connecting to MongoDB at {mongodb_url} (db={db_name})...")
        client = AsyncIOMotorClient(mongodb_url)
        db = client[db_name]
        products_collection = db["products"]
        
        # Check if products already exist
        existing_count = await products_collection.count_documents({})
        if existing_count > 0:
            print(f"⚠️  Database already has {existing_count} products.")
            response = input("Do you want to clear existing products and reseed? (y/N): ")
            if response.lower() != 'y':
                print("❌ Seeding cancelled.")
                return
            
            await products_collection.delete_many({})
            print("🗑️  Cleared existing products.")
        
        # Insert products
        print("🌱 Seeding products...")
        for product_data in SAMPLE_PRODUCTS:
            product = dict(product_data)
            product["is_active"] = product.get("is_active", True)
            product["created_at"] = datetime.utcnow()
            result = await products_collection.insert_one(product)
            print(f"✅ Added: {product['title']} (ID: {result.inserted_id})")
        
        # Verify
        count = await products_collection.count_documents({})
        print(f"\n✨ Successfully seeded {count} products!")
        
        # Display summary
        print("\n📊 Product Summary:")
        for product in SAMPLE_PRODUCTS:
            print(f"  • {product['title']} - ₹{product['base_price']} ({product['category']})")
        
        client.close()
        print("\n✅ Database connection closed.")
        
    except Exception as e:
        print(f"❌ Error seeding products: {str(e)}")
        raise


if __name__ == "__main__":
    print("=" * 60)
    print("🌊 Art In Glass - Product Seeding Script")
    print("=" * 60)
    print()
    asyncio.run(seed_products())