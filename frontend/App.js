import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main App Screens
import HomeScreen from './src/screens/HomeScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for Main App
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#8B5CF6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Art In Glass' }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'My Cart' }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrderHistoryScreen}
        options={{ title: 'My Orders' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreenWrapper}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Profile Placeholder Screen
function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome, {user?.full_name || 'User'}!</Text>
      <Text style={styles.subtext}>Role: {user?.role || 'Customer'}</Text>
    </View>
  );
}

// Wrapper to pass navigation prop to ProfileScreen
function ProfileScreenWrapper({ navigation }) {
  return <ProfileScreen navigation={navigation} />;
}

// Auth Stack Navigator
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#8B5CF6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Login' }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();

  console.log('AppNavigator render - loading:', loading, 'user:', user ? 'logged in' : 'not logged in');

  // Show loading screen while checking auth
  if (loading) {
    console.log('Showing loading screen...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show main app
  console.log('Showing main app...');
  try {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen 
                name="ProductDetail" 
                component={ProductDetailScreen}
                options={{ 
                  headerShown: true,
                  title: 'Product Details',
                  headerStyle: { backgroundColor: '#8B5CF6' },
                  headerTintColor: '#fff'
                }}
              />
              <Stack.Screen 
                name="Checkout" 
                component={CheckoutScreen}
                options={{ 
                  headerShown: true,
                  title: 'Checkout',
                  headerStyle: { backgroundColor: '#8B5CF6' },
                  headerTintColor: '#fff'
                }}
              />
              <Stack.Screen 
                name="OrderTracking" 
                component={OrderTrackingScreen}
                options={{ 
                  headerShown: true,
                  title: 'Track Order',
                  headerStyle: { backgroundColor: '#8B5CF6' },
                  headerTintColor: '#fff'
                }}
              />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    console.error('Error rendering navigation:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading app</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
  },
  errorDetail: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#6B7280',
  },
});