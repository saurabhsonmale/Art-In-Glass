import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationSettingsScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  useEffect(() => {
    const prefs = user?.notification_preferences || {};
    setOrderUpdates(prefs.order_updates !== false);
    setPromotions(!!prefs.promotions);
    setPushEnabled(prefs.push_enabled !== false);
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    const result = await updateProfile({
      notification_preferences: {
        order_updates: orderUpdates,
        promotions,
        push_enabled: pushEnabled,
      },
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Saved', 'Notification preferences updated', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to save preferences');
    }
  };

  const Row = ({ label, description, value, onValueChange }) => (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Row
          label="Order Updates"
          description="Status changes for your orders"
          value={orderUpdates}
          onValueChange={setOrderUpdates}
        />
        <Row
          label="Promotions"
          description="Offers and new product alerts"
          value={promotions}
          onValueChange={setPromotions}
        />
        <Row
          label="Push Notifications"
          description="Allow push alerts on this device"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.disabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="notifications" size={20} color="#FFFFFF" />
            <Text style={styles.saveText}>Save Preferences</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
