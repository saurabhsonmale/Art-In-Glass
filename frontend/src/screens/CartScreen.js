import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen({ navigation }) {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const deliveryCharges = cartItems.length > 0 ? (getCartTotal() > 2000 ? 0 : 99) : 0;
  const grandTotal = getCartTotal() + deliveryCharges;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart before checkout');
      return;
    }

    navigation.navigate('Checkout', {
      items: cartItems,
      total_amount: grandTotal,
    });
  };

  const handleRemoveItem = (item) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => removeFromCart(item.product_id, item.custom_notes)
        }
      ]
    );
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Add some beautiful resin art to your cart!</Text>
        <TouchableOpacity 
          style={styles.shopNowButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopNowText}>Shop Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cart Items ({cartItems.length})</Text>
          
          {cartItems.map((item, index) => (
            <View key={`${item.product_id}-${index}`} style={styles.cartItem}>
              <View style={styles.itemImageContainer}>
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemPlaceholder}>
                    <Ionicons name="cube-outline" size={30} color="#8B5CF6" />
                  </View>
                )}
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>

                {/* Customization Badges */}
                <View style={styles.customizationBadges}>
                  {item.custom_notes && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Custom: {item.custom_notes}</Text>
                    </View>
                  )}
                  {item.custom_color && (
                    <View style={styles.colorBadge}>
                      <View style={[styles.colorDot, { backgroundColor: item.custom_color }]} />
                    </View>
                  )}
                </View>

                {/* Quantity Controls */}
                <View style={styles.quantityControls}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product_id, item.quantity - 1, item.custom_notes)}
                  >
                    <Ionicons name="remove-outline" size={20} color="#8B5CF6" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.product_id, item.quantity + 1, item.custom_notes)}
                  >
                    <Ionicons name="add-outline" size={20} color="#8B5CF6" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemRightSection}>
                <Text style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => handleRemoveItem(item)}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{getCartTotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charges</Text>
              <Text style={[
                styles.summaryValue,
                deliveryCharges === 0 && styles.freeDelivery
              ]}>
                {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges.toFixed(2)}`}
              </Text>
            </View>
            {getCartTotal() < 2000 && (
              <Text style={styles.deliveryNote}>
                Add ₹{(2000 - getCartTotal()).toFixed(2)} more for free delivery!
              </Text>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Checkout Button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F3F4F6',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopNowButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  itemImageContainer: {
    marginRight: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  itemPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  customizationBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  customBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontStyle: 'italic',
  },
  colorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },
  itemRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  removeButton: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  freeDelivery: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  deliveryNote: {
    fontSize: 12,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0px 4px 8px rgba(139, 92, 246, 0.3)',
    elevation: 5,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});