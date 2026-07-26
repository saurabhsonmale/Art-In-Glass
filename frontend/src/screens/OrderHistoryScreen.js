import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const getStatusColor = (status) => {
  switch (status) {
    case 'PENDING':
      return '#F59E0B';
    case 'ACCEPTED':
      return '#3B82F6';
    case 'IN_PRODUCTION':
      return '#8B5CF6';
    case 'PACKED':
      return '#EC4899';
    case 'DISPATCHED':
      return '#10B981';
    case 'DELIVERED':
      return '#059669';
    case 'CANCELLED':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'PENDING':
      return 'time-outline';
    case 'ACCEPTED':
      return 'checkmark-circle-outline';
    case 'IN_PRODUCTION':
      return 'construct-outline';
    case 'PACKED':
      return 'cube-outline';
    case 'DISPATCHED':
      return 'rocket-outline';
    case 'DELIVERED':
      return 'checkmark-done-circle-outline';
    case 'CANCELLED':
      return 'close-circle-outline';
    default:
      return 'help-outline';
  }
};

export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.order_status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.order_status)} size={16} color={getStatusColor(item.order_status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.order_status) }]}>
            {item.order_status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <View key={index} style={styles.orderItem}>
            <Text style={styles.itemTitle} numberOfLines={1}>{orderItem.title}</Text>
            <Text style={styles.itemQuantity}>Qty: {orderItem.quantity}</Text>
          </View>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>₹{item.total_amount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Start shopping to see your orders here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ordersList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  ordersList: {
    padding: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  moreItems: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
});