/**
 * Simple test to verify logout button and API are working
 */

const fs = require('fs');

console.log('🧪 Testing Logout Implementation...\n');

// Read the files
const authContext = fs.readFileSync('frontend/src/context/AuthContext.js', 'utf8');
const profileScreen = fs.readFileSync('frontend/src/screens/ProfileScreen.js', 'utf8');
const appJs = fs.readFileSync('frontend/App.js', 'utf8');
const authRouter = fs.readFileSync('backend/routers/auth.py', 'utf8');

console.log('1. Checking AuthContext logout function...');
const checks = {
  'Has logout function': authContext.includes('const logout = async ()'),
  'Calls axios.post("/auth/logout")': authContext.includes("axios.post('/auth/logout'"),
  'Gets token from AsyncStorage': authContext.includes("AsyncStorage.getItem('token')"),
  'Clears AsyncStorage token': authContext.includes("AsyncStorage.removeItem('token')"),
  'Clears AsyncStorage user': authContext.includes("AsyncStorage.removeItem('user')"),
  'Sets user to null': authContext.includes('setUser(null)'),
  'Sets token to null': authContext.includes('setToken(null)'),
  'Increments logoutCounter': authContext.includes('setLogoutCounter'),
  'Clears axios Authorization': authContext.includes("delete axios.defaults.headers.common['Authorization']"),
};

Object.entries(checks).forEach(([name, passed]) => {
  console.log(`   ${passed ? '✅' : '❌'} ${name}`);
});

console.log('\n2. Checking ProfileScreen logout button...');
const profileChecks = {
  'Has handleLogout function': profileScreen.includes('const handleLogout = ()'),
  'Has Alert.alert for confirmation': profileScreen.includes('Alert.alert') && profileScreen.includes("'Logout'"),
  'Calls logout() on confirm': profileScreen.includes('await logout()'),
  'Has logout button in JSX': profileScreen.includes('TouchableOpacity') && profileScreen.includes('onPress={handleLogout}'),
  'Button has red styling': profileScreen.includes('#FEE2E2') && profileScreen.includes('#EF4444'),
};

Object.entries(profileChecks).forEach(([name, passed]) => {
  console.log(`   ${passed ? '✅' : '❌'} ${name}`);
});

console.log('\n3. Checking App.js navigation reset...');
const appChecks = {
  'Uses logoutCounter in key': appJs.includes('logoutCounter'),
  'Has conditional rendering': appJs.includes("displayState === 'auth'"),
  'Single NavigationContainer': appJs.includes('<NavigationContainer key='),
};

Object.entries(appChecks).forEach(([name, passed]) => {
  console.log(`   ${passed ? '✅' : '❌'} ${name}`);
});

console.log('\n4. Checking backend logout endpoint...');
const backendChecks = {
  'Has logout endpoint': authRouter.includes('@router.post("/logout"'),
  'Uses get_current_user': authRouter.includes('current_user = Depends(get_current_user)'),
  'Uses oauth2_scheme': authRouter.includes('token: str = Depends(oauth2_scheme)'),
  'Gets token blacklist collection': authRouter.includes('TOKEN_BLACKLIST_COLLECTION'),
  'Adds token to blacklist': authRouter.includes('token_blacklist_collection.insert_one'),
};

Object.entries(backendChecks).forEach(([name, passed]) => {
  console.log(`   ${passed ? '✅' : '❌'} ${name}`);
});

// Summary
const allChecks = { ...checks, ...profileChecks, ...appChecks, ...backendChecks };
const passed = Object.values(allChecks).filter(v => v).length;
const total = Object.values(allChecks).length;

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passed}/${total} checks passed\n`);

if (passed === total) {
  console.log('✅ All checks passed!');
  console.log('\n📝 To test the logout button:');
  console.log('   1. Start backend: cd backend && uvicorn main:app --reload');
  console.log('   2. Start frontend: cd frontend && npm start');
  console.log('   3. Login to the app');
  console.log('   4. Go to Profile tab');
  console.log('   5. Tap the red "Logout" button');
  console.log('   6. Confirm logout in the dialog');
  console.log('   7. Check console for logs starting with:');
  console.log('      - "🔴 Logout button pressed"');
  console.log('      - "🔵 AuthContext: Starting logout..."');
  console.log('      - "✅ AuthContext: Logout API responded: 200"');
  console.log('   8. Verify you are redirected to LoginScreen');
  console.log('   9. Verify hardware back button exits app\n');
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
  process.exit(1);
}