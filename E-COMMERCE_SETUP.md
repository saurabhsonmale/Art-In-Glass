# Art In Glass - E-Commerce Implementation Guide

This guide covers the complete e-commerce workflow implementation for the Art In Glass app.

## 🎯 Implementation Summary

### Backend Enhancements
✅ **Updated Product Models** - Added `customization_options`, `rating`, and `estimated_days` fields
✅ **Enhanced Products API** - All endpoints now return complete product data
✅ **Updated Order Models** - Added `payment_method` support
✅ **Enhanced Orders API** - Handles payment method and returns complete order data
✅ **Seed Script** - `seed_products.py` populates 6 realistic resin art products

### Frontend Features
✅ **CartContext** - Global state management for cart operations
✅ **HomeScreen** - Product grid with category filtering, ratings, quick buy
✅ **ProductDetailScreen** - Image carousel, customization options, quantity selector
✅ **CartScreen** - Cart management with delivery calculation
✅ **CheckoutScreen** - Address form, payment method selection, order placement
✅ **Navigation** - Updated with Cart tab and proper route connections

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- MongoDB Atlas account (or local MongoDB)
- Expo CLI installed globally (`npm install -g expo-cli`)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env file with your MongoDB Atlas connection string
# Required variables:
# - MONGODB_URL
# - DATABASE_NAME
# - SECRET_KEY

# Seed the database with sample products
python seed_products.py

# Start the backend server
uvicorn main:app --reload
```

The backend will run at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Install additional dependencies (if not already installed)
npm install expo-image-picker

# Start the Expo development server
npm start
```

The app will be available at `http://localhost:8081`

## 📱 Complete E-Commerce Flow

### User Journey

1. **Browse Products** (HomeScreen)
   - View all products in a 2-column grid
   - Filter by category (Keychains, Tables, Frames, Clocks)
   - See ratings, prices, and customization badges
   - Quick buy or navigate to product details

2. **View Product Details** (ProductDetailScreen)
   - Image carousel with indicator dots
   - Product title, price, category, rating
   - "Handcrafted in X Days" badge
   - Customization options:
     - Text input for custom names/quotes
     - Color palette selector
     - Photo upload for resin embedding
   - Quantity selector
   - Add to Cart or Buy Now

3. **Manage Cart** (CartScreen)
   - View all cart items with customization badges
   - Adjust quantities
   - Remove items
   - See order summary with delivery charges
   - Free delivery on orders above ₹2000

4. **Checkout** (CheckoutScreen)
   - Order summary
   - Shipping address form with validation
   - Payment method selection (COD/UPI/Card)
   - Place order button

5. **Order Confirmation**
   - Success alert with order details
   - Option to track order or view all orders

## 🗂️ Project Structure

```
Art-In-Glass/
├── backend/
│   ├── routers/
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── products.py      # Product CRUD operations
│   │   └── orders.py        # Order management
│   ├── models.py            # Pydantic models (updated)
│   ├── database.py          # MongoDB connection
│   ├── seed_products.py     # Sample data seeder
│   ├── main.py              # FastAPI app
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.js    # Authentication state
│   │   │   └── CartContext.js    # Cart state management
│   │   └── screens/
│   │       ├── HomeScreen.js           # Product listing
│   │       ├── ProductDetailScreen.js  # Product details
│   │       ├── CartScreen.js           # Cart management
│   │       ├── CheckoutScreen.js       # Checkout flow
│   │       ├── OrderHistoryScreen.js   # Order list
│   │       └── OrderTrackingScreen.js  # Order tracking
│   ├── App.js               # Navigation setup
│   └── package.json
│
└── E-COMMERCE_SETUP.md      # This file
```

## 🔧 Key Features Implemented

### Backend

#### Product Model Enhancements
```python
class ProductBase(BaseModel):
    # ... existing fields ...
    customization_options: Optional[Dict[str, Any]] = None
    rating: float = 0.0
    estimated_days: int = 3
```

#### Order Model Enhancements
```python
class OrderBase(BaseModel):
    # ... existing fields ...
    payment_method: Optional[str] = "cod"
```

### Frontend

#### CartContext (Global State)
```javascript
// Key functions:
- addToCart(product, quantity, customization)
- removeFromCart(productId, customNotes)
- updateQuantity(productId, quantity, customNotes)
- getCartTotal()
- getCartCount()
- clearCart()
```

#### HomeScreen Features
- 2-column product grid with FlatList
- Category filtering with visual feedback
- Loading spinner while fetching products
- Error handling with Alert notifications
- Heart icon for wishlist (placeholder)
- Quick buy button
- Cart badge with item count

