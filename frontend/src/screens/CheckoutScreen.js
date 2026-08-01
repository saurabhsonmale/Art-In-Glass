import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL } from '../config/api';

export default function CheckoutScreen({ route, navigation }) {
  const { items, total_amount } = route.params || { items: [], total_amount: 0 };
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();
  const { clearCart } = useCart();

  const [address, setAddress] = useState({
    full_name: user?.full_name || '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    phone: user?.phone || '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState({});

  const paymentMethods = [
    { id: 'cod', name: 'Cash on Delivery', icon: 'cash-outline', description: 'Pay when you receive' },
    { id: 'upi', name: 'UPI', icon: 'card-outline', description: 'Pay via UPI apps' },
    { id: 'card', name: 'Card', icon: 'card-outline', description: 'Credit/Debit card' },
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!address.full_name.trim()) newErrors.full_name = 'Name is required';
    if (!address.street.trim()) newErrors.street = 'Street address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.zipcode.trim()) newErrors.zipcode = 'Pincode is required';
    if (!address.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (address.phone.length < 10) newErrors.phone = 'Invalid phone number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please login to place order');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          custom_notes: item.custom_notes || null,
          custom_image_url: item.custom_image_url || null,
        })),
        total_amount: total_amount,
        shipping_address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipcode: address.zipcode,
          phone: address.phone,
        },
        payment_method: paymentMethod,
      };

      const response = await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      clearCart();
      
      Alert.alert(
        'Success!',
        'Your order has been placed successfully!',
        [
          {
            text: 'Track Order',
            onPress: () => navigation.navigate('OrderTracking', { orderId: response.data.id })
          },
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Orders')
          }
        ]
      );
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {items.map((item, index) => (
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
            <Text style={styles.totalAmount}>₹{total_amount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Shipping Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.formCard}>
          <View style={[styles.inputContainer, errors.full_name && styles.inputError]}>
            <Ionicons name="person-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#9CA3AF"
              value={address.full_name}
              onChangeText={(text) => setAddress({ ...address, full_name: text })}
            />
          </View>

          <View style={[styles.inputContainer, errors.street && styles.inputError]}>
            <Ionicons name="location-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Street Address *"
              placeholderTextColor="#9CA3AF"
              value={address.street}
              onChangeText={(text) => setAddress({ ...address, street: text })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput, errors.city && styles.inputError]}>
              <Ionicons name="city-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="City *"
                placeholderTextColor="#9CA3AF"
                value={address.city}
                onChangeText={(text) => setAddress({ ...address, city: text })}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput, errors.state && styles.inputError]}>
              <Ionicons name="map-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="State *"
                placeholderTextColor="#9CA3AF"
                value={address.state}
                onChangeText={(text) => setAddress({ ...address, state: text })}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput, errors.zipcode && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Pincode *"
                placeholderTextColor="#9CA3AF"
                value={address.zipcode}
                onChangeText={(text) => setAddress({ ...address, zipcode: text })}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput, errors.phone && styles.inputError]}>
              <Ionicons name="call-outline" size={20} color="#8B5CF6" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor="#9CA3AF"
                value={address.phone}
                onChangeText={(text) => setAddress({ ...address, phone: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                paymentMethod === method.id && styles.selectedPayment
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.paymentLeft}>
                <View style={[
                  styles.radioButton,
                  paymentMethod === method.id && styles.radioSelected
                ]}>
                  {paymentMethod === method.id && (
                    <View style={styles.radioDot} />
                  )}
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{method.name}</Text>
                  <Text style={styles.paymentDescription}>{method.description}</Text>
                </View>
              </View>
              <Ionicons name={method.icon} size={24} color="#8B5CF6" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Confirm Order Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.confirmButton, loading && styles.buttonDisabled]} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Placing Order...' : `Confirm Order - ₹${total_amount.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
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
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(139, 92, 246, 0.3)',
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentContainer: {
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedPayment: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F9F5FF',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#8B5CF6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
});
