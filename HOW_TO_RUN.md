# How to Run the Art In Glass App

## 📋 Prerequisites

Before you begin, make sure you have installed:
- **Python 3.8+** - [Download here](https://www.python.org/downloads/)
- **Node.js 16+** - [Download here](https://nodejs.org/)
- **MongoDB Atlas Account** - [Sign up free](https://www.mongodb.com/atlas/database)
- **Expo Go App** on your phone (iOS/Android) - [Download here](https://expo.dev/client)

---

## 🚀 Step-by-Step Setup

### STEP 1: Setup MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database) and create a free account
2. Create a new cluster (choose FREE tier)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
5. **Important**: Replace `password` with your actual database password

---

### STEP 2: Setup Backend (Python FastAPI)

1. **Open terminal/command prompt** and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. **Create a virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   - Open `backend/.env` file
   - Replace the `MONGODB_URI` with your MongoDB Atlas connection string:
     ```
     MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/resin_art_db?retryWrites=true&w=majority
     ```
   - Keep other values as default for development

5. **Start the backend server**:
   ```bash
   python main.py
   ```
   
   ✅ You should see: `Connected to MongoDB: resin_art_db`
   
   The API is now running at: **http://localhost:8000**
   
   - API Documentation: **http://localhost:8000/docs**
   - Alternative Docs: **http://localhost:8000/redoc**

---

### STEP 3: Setup Frontend (Expo React Native)

1. **Open a NEW terminal window** (keep the backend running) and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Update API URL (if needed)**:
   - Open `frontend/src/context/AuthContext.js`
   - Find line 6: `const API_BASE_URL = 'http://localhost:8000/api/v1';`
   - If testing on a physical device, replace `localhost` with your computer's local IP address:
     ```
     const API_BASE_URL = 'http://192.168.1.100:8000/api/v1';
     ```
   - To find your local IP:
     - Windows: Run `ipconfig` in terminal
     - Mac/Linux: Run `ifconfig` in terminal

4. **Start the Expo development server**:
   ```bash
   npm start
   ```
   
   Or use:
   ```bash
   npx expo start
   ```

5. **Run on your device**:
   - **iOS**: Press `i` in terminal or scan QR code with Expo Go app
   - **Android**: Press `a` in terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in terminal (opens in browser)

---

## 📱 Using the App

### 1. Create an Account
- Open the app on your phone
- Click "Sign Up" on the login screen
- Fill in: Full Name, Email, Phone, Password
- Click "Sign Up"

### 2. Login
- Enter your email and password
- Click "Login"

### 3. Browse Products
- View categories: Keychains, Tables, Frames, Clocks
- Scroll through featured products
- Click any product to view details

### 4. Customize & Order
- Select a customizable product
- Enter custom text/quote
- Choose a color
- Select quantity
- Click "Buy Now"

### 5. Checkout
- Fill in shipping address:
  - Street Address
  - City
  - State
  - Pincode
  - Phone Number
- Click "Confirm Order"

### 6. Track Order
- Go to "My Orders" tab
- Click on any order
- View visual timeline of order progress
- See courier details when dispatched

---

## 🧪 Testing the API

You can test the backend API directly using the built-in Swagger UI:

1. Go to **http://localhost:8000/docs**
2. Try the endpoints:
   - `POST /api/v1/auth/register` - Create a test user
   - `POST /api/v1/auth/login` - Login and get token
   - `GET /api/v1/products` - View products
   - `POST /api/v1/orders` - Create an order (use token from login)

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot connect to backend"
**Solution**: 
- Make sure backend is running on port 8000
- If using physical device, ensure phone and computer are on same WiFi network
- Update `API_BASE_URL` in `AuthContext.js` with your computer's IP address

### Issue 2: "MongoDB connection failed"
**Solution**:
- Check your MongoDB Atlas connection string in `.env`
- Ensure your IP address is whitelisted in MongoDB Atlas (Network Access → Add IP Address → 0.0.0.0/0 for testing)
- Verify username and password in connection string

### Issue 3: "Module not found" errors
**Solution**:
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules
npm install
```

### Issue 4: "Expo Go can't scan QR code"
**Solution**:
- Make sure phone and computer are on same network
- Try pressing `w` for web version first
- Or run: `npx expo start --tunnel`

---

## 📊 Project Structure

```
Art-In-Glass/
├── backend/                    # Python FastAPI Backend
│   ├── main.py                 # Start server: python main.py
│   ├── .env                    # Your MongoDB credentials
│   └── routers/                # API endpoints
│
└── frontend/                   # Expo React Native App
    ├── App.js                  # Main app component
    ├── src/
    │   ├── context/            # Auth state management
    │   └── screens/            # All app screens
    └── package.json            # Run: npm install && npm start
```

---

## 🎯 Quick Start (TL;DR)

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Edit .env with your MongoDB URI
python main.py

# Terminal 2 - Frontend (new terminal)
cd frontend
npm install
npm start
# Scan QR code with Expo Go app
```

---

## 📞 Need Help?

- Check the full documentation in `README.md`
- Review API docs at `http://localhost:8000/docs`
- Ensure all prerequisites are installed correctly

---

## 🎉 You're Ready!

Your Custom Resin Art Business app is now running. Start creating beautiful resin art orders! 🎨