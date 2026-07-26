# Debug Logout Button - Art In Glass

## Issue: Logout button not working

## 🔍 Debugging Steps

### Step 1: Check Console Logs
When you tap the logout button, you should see these console logs in your debugger:

```
🔴 Logout button pressed
🔴 Starting logout process...
🔴 User before logout: user@example.com
🔴 Logout result: {success: true, ...}
🔴 User after logout: undefined
✅ Logout successful - navigation should reset
```

**If you don't see "🔴 Logout button pressed"**:
- The button's `onPress` event is not firing
- Check if the button is actually visible and tappable
- Try increasing the button's touch area or check for overlapping elements

**If you see "🔴 Logout button pressed" but nothing else**:
- The Alert dialog is not showing
- Check for JavaScript errors in the console

**If you see "Logout cancelled by user"**:
- You tapped "Cancel" in the dialog
- Try tapping "Logout" in the confirmation dialog

**If you see "❌ Logout failed" or "❌ Logout exception"**:
- Check the error message in the alert
- Common issues:
  - Backend server not running
  - Network connectivity issues
  - Token expired or invalid

### Step 2: Verify Backend is Running

```bash
# Test backend health
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy"}
```

If backend is not running:
```bash
cd backend
uvicorn main:app --reload
```

### Step 3: Check Network Requests

In your debugger's Network tab:
1. Tap the logout button
2. Confirm logout in the dialog
3. Look for a POST request to `/api/v1/auth/logout`
4. Check the response status (should be 200)

**If no request is made**:
- The logout function is not being called
- Check for JavaScript errors

**If request fails with 401/403**:
- Token is invalid or expired
- Try logging in again

**If request fails with 500**:
- Backend error - check backend console logs
- Common issue: MongoDB not running

### Step 4: Verify MongoDB is Running

```bash
# Check if MongoDB is running
# Windows:
net start | findstr MongoDB

# Or try connecting with MongoDB Compass
# Connection string: mongodb://localhost:27017/
```

If MongoDB is not running:
```bash
# Windows:
net start MongoDB

# Or start MongoDB Compass
```

### Step 5: Check AuthContext

Add this at the top of ProfileScreen.js to verify the context is working:

```javascript
console.log('🔵 AuthContext values:', {
  user: user?.email,
  hasLogout: typeof logout === 'function',
  token: !!token
});
```

**If `hasLogout` is false**:
- The logout function is not being exported from AuthContext
- Check AuthContext.js

**If `user` is undefined**:
- User is not logged in
- Try logging in first

### Step 6: Common Issues and Solutions

#### Issue: Button not responding
**Solution**: Check if the ScrollView is intercepting touches
```javascript
// In ProfileScreen.js, add this to ScrollView
<ScrollView 
  style={styles.container} 
  showsVerticalScrollIndicator={false}
  // Add this line:
  scrollEnabled={true}
>
```

#### Issue: Navigation not resetting
**Solution**: The key-based remount should work, but if not, try manually resetting:

```javascript
// In AuthContext.js, after clearing state:
if (navigationRef.current) {
  navigationRef.current.reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
}
```

#### Issue: AsyncStorage not clearing
**Solution**: Check AsyncStorage implementation:
```javascript
// Add this in logout function:
console.log('🔵 AsyncStorage token before:', await AsyncStorage.getItem('token'));
await AsyncStorage.removeItem('token');
console.log('🔵 AsyncStorage token after:', await AsyncStorage.getItem('token'));
```

### Step 7: Test with Simplified Code

If the above doesn't work, try this minimal test in ProfileScreen.js:

```javascript
const handleLogout = () => {
  console.log('🔴 BUTTON PRESSED - Testing basic functionality');
  
  // Test 1: Simple alert
  Alert.alert('Test', 'Button works!', [
    {
      text: 'OK',
      onPress: () => console.log('Alert dismissed')
    }
  ]);
  
  // Test 2: Simple state change
  console.log('🔴 Current user:', user?.email);
};
```

If this works, the issue is in the logout function. If this doesn't work, the issue is with button/touch handling.

### Step 8: Check for JavaScript Errors

Look for red error messages in the console:
- "undefined is not a function" - logout is not defined
- "Cannot read property of undefined" - user or token is null
- "Network request failed" - backend not reachable

## 🧪 Quick Test

Run this in your app's console:

```javascript
// Test 1: Check if logout function exists
const auth = require('./src/context/AuthContext').useAuth();
console.log('Logout function:', typeof auth().logout);

// Test 2: Manually call logout
auth().logout().then(result => {
  console.log('Manual logout result:', result);
});
```

## 📋 Checklist

- [ ] Backend server is running (port 8000)
- [ ] MongoDB is running
- [ ] User is logged in (check AsyncStorage)
- [ ] Console shows "🔴 Logout button pressed"
- [ ] Console shows "🔴 Starting logout process..."
- [ ] Console shows "🔴 Logout result: {success: true}"
- [ ] Network request to `/api/v1/auth/logout` is made
- [ ] Network request returns 200 status
- [ ] Navigation resets to LoginScreen
- [ ] Hardware back button exits app (doesn't return to protected screens)

## 🐛 Known Issues

1. **React Native Debugger**: If using React Native Debugger, console.log might not show. Try using `console.warn` or `console.error` instead.

2. **Expo Go**: If testing in Expo Go, shake device and enable "Debug Remote JS" to see console logs.

3. **Hermes Engine**: If using Hermes, console.log might be limited. Check the Hermes debugger.

## 📞 Still Not Working?

If the logout button still doesn't work after following these steps:

1. Take a screenshot of the console logs
2. Note the exact behavior (nothing happens, error shows, etc.)
3. Check if other buttons in the app work (to rule out general touch issues)
4. Try restarting the app completely
5. Clear app data and re-login

## 🔧 Emergency Fix

If nothing else works, replace the logout button with this emergency version:

```javascript
const handleLogout = () => {
  console.log('🔴 EMERGENCY LOGOUT');
  
  // Direct state clearing
  AsyncStorage.removeItem('token');
  AsyncStorage.removeItem('user');
  
  // Show alert
  Alert.alert('Logged Out', 'Please restart the app', [
    {
      text: 'OK',
      onPress: () => {
        // This will force app restart
        if (Platform.OS === 'android') {
          BackHandler.exitApp();
        }
      }
    }
  ]);
};