# Art In Glass - Custom Resin Art Business

A complete end-to-end mobile app system for a Custom Resin Art Business built with Expo React Native (Frontend) and Python FastAPI (Backend) with MongoDB Atlas.

## 🎨 Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT (PyJWT)
- **Password Hashing**: Passlib/Bcrypt
- **Async Driver**: Motor

### Frontend
- **Framework**: Expo Go (React Native)
- **Navigation**: React Navigation (Stack & Tab)
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Icons**: Ionicons

## 📁 Project Structure

```
Art-In-Glass/
├── backend/
│   ├── .env                    # Environment variables (not in git)
│   ├── .env.example            # Environment template
│   ├── requirements.txt        # Python dependencies
│   ├── config.py               # Configuration settings
│   ├── database.py             # MongoDB connection
│   ├── models.py               # Pydantic models
│   ├── auth.py                 # Authentication utilities
│   ├── main.py                 # FastAPI app entry point
│   └── routers/
│       ├── __init__.py
│       ├── auth.py             # Auth endpoints
│       ├── products.py         # Product endpoints
│       └── orders.py           # Order endpoints
│
└── frontend/
    ├── package.json
    ├── app.json                # Expo configuration
    ├── babel.config.js
    ├── App.js                  # Main app component
    └── src/
        ├── context/
        │   └── AuthContext.js  # Authentication context
        └── screens/
            ├── auth/
            │   ├── LoginScreen.js
            │   └── RegisterScreen.js
            ├── HomeScreen.js
            ├── ProductDetailScreen.js
            ├── CheckoutScreen.js
            ├── OrderHistoryScreen.js
            └── OrderTrackingScreen.js
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB Atlas account
- Expo CLI
- Expo Go app (for mobile testing)

---

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your MongoDB Atlas credentials
# MONGODB_URI=your_mongodb_atlas_uri
# JWT_SECRET_KEY=your_secret_key
```

### 5. Run the server
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### 6. Access API documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Frontend Setup

### 1. Navigate to frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Update API URL (if needed)
In `frontend/src/context/AuthContext.js`, update the `API_BASE_URL`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/v1';
```

**Note**: For physical device testing, replace `localhost` with your computer's local IP address.

### 4. Start the Expo development server
```bash
npm start
```

### 5. Run on device/simulator
- **iOS**: Press `i` in terminal or scan QR code with Expo Go app
- **Android**: Press `a` in terminal or scan QR code with Expo Go app
- **Web**: Press `w` in terminal

---

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user (returns JWT)
- `GET /api/v1/auth/me` - Get current user info

### Products
- `GET /api/v1/products` - Fetch all products
- `GET /api/v1/products/{id}` - Get single product
- `GET /api/v1/products/category/{category}` - Get products by category
- `POST /api/v1/products` - Create product (admin)

### Orders
- `POST /api/v1/orders` - Place new order (protected)
- `GET /api/v1/orders/my-orders` - Get user's orders (protected)
- `GET /api/v1/orders/{order_id}` - Get order details (protected)
- `GET /api/v1/orders/{order_id}/track` - Track order (protected)

---

## 📱 App Features

### Authentication Flow
- ✅ User Registration with validation
- ✅ User Login with JWT token
- ✅ Persistent login with AsyncStorage
- ✅ Logout functionality

### Customer Features
- ✅ Browse products by categories (Keychains, Tables, Frames, Clocks)
- ✅ View product details with customization options
- ✅ Custom text/quote input for personalized items
- ✅ Color selection for custom products
- ✅ Quantity selection
- ✅ Add to cart / Buy now
- ✅ Checkout with shipping address
- ✅ Place orders
- ✅ View order history with status badges
- ✅ Track orders with visual timeline
- ✅ View courier details when dispatched

### UI/UX
- ✅ Modern, clean design suitable for creative craft brand
- ✅ Purple theme color (#8B5CF6)
- ✅ Smooth animations and transitions
- ✅ Responsive layout
- ✅ Loading states
- ✅ Error handling with user-friendly messages

---

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API endpoints
- Token expiration
- CORS configuration
- Input validation

---

## 🎨 Order Status Flow

```
PENDING → ACCEPTED → IN_PRODUCTION → PACKED → DISPATCHED → DELIVERED
```

- **PENDING**: Order placed successfully
- **ACCEPTED**: Order accepted by seller
- **IN_PRODUCTION**: Resin curing and crafting in progress
- **PACKED**: Order packed and ready to ship
- **DISPATCHED**: Order dispatched with courier tracking
- **DELIVERED**: Order delivered successfully

---

## 🛠️ Development

### Backend Development
```bash
cd backend
# Server auto-reloads on changes in development mode
python main.py
```

### Frontend Development
```bash
cd frontend
npm start
```

---

## 📦 Deployment

### Backend Deployment
- Deploy to services like:
  - Railway
  - Render
  - AWS EC2
  - DigitalOcean
  - Heroku

### Frontend Deployment
- Build for production:
  ```bash
  cd frontend
  expo build:android  # For APK
  expo build:ios      # For IPA
  ```
- Or publish to Expo

---

## 🔧 Configuration

### MongoDB Atlas Setup
1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Update `MONGODB_URI` in `backend/.env`
4. Create database named `resin_art_db`

### Environment Variables
See `backend/.env.example` for all required variables.

---

## 📝 Notes

- The backend uses MongoDB with async operations (Motor)
- JWT tokens expire after 30 minutes (configurable)
- All order endpoints require authentication
- Images are stored as URLs (integrate with Cloudinary/S3 for production)
- The app is optimized for portrait mode

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Built with ❤️ for Art In Glass - Custom Resin Art Business

---

## 📞 Support

For support, email support@artinglass.com or create an issue in the repository.