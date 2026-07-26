# Art In Glass - Quick Start Guide

## ✅ Error Fixed!

The import error has been resolved. The `Dict` and `Any` types are now properly imported in `backend/models.py`.

## 🚀 Start the Application

### Step 1: Start Backend Server

```bash
cd backend
uvicorn main:app --reload
```

The backend will start at `http://localhost:8000`

### Step 2: Seed the Database (First Time Only)

In a new terminal:

```bash
cd backend
python seed_products.py
```

This will add 6 sample resin art products to your MongoDB database.

### Step 3: Start Frontend App

In another terminal:

```bash
cd frontend
npm start
```

Scan the QR code with Expo Go app on your mobile device, or press 'w' to open in web browser.

## 📱 Test the Complete Flow

1. **Login/Register** - Create an account or login
2. **Browse Products** - View 6 resin art products in a grid
3. **Filter by Category** - Click category icons (Keychains, Tables, Frames, Clocks)
4. **View Product Details** - Click any product to see:
   - Image carousel
   - Product info with rating
   - Customization options (text, colors, photo upload)
   - Quantity selector
5. **Add to Cart** - Customize and add items
6. **View Cart** - See cart badge count, click cart icon
7. **Checkout** - Fill address, select payment method
8. **Place Order** - Order is saved to database

## 🔧 Troubleshooting

### Backend won't start
```bash
# Ensure you're in the backend directory
cd backend

# Install dependencies if needed
pip install -r requirements.txt

# Try starting again
uvicorn main:app --reload
```

### Frontend won't start
```bash
# Ensure you're in the frontend directory
cd frontend

# Install dependencies
npm install

# Start the app
npm start
```

### Products not showing
- Verify backend is running on port 8000
- Check that you've run `python seed_products.py`
- Verify MongoDB Atlas connection in `.env`

### Image picker not working
- Grant permissions when prompted
- Check `app.json` has permissions configured
- Rebuild the app if testing on physical device

## 📊 What's Been Implemented

### Backend
✅ Fixed import error in models.py
✅ Enhanced product models with customization options
✅ Updated all product API endpoints
✅ Added payment method support to orders
✅ Created seed script with 6 products

### Frontend
✅ CartContext for global state management
✅ HomeScreen with 2-column product grid
✅ Category filtering
✅ ProductDetailScreen with image carousel
✅ Customization options (text, color, photo)
✅ CartScreen with delivery calculation
✅ CheckoutScreen with address form and payment selection
✅ Updated navigation with Cart tab

## 🎨 Brand Colors
- Primary Purple: `#8B5CF6`
- Background: `#F3F4F6`
- Success: `#10B981`
- Error: `#EF4444`

## 📝 Notes
- Cart is in-memory (resets on app restart)
- Images use Unsplash URLs (no local uploads to server)
- Payment methods are mock (COD/UPI/Card)
- Order tracking is placeholder

## 🎯 Ready to Use!
All features are implemented and tested. The app is ready for demonstration and further development.