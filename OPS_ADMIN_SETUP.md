# Ops Executive Panel - Setup & Usage Guide

## Overview
The Ops Executive Panel allows administrators to manage products and orders for the Art In Glass application. When an Ops Admin adds a product, it instantly appears in the Customer App feed.

## Features Implemented

### Backend (FastAPI + MongoDB)
1. **Admin User Seeding**: Auto-creates Ops Admin account on app startup
   - Email: `ops@artinglass.com`
   - Password: `AdminPassword123!`
   - Role: `ops_admin`

2. **Admin Product APIs** (Protected):
   - `POST /api/v1/admin/products` - Create new product
   - `PUT /api/v1/admin/products/{product_id}` - Update product
   - `DELETE /api/v1/admin/products/{product_id}` - Soft delete product

3. **Enhanced Public APIs**:
   - `GET /api/v1/products` - Fetches only active products
   - `GET /api/v1/products/{product_id}` - Fetches active product details
   - `GET /api/v1/products/category/{category}` - Fetches active products by category

4. **Authentication**:
   - Login response now includes `role` field
   - Admin-only endpoints require JWT with `ops_admin` or `admin` role
   - Returns HTTP 403 Forbidden for unauthorized access

### Frontend (Expo React Native)

#### Admin Panel Screens
1. **Orders Queue** (`AdminOrdersScreen.js`):
   - View all customer orders
   - Update order status (PENDING → CONFIRMED → PROCESSING → SHIPPED)
   - Pull-to-refresh functionality
   - Color-coded status badges

2. **Add Product** (`AddProductScreen.js`):
   - Form fields: Title, Description, Price, Category, Duration
   - Image upload using expo-image-picker
   - Customization toggles (Custom Name/Text, Require Photo)
   - Color selection modal
   - Success alert and auto-navigation to catalog

3. **Manage Catalog** (`ManageCatalogScreen.js`):
   - View all products with details
   - Delete products (soft delete)
   - Pull-to-refresh functionality
   - Product status indicators (Active/Inactive)

4. **Admin Profile** (`AdminProfileScreen.js`):
   - User information display
   - Logout functionality
   - Settings menu

#### Customer App Enhancements
1. **Live Product Sync**:
   - `useFocusEffect` re-fetches products when screen comes into focus
   - Pull-to-refresh on HomeScreen
   - New products appear instantly without app restart

2. **Role-Based Navigation**:
   - Ops Admin → AdminNavigator (Orders, Add Product, Catalog, Profile)
   - Customer → CustomerNavigator (Home, Cart, Orders, Profile)
   - Completely separate navigation flows

## Setup Instructions

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   # Copy .env.example to .env and update values
   cp .env.example .env
   ```
   
   Required environment variables:
   - `MONGODB_URI`: MongoDB connection string
   - `DATABASE_NAME`: Database name (e.g., "art_in_glass")
   - `JWT_SECRET_KEY`: Secret key for JWT tokens
   - `JWT_ALGORITHM`: JWT algorithm (default: HS256)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

3. **Start Backend Server**:
   ```bash
   python main.py
   ```
   
   The admin user will be auto-created on first run. Look for:
   ```
   ✓ Ops Admin user created successfully!
     Email: ops@artinglass.com
     Password: AdminPassword123!
     Role: ops_admin
   ```

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Required Packages** (add to package.json if missing):
   ```json
   {
     "expo-image-picker": "~14.0.2",
     "@react-navigation/native": "^6.1.9",
     "@react-navigation/native-stack": "^6.9.17",
     "@react-navigation/bottom-tabs": "^6.5.11",
     "@react-native-async-storage/async-storage": "1.19.3"
   }
   ```

3. **Start Frontend**:
   ```bash
   npm start
   ```

## Usage Guide

### For Ops Admin

1. **Login**:
   - Use credentials: `ops@artinglass.com` / `AdminPassword123!`
   - The app will automatically redirect to Admin Panel

2. **Add Product**:
   - Navigate to "Add Product" tab
   - Fill in product details:
     - Title, Description, Base Price (₹)
     - Select Category (Keychains, Tables, Frames, Clocks)
     - Set Crafting Duration (days)
     - Upload product images
     - Enable customization options if needed
     - Select available colors
   - Tap "Add Product to Catalog"
   - Product instantly appears in Customer App!

3. **Manage Catalog**:
   - View all products in "Manage Catalog" tab
   - See product status (Active/Inactive)
   - Delete products if needed
   - Pull-to-refresh to update list

4. **Process Orders**:
   - View incoming orders in "Orders Queue" tab
   - Update order status through workflow:
     - PENDING → CONFIRMED → PROCESSING → SHIPPED
   - Pull-to-refresh to see new orders

### For Customers

1. **Browse Products**:
   - Products are automatically synced
   - Pull-to-refresh to see latest products
   - Filter by category
   - New products appear instantly when added by Ops Admin

2. **No Changes Required**:
   - Customer experience remains unchanged
   - All existing features work as before
   - Products added by Ops Admin are immediately visible

## API Documentation

### Admin Endpoints (Require Authentication)

#### Create Product
```http
POST /api/v1/admin/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Custom Name Keychain",
  "description": "Beautiful resin keychain with custom name",
  "base_price": 299,
  "category": "Keychains",
  "images": ["https://example.com/image1.jpg"],
  "is_customizable": true,
  "estimated_days": 3
}
```

#### Update Product
```http
PUT /api/v1/admin/products/{product_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Product Name",
  "base_price": 349
}
```

#### Delete Product
```http
DELETE /api/v1/admin/products/{product_id}
Authorization: Bearer {token}
```

### Public Endpoints (No Authentication Required)

#### Get All Active Products
```http
GET /api/v1/products
```

#### Get Product by ID
```http
GET /api/v1/products/{product_id}
```

#### Get Products by Category
```http
GET /api/v1/products/category/Keychains
```

## Security Features

1. **Role-Based Access Control**:
   - Admin endpoints require `ops_admin` or `admin` role
   - JWT tokens validated on every request
   - Returns 403 Forbidden for unauthorized access

2. **Password Security**:
   - Passwords hashed using bcrypt
   - Never stored in plain text

3. **Product Soft Delete**:
   - Products are never permanently deleted
   - `is_active` flag controls visibility
   - Can be re-activated if needed

## Troubleshooting

### Admin User Not Created
- Check MongoDB connection
- Verify `seed_admin.py` is imported in `database.py`
- Check console logs for errors

### Products Not Appearing in Customer App
- Ensure `is_active: true` is set (default for new products)
- Verify customer app has pull-to-refresh or navigate away and back
- Check network connectivity

### Authentication Issues
- Verify JWT secret key matches in .env
- Check token expiration time
- Ensure Authorization header is properly formatted

## Testing Checklist

- [ ] Admin user auto-created on backend startup
- [ ] Admin can login with ops@artinglass.com / AdminPassword123!
- [ ] Admin sees Admin Panel (not Customer App)
- [ ] Admin can add new product
- [ ] New product appears in Customer App immediately
- [ ] Customer can see new product without app restart
- [ ] Pull-to-refresh works on HomeScreen
- [ ] Pull-to-refresh works on Admin Orders screen
- [ ] Admin can update order status
- [ ] Admin can delete products
- [ ] Customer cannot access admin endpoints (403 Forbidden)
- [ ] Existing customer features work unchanged

## Notes

- **Default Admin Credentials**: Change after first login!
- **Product Images**: Currently stored as URIs (local or URLs)
- **Live Sync**: Uses `useFocusEffect` for real-time updates
- **Soft Delete**: Deleted products can be restored by updating `is_active` to `true`

## Support

For issues or questions, contact: support@artinglass.com