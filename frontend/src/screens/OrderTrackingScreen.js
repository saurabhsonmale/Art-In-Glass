import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config/api';

const orderStatuses = [
  { id: 'PENDING', label: 'Order Placed', icon: 'checkmark-circle-outline', description: 'Your order has been placed successfully' },
  { id: 'ACCEPTED', label: 'Accepted', icon: 'checkmark-done-circle-outline', description: 'Order accepted by the seller' },
  { id: 'IN_PRODUCTION', label: 'In Production', icon: 'construct-outline', description: 'Resin curing and crafting in progress' },
  { id: 'PACKED', label: 'Packed', icon: 'cube-outline', description: 'Order packed and ready to ship' },
  { id: 'DISPATCHED', label: 'Dispatched', icon: 'rocket-outline', description: 'Order dispatched for delivery' },
  { id: 'DELIVERED', label: 'Delivered', icon: 'home-outline', description: 'Order delivered successfully' },
];

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
      return 'home-outline';
    case 'CANCELLED':
      return 'close-circle-outline';
    default:
      return 'help-outline';
  }
};

export default function OrderTrackingScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchOrderTracking();
  }, []);

  const fetchOrderTracking = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}/track`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      Alert.alert('Error', 'Failed to load order tracking');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStatusIndex = () => {
    if (!order) return 0;
    return orderStatuses.findIndex(status => status.id === order.order_status);
  };

  const isStatusCompleted = (statusId) => {
    const currentIndex = getCurrentStatusIndex();
    const statusIndex = orderStatuses.findIndex(s => s.id === statusId);
    return statusIndex <= currentIndex;
  };

  const isCurrentStatus = (statusId) => {
    return order?.order_status === statusId;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading tracking information...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <ScrollView style={styles.container}>
      {/* Order Info Header */}
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id.slice(-8).toUpperCase()}</Text>
        <View style={[styles.currentStatusBadge, { backgroundColor: getStatusColor(order.order_status) + '20' }]}>
          <Ionicons name={getStatusIcon(order.order_status)} size={20} color={getStatusColor(order.order_status)} />
          <Text style={[styles.currentStatusText, { color: getStatusColor(order.order_status) }]}>
            {order.order_status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Tracking Timeline */}
      <View style={styles.timelineSection}>
        <Text style={styles.sectionTitle}>Order Progress</Text>
        <View style={styles.timeline}>
          {orderStatuses.map((status, index) => {
            const isCompleted = isStatusCompleted(status.id);
            const isCurrent = isCurrentStatus(status.id);
            const isLast = index === orderStatuses.length - 1;

            return (
              <View key={status.id} style={styles.timelineItem}>
                {/* Timeline Line */}
                {!isLast && (
                  <View style={[
                    styles.timelineLine,
                    isCompleted && styles.timelineLineCompleted
                  ]} />
                )}

                {/* Status Icon */}
                <View style={[
                  styles.statusIconContainer,
                  isCompleted && styles.statusIconCompleted,
                  isCurrent && styles.statusIconCurrent
                ]}>
                  {isCompleted && !isCurrent ? (
                    <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  ) : (
                    <Ionicons 
                      name={status.icon} 
                      size={24} 
                      color={isCurrent ? '#FFFFFF' : '#9CA3AF'} 
                    />
                  )}
                </View>

                {/* Status Info */}
                <View style={styles.statusInfo}>
                  <Text style={[
                    styles.statusLabel,
                    isCurrent && styles.statusLabelCurrent
                  ]}>
                    {status.label}
                  </Text>
                  <Text style={styles.statusDescription}>{status.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Tracking Details (when dispatched) */}
      {order.tracking_details && order.tracking_details.courier_name && (
        <View style={styles.trackingDetailsSection}>
          <Text style={styles.sectionTitle}>Tracking Details</Text>
          <View style={styles.trackingCard}>
            <View style={styles.trackingItem}>
              <Ionicons name="business-outline" size={20} color="#8B5CF6" />
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingLabel}>Courier Name</Text>
                <Text style={styles.trackingValue}>{order.tracking_details.courier_name}</Text>
              </View>
            </View>
            <View style={styles.trackingItem}>
              <Ionicons name="barcode-outline" size={20} color="#8B5CF6" />
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingLabel}>Tracking Number</Text>
                <Text style={styles.trackingValue}>{order.tracking_details.tracking_number}</Text>
              </View>
            </View>
            {order.tracking_details.dispatch_date && (
              <View style={styles.trackingItem}>
                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingLabel}>Dispatch Date</Text>
                  <Text style={styles.trackingValue}>
                    {new Date(order.tracking_details.dispatch_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Order Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDetails}>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</Text>
                {item.custom_notes && (
                  <Text style={styles.customNotes}>Custom: {item.custom_notes}</Text>
                )}
              </View>
              <Text style={styles.itemPrice}>₹{(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{order.total_amount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Shipping Address */}
      <View style={styles.addressSection}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.addressCard}>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#8B5CF6" />
            <Text style={styles.addressText}>{order.shipping_address.street}</Text>
          </View>
          <Text style={styles.addressText}>
            {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.zipcode}
          </Text>
          <View style={styles.addressRow}>
            <Ionicons name="call-outline" size={20} color="#8B5CF6" />
            <Text style={styles.addressText}>{order.shipping_address.phone}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  currentStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timelineSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  timeline: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -24,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineLineCompleted: {
    backgroundColor: '#8B5CF6',
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
  },
  statusIconCompleted: {
    backgroundColor: '#8B5CF6',
  },
  statusIconCurrent: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  statusInfo: {
    flex: 1,
    paddingTop: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  statusLabelCurrent: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  trackingDetailsSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  trackingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  trackingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summarySection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  customNotes: {
    fontSize: 12,
    color: '#8B5CF6',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  addressSection: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
  },
});