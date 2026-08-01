import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LogoutIcon from '../components/LogoutIcon';

export default function ProfileScreen({ navigation }) {
  const { user, refreshUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const menuItems = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: 'person-outline',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: '2',
      title: 'My Orders',
      icon: 'list-outline',
      color: '#F59E0B',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: '3',
      title: 'Wishlist',
      icon: 'heart-outline',
      color: '#EC4899',
      onPress: () => navigation.navigate('Wishlist'),
    },
    {
      id: '4',
      title: 'Cart',
      icon: 'cart-outline',
      color: '#3B82F6',
      onPress: () => navigation.navigate('Cart'),
    },
    {
      id: '5',
      title: 'Notifications',
      icon: 'notifications-outline',
      color: '#10B981',
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      id: '6',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      color: '#6366F1',
      onPress: () => navigation.navigate('Support'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerSpacer} />
          <LogoutIcon />
        </View>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
        {!!user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'CUSTOMER'}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.appInfoSection}>
        <Text style={styles.appName}>Art In Glass</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appTagline}>Custom Resin Art</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: '#8B5CF6',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#E9D5FF',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 13,
    color: '#E9D5FF',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appInfoSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
