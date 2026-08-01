import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { resolveAuthDisplayState } from './src/config/roles';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main App Screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import SupportScreen from './src/screens/SupportScreen';
import WishlistScreen from './src/screens/WishlistScreen';

// Admin Screens
import AdminNavigator from './src/screens/admin/AdminNavigator';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for Main App (Customer)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Orders') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#8B5CF6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Art In Glass' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
      <Tab.Screen name="Orders" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const profileStackScreenOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: '#8B5CF6' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

// Customer Navigator
function CustomerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ ...profileStackScreenOptions, title: 'Product Details' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ ...profileStackScreenOptions, title: 'Checkout' }} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ ...profileStackScreenOptions, title: 'Track Order' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ ...profileStackScreenOptions, title: 'Edit Profile' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ ...profileStackScreenOptions, title: 'Notifications' }} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ ...profileStackScreenOptions, title: 'Help & Support' }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ ...profileStackScreenOptions, title: 'Wishlist' }} />
    </Stack.Navigator>
  );
}

// Auth Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#8B5CF6' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  );
}

// Navigator components (no NavigationContainer wrapper)
function CustomerNavigatorComponent() {
  return <CustomerNavigator />;
}

function AdminNavigatorComponent() {
  return <AdminNavigator />;
}

function AuthNavigatorComponent() {
  return <AuthNavigator />;
}

// Root navigator - RBAC: auth | customer | admin (admin + ops_admin)
function RootNavigator() {
  const { user, loading, logoutCounter, displayState: authDisplayState } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const displayState = authDisplayState || resolveAuthDisplayState(user);

  // key remounts navigator on role change / logout so stacks never leak across roles
  return (
    <NavigationContainer key={`nav-${displayState}-${logoutCounter}`}>
      {displayState === 'auth' ? <AuthNavigatorComponent /> : null}
      {displayState === 'customer' ? <CustomerNavigatorComponent /> : null}
      {displayState === 'admin' ? <AdminNavigatorComponent /> : null}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    fontSize: 18,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 16,
  },
});