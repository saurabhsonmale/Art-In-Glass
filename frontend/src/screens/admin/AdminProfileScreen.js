import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { Ionicons } from '@expo/vector-icons';
import LogoutIcon from '../../components/LogoutIcon';

export default function AdminProfileScreen({ navigation }) {
  const { user, token, refreshUser } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, delivered: 0, pending: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    if (!token) {
      setLoadingStats(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({
        products: response.data?.products ?? 0,
        orders: response.data?.orders ?? 0,
        delivered: response.data?.delivered ?? 0,
        pending: response.data?.pending ?? 0,
      });
    } catch (error) {
      console.warn('Admin stats error:', error.message);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoadingStats(true);
      refreshUser();
      loadStats();
    }, [refreshUser, loadStats])
  );

  const menuItems = [
    {
      id: '1',
      title: 'Account Settings',
      icon: 'person-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: '2',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      id: '3',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: '4',
      title: 'About App',
      icon: 'information-circle-outline',
      onPress: () =>
        Alert.alert(
          'Art In Glass',
          'Ops Admin Panel v1.0.0\nManage catalog, orders, and customer requests.'
        ),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerSpacer} />
          <LogoutIcon />
        </View>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.full_name || 'Admin'}</Text>
        <Text style={styles.email}>{user?.email || 'ops@artinglass.com'}</Text>
        {!!user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {(user?.role || 'admin').replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cube-outline" size={28} color="#8B5CF6" />
          {loadingStats ? (
            <ActivityIndicator style={styles.statLoader} color="#8B5CF6" />
          ) : (
            <Text style={styles.statValue}>{stats.products}</Text>
          )}
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="list-outline" size={28} color="#EC4899" />
          {loadingStats ? (
            <ActivityIndicator style={styles.statLoader} color="#EC4899" />
          ) : (
            <Text style={styles.statValue}>{stats.orders}</Text>
          )}
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={28} color="#10B981" />
          {loadingStats ? (
            <ActivityIndicator style={styles.statLoader} color="#10B981" />
          ) : (
            <Text style={styles.statValue}>{stats.delivered}</Text>
          )}
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {!loadingStats && stats.pending > 0 ? (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => navigation.navigate('Orders')}
        >
          <Ionicons name="time-outline" size={20} color="#F59E0B" />
          <Text style={styles.pendingText}>{stats.pending} pending order(s) need attention</Text>
          <Ionicons name="chevron-forward" size={18} color="#F59E0B" />
        </TouchableOpacity>
      ) : null}

      <View style={styles.menuSection}>
        <Text style={styles.menuSectionTitle}>Settings</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon} size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.versionText}>Art In Glass - Ops Panel v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E9D5FF',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#E9D5FF',
    marginBottom: 4,
  },
  phone: {
    fontSize: 13,
    color: '#E9D5FF',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: -20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLoader: {
    marginTop: 10,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  pendingBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
  },
});