#### ProductDetailScreen Features
- Image carousel with swipe navigation
- Indicator dots for multiple images
- Rating stars display
- Customization section (conditional):
  - Text input for custom messages
  - Color palette selector
  - Image picker for photo upload
- Quantity selector (+/-)
- Sticky bottom action bar

#### CartScreen Features
- Empty cart state with "Shop Now" button
- Cart items with images and customization badges
- Quantity controls
- Remove item with confirmation
- Order summary with delivery calculation
- Free delivery threshold (₹2000)

#### CheckoutScreen Features
- Order summary
- Address form with validation
- Payment method selection (COD/UPI/Card)
- Form error highlighting
- Loading state during order placement
- Success alert with navigation options

## 🎨 Design System

### Colors
- **Primary Purple**: `#8B5CF6`
- **Success Green**: `#10B981`
- **Error Red**: `#EF4444`
- **Warning Yellow**: `#F59E0B`
- **Background**: `#F3F4F6`
- **White**: `#FFFFFF`
- **Text Dark**: `#1F2937`
- **Text Gray**: `#6B7280`

### Typography
- **Headers**: 20-24px, Bold
- **Body**: 14-16px, Regular
- **Buttons**: 16px, Bold
- **Small**: 10-12px, Medium

### Components
- **Cards**: 16px border radius, subtle shadow
- **Buttons**: 12px border radius, 56px height
- **Inputs**: 12px border radius, 56px height
- **Shadows**: elevation 3-5 for depth

## 🔐 Authentication Flow

All order operations require authentication:
1. User logs in via AuthContext
2. Token stored in context
3. API calls include `Authorization: Bearer <token>` header
4. Backend validates token via `get_current_active_user` dependency

## 📦 API Endpoints

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/{id}` - Get single product
- `GET /api/v1/products/category/{category}` - Filter by category
- `POST /api/v1/products` - Create product (admin)

### Orders
- `POST /api/v1/orders` - Create new order (authenticated)
- `GET /api/v1/orders/my-orders` - Get user's orders (authenticated)
- `GET /api/v1/orders/{id}` - Get order details (authenticated)
- `GET /api/v1/orders/{id}/track` - Track order (authenticated)

## 🧪 Testing the Application

### 1. Seed the Database
```bash
cd backend
python seed_products.py
```

### 2. Start Backend
```bash
uvicorn main:app --reload
```

### 3. Start Frontend
```bash
cd frontend
npm start
```

### 4. Test Flow
1. Open app in Expo Go (mobile) or browser
2. Register/Login
3. Browse products on HomeScreen
4. Click a product to view details
5. Select customization options
6. Add to cart or Buy Now
7. View cart and adjust quantities
8. Proceed to checkout
9. Fill shipping address
10. Select payment method
11. Place order
12. View order confirmation

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Error**
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas
- Verify connection string in `.env`

**Products not seeding**
- Ensure MongoDB is accessible
- Check database name in `.env`
- Verify collection permissions

### Frontend Issues

**Image picker not working**
- Check `app.json` permissions
- Rebuild app after permission changes
- Grant permissions when prompted

**Cart not persisting**
- CartContext is in-memory only
- Cart resets on app restart
- Consider AsyncStorage for persistence

**API calls failing**
- Verify backend is running on port 8000
- Check CORS settings in backend
- Verify API_BASE_URL in frontend

## 📝 Notes

- **Cart Persistence**: Currently in-memory only. For production, integrate AsyncStorage or backend cart.
- **Image Uploads**: Images are stored as local URIs. For production, implement cloud storage (S3, Cloudinary).
- **Payment Processing**: Payment methods are mock only. Integrate Razorpay/Stripe for real payments.
- **Order Tracking**: Mock tracking. Integrate with courier APIs for real tracking.
- **Wishlist**: Heart icon is a placeholder. Implement wishlist feature as needed.

## 🚀 Next Steps for Production

1. **Add Payment Gateway** - Integrate Razorpay or Stripe
2. **Implement Image Upload** - Cloud storage for custom images
3. **Add Push Notifications** - Order status updates
4. **Implement Reviews** - Product review system
5. **Add Search** - Product search functionality
6. **Implement Filters** - Price range, rating filters
7. **Add Address Book** - Multiple shipping addresses
8. **Implement Coupons** - Discount codes
9. **Add Analytics** - Track user behavior
10. **Performance Optimization** - Image caching, lazy loading

## 📞 Support

For issues or questions:
- Check backend logs for API errors
- Check Expo developer tools for frontend errors
- Verify MongoDB Atlas dashboard for database issues
- Review this guide for common solutions

---

**Implementation Status**: ✅ Complete and ready for testing
**Last Updated**: 2026-01-26