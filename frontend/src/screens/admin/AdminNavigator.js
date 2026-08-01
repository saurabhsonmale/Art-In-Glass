import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Admin Screens
import AdminOrdersScreen from './AdminOrdersScreen';
import AddProductScreen from './AddProductScreen';
import ManageCatalogScreen from './ManageCatalogScreen';
import AdminProfileScreen from './AdminProfileScreen';
import EditProfileScreen from '../EditProfileScreen';
import NotificationSettingsScreen from '../NotificationSettingsScreen';
import SupportScreen from '../SupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: '#8B5CF6' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' },
};

// Tab Navigator for Admin
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'AddProduct') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Catalog') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: 'gray',
        ...headerOptions,
      })}
    >
      <Tab.Screen 
        name="Orders" 
        component={AdminOrdersScreen}
        options={{ title: 'Orders Queue' }}
      />
      <Tab.Screen 
        name="AddProduct" 
        component={AddProductScreen}
        options={{ title: 'Add Product' }}
      />
      <Tab.Screen 
        name="Catalog" 
        component={ManageCatalogScreen}
        options={{ title: 'Manage Catalog' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={AdminProfileScreen}
        options={{ title: 'Admin Profile' }}
      />
    </Tab.Navigator>
  );
}

// Admin Navigator - stack wraps tabs so profile sub-screens work
export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ ...headerOptions, headerShown: true, title: 'Account Settings' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ ...headerOptions, headerShown: true, title: 'Notifications' }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ ...headerOptions, headerShown: true, title: 'Help & Support' }}
      />
    </Stack.Navigator>
  );
}
