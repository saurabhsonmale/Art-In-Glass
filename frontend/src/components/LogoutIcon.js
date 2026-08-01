import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

/**
 * Minimal logout control — icon only.
 * Works for all RBAC roles (customer, admin, ops_admin).
 */
export default function LogoutIcon({ size = 26, color = '#FFFFFF', style }) {
  const { logout, loggingOut } = useAuth();
  const { clearCart } = useCart();

  const onPress = () => {
    if (loggingOut) return;
    clearCart();
    logout();
  };

  return (
    <TouchableOpacity
      style={[styles.button, loggingOut && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loggingOut}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Logout"
    >
      <Ionicons name="log-out-outline" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  disabled: {
    opacity: 0.5,
  },
});
