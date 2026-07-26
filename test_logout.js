/**
 * Test script to verify logout functionality
 * This script checks the implementation without running the app
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Logout Implementation...\n');

// Test 1: Check ProfileScreen.js has logout button
console.log('1. Checking ProfileScreen.js...');
const profileScreenPath = path.join(__dirname, 'frontend/src/screens/ProfileScreen.js');
const profileScreenContent = fs.readFileSync(profileScreenPath, 'utf8');

const profileTests = [
  { name: 'Import useAuth', test: profileScreenContent.includes("const { user, logout } = useAuth()") },
  { name: 'Has handleLogout function', test: profileScreenContent.includes('const handleLogout = ()') },
  { name: 'Has Alert.alert confirmation', test: profileScreenContent.includes("Alert.alert") && profileScreenContent.includes("'Logout'") },
  { name: 'Calls logout() on confirmation', test: profileScreenContent.includes('const result = await logout()') },
  { name: 'Has logout button in JSX', test: profileScreenContent.includes('TouchableOpacity') && profileScreenContent.includes('onPress={handleLogout}') },
  { name: 'Has logout button styles', test: profileScreenContent.includes('logoutButton:') && profileScreenContent.includes('#FEE2E2') },
  { name: 'Has logout button text', test: profileScreenContent.includes('Logout') },
];

profileTests.forEach(test => {
  console.log(`   ${test.test ? '✅' : '❌'} ${test.name}`);
});

// Test 2: Check AdminProfileScreen.js has logout button
console.log('\n2. Checking AdminProfileScreen.js...');
const adminProfilePath = path.join(__dirname, 'frontend/src/screens/admin/AdminProfileScreen.js');
const adminProfileContent = fs.readFileSync(adminProfilePath, 'utf8');

const adminTests = [
  { name: 'Import useAuth', test: adminProfileContent.includes("const { user, logout } = useAuth()") },
  { name: 'Has handleLogout function', test: adminProfileContent.includes('const handleLogout = ()') },
  { name: 'Has Alert.alert confirmation', test: adminProfileContent.includes("Alert.alert") && adminProfileContent.includes("'Logout'") },
  { name: 'Calls logout() on confirmation', test: adminProfileContent.includes('const result = await logout()') },
  { name: 'Has logout button in JSX', test: adminProfileContent.includes('TouchableOpacity') && adminProfileContent.includes('onPress={handleLogout}') },
  { name: 'Has logout button styles', test: adminProfileContent.includes('logoutButton:') && adminProfileContent.includes('#FEE2E2') },
];

adminTests.forEach(test => {
  console.log(`   ${test.test ? '✅' : '❌'} ${test.name}`);
});

// Test 3: Check AuthContext.js has logout function
console.log('\n3. Checking AuthContext.js...');
const authContextPath = path.join(__dirname, 'frontend/src/context/AuthContext.js');
const authContextContent = fs.readFileSync(authContextPath, 'utf8');

const authTests = [
  { name: 'Has logout function', test: authContextContent.includes('const logout = async ()') },
  { name: 'Clears AsyncStorage token', test: authContextContent.includes("await AsyncStorage.removeItem('token')") },
  { name: 'Clears AsyncStorage user', test: authContextContent.includes("await AsyncStorage.removeItem('user')") },
  { name: 'Sets user to null', test: authContextContent.includes('setUser(null)') },
  { name: 'Sets token to null', test: authContextContent.includes('setToken(null)') },
  { name: 'Increments logoutCounter', test: authContextContent.includes('setLogoutCounter') },
  { name: 'Clears axios Authorization header', test: authContextContent.includes("delete axios.defaults.headers.common['Authorization']") },
  { name: 'Calls backend logout API', test: authContextContent.includes("axios.post('/auth/logout'") },
  { name: 'Returns success object', test: authContextContent.includes('return { success: true }') },
  { name: 'Has error handling', test: authContextContent.includes('success: false') && authContextContent.includes('error:') },
];

authTests.forEach(test => {
  console.log(`   ${test.test ? '✅' : '❌'} ${test.name}`);
});

// Test 4: Check App.js has proper navigation reset
console.log('\n4. Checking App.js navigation...');
const appPath = path.join(__dirname, 'frontend/App.js');
const appContent = fs.readFileSync(appPath, 'utf8');

const appTests = [
  { name: 'Uses single NavigationContainer', test: appContent.includes('<NavigationContainer key=') },
  { name: 'Conditionally renders navigators', test: appContent.includes('displayState === \'auth\'') },
  { name: 'Uses logoutCounter in key', test: appContent.includes('logoutCounter') },
  { name: 'Has AuthNavigatorComponent', test: appContent.includes('AuthNavigatorComponent') },
  { name: 'Has CustomerNavigatorComponent', test: appContent.includes('CustomerNavigatorComponent') },
  { name: 'Has AdminNavigatorComponent', test: appContent.includes('AdminNavigatorComponent') },
];

appTests.forEach(test => {
  console.log(`   ${test.test ? '✅' : '❌'} ${test.name}`);
});

// Test 5: Check backend logout endpoint
console.log('\n5. Checking backend logout endpoint...');
const authRouterPath = path.join(__dirname, 'backend/routers/auth.py');
const authRouterContent = fs.readFileSync(authRouterPath, 'utf8');

const backendTests = [
  { name: 'Has logout endpoint', test: authRouterContent.includes('@router.post("/logout"') },
  { name: 'Protected with get_current_user', test: authRouterContent.includes('current_user = Depends(get_current_user)') },
  { name: 'Returns success message', test: authRouterContent.includes('"message": "Logged out successfully"') },
];

backendTests.forEach(test => {
  console.log(`   ${test.test ? '✅' : '❌'} ${test.name}`);
});

// Summary
console.log('\n' + '='.repeat(50));
const allTests = [...profileTests, ...adminTests, ...authTests, ...appTests, ...backendTests];
const passedTests = allTests.filter(t => t.test).length;
const totalTests = allTests.length;

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('✅ All tests passed! Logout implementation is complete.');
  console.log('\n📝 Next Steps:');
  console.log('   1. Start backend: cd backend && uvicorn main:app --reload');
  console.log('   2. Start frontend: cd frontend && npm start');
  console.log('   3. Test logout on both Customer and Admin profiles');
  console.log('   4. Verify navigation resets to LoginScreen');
  console.log('   5. Test hardware back button (should exit app, not return to protected screens)');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}