# Art In Glass - Database Setup Guide

This guide will help you set up a new MongoDB database for the Art In Glass project.

## Step 1: Create MongoDB Atlas Cluster

1. **Sign up for MongoDB Atlas** (if you don't have an account)
   - Go to: https://www.mongodb.com/atlas/database
   - Create a free account

2. **Create a New Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (Free tier)
   - Select your preferred cloud provider and region
   - Name your cluster (e.g., "art-in-glass-cluster")
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" in the left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password (save these!)
   - Grant "Read and write to any database" permissions
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in the left menu
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP address
   - Click "Confirm"

## Step 2: Get Connection String

1. **Go to your cluster** and click "Connect"
2. **Select "Connect your application"**
3. **Choose:**
   - Driver: Python
   - Version: 3.12 or later
4. **Copy the connection string** (it will look like):
   ```
   mongodb+srv://<username>:<password>@art-in-glass-cluster.abc123.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 3: Update .env File

Open `backend/.env` and replace the MONGODB_URI with your actual connection string:

```env
# Replace this line:
MONGODB_URI=mongodb://localhost:27017/resin_art_db

# With your actual MongoDB Atlas connection string:
MONGODB_URI=mongodb+srv://<your_username>:<your_password>@art-in-glass-cluster.abc123.mongodb.net/resin_art_db?retryWrites=true&w=majority
```

**Important:** 
- Replace `<your_username>` with your actual database username
- Replace `<your_password>` with your actual database password
- Replace `art-in-glass-cluster.abc123` with your actual cluster address

## Step 4: Initialize the Database

Run the initialization script to create collections and indexes:

```bash
cd backend
python init_db.py
```

This will create:
- **users** collection (with indexes on email, role, created_at)
- **products** collection (with indexes on category, created_at, is_customizable)
- **orders** collection (with indexes on customer_id, order_status, created_at)
- **Default admin user**: admin@artinglass.com / admin123

## Step 5: Start the Application

```bash
cd backend
python main.py
```

You should see:
```
✓ Connected to MongoDB: resin_art_db
✓ Database: resin_art_db
✓ Collections initialized: users, products, orders
```

## Database Structure

### Collections

#### 1. users
- Stores user information (customers and admins)
- Fields: full_name, email, phone, role, password_hash, created_at
- Indexes: email (unique), role, created_at

#### 2. products
- Stores resin art products
- Fields: title, description, base_price, category, images, is_customizable, created_at
- Indexes: category, created_at, is_customizable

#### 3. orders
- Stores customer orders
- Fields: items, total_amount, shipping_address, customer_id, order_status, tracking_details, created_at, updated_at
- Indexes: customer_id, order_status, created_at

## Troubleshooting

### Error: "DNS query name does not exist"
- Check that your MongoDB Atlas cluster is running
- Verify the connection string is correct
- Ensure you have internet connectivity

### Error: "Authentication failed"
- Verify username and password in the connection string
- Check that the database user has correct permissions

### Error: "Connection timeout"
- Check network access settings in MongoDB Atlas
- Ensure your IP is whitelisted

## Security Notes

1. **Never commit .env file** to version control
2. **Use strong passwords** for database users
3. **Restrict network access** in production (don't use 0.0.0.0/0)
4. **Change default admin password** after first login
5. **Use environment variables** for sensitive data in production

## Next Steps

After database setup:
1. Test the API endpoints
2. Create your first product via admin panel
3. Test user registration and login
4. Create a test order