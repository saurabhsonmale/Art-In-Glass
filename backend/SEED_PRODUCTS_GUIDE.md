# Seed Products Guide

This guide explains how to populate your MongoDB Atlas database with sample resin art products.

## Prerequisites

1. **MongoDB Atlas** database is set up and running
2. **Environment variables** are configured in `backend/.env`:
   - `MONGODB_URL` - Your MongoDB Atlas connection string
   - `DATABASE_NAME` - Your database name (default: `art_in_glass_db`)

## Running the Seed Script

### Step 1: Navigate to the backend directory
```bash
cd backend
```

### Step 2: Activate your virtual environment (if using one)
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### Step 3: Install dependencies (if not already installed)
```bash
pip install -r requirements.txt
```

### Step 4: Run the seed script
```bash
python seed_products.py
```

## What the Script Does

The seed script will:

1. **Connect** to your MongoDB Atlas database
2. **Check** if products already exist in the database
3. **Prompt** you to clear existing products if they exist (optional)
4. **Insert** 6 sample resin art products with:
   - High-quality Unsplash image URLs
   - Realistic product descriptions
   - Proper categorization (Keychains, Tables, Frames, Clocks)
   - Customization options
   - Ratings and estimated crafting time

## Sample Products

The script seeds the following products:

1. **Ocean Wave Resin Keychain** - ₹499 (Keychains)
2. **Galaxy Epoxy Resin Table** - ₹45,000 (Tables)
3. **Floral Resin Photo Frame** - ₹1,299 (Frames)
4. **Geode Crystal Resin Clock** - ₹2,499 (Clocks)
5. **Personalized Name Keychain** - ₹399 (Keychains)
6. **Resin River Coffee Table** - ₹28,000 (Tables)

## Product Features

Each product includes:
- **Multiple images** from Unsplash
- **Customization options** (text input, color shades, photo upload)
- **Ratings** (4.5 - 4.9 stars)
- **Estimated crafting time** (2-14 days)
- **Category tags** for easy filtering

## Verification

After running the script, you can verify the products were added:

### Option 1: Check MongoDB Atlas
- Log into your MongoDB Atlas dashboard
- Navigate to your database
- View the `products` collection

### Option 2: Use the API
```bash
# Start your backend server
uvicorn main:app --reload

# Visit in browser or use curl
curl http://localhost:8000/api/v1/products
```

### Option 3: Check the Frontend
- Start your Expo app
- The HomeScreen will display all seeded products
- You should see 6 products in a 2-column grid

## Troubleshooting

### Error: "MONGODB_URL not found"
- Ensure your `backend/.env` file exists
- Check that `MONGODB_URL` is set correctly

### Error: "Connection refused"
- Verify your MongoDB Atlas cluster is running
- Check that your IP address is whitelisted in MongoDB Atlas
- Ensure the connection string is correct

### Products not showing in frontend
- Make sure the backend server is running on `http://localhost:8000`
- Check the browser console for API errors
- Verify the products API returns data: `http://localhost:8000/api/v1/products`

## Re-seeding Data

If you need to clear and re-seed the products:

```bash
python seed_products.py
```

When prompted:
```
⚠️  Database already has 6 products.
Do you want to clear existing products and reseed? (y/N): y
```

Type `y` and press Enter to clear and re-seed.

## Next Steps

After seeding products:

1. **Start the backend**: `uvicorn main:app --reload`
2. **Start the frontend**: `npm start` (in the frontend directory)
3. **Browse products** in the app
4. **Test the complete flow**: Browse → Add to Cart → Checkout → Place Order

## Support

If you encounter any issues:
- Check the backend logs for error messages
- Verify MongoDB Atlas connection
- Ensure all dependencies are installed