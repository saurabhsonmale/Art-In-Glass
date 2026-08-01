import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [addressPhone, setAddressPhone] = useState('');

  useEffect(() => {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    const addr = user?.default_shipping_address || {};
    setStreet(addr.street || '');
    setCity(addr.city || '');
    setStateName(addr.state || '');
    setZipcode(addr.zipcode || '');
    setAddressPhone(addr.phone || user?.phone || '');
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert('Error', 'Enter a valid phone number');
      return;
    }

    setLoading(true);
    const result = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      default_shipping_address: {
        street: street.trim(),
        city: city.trim(),
        state: stateName.trim(),
        zipcode: zipcode.trim(),
        phone: (addressPhone || phone).trim(),
      },
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Saved', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <Text style={styles.label}>Email (read-only)</Text>
        <View style={styles.readOnly}>
          <Ionicons name="mail-outline" size={18} color="#8B5CF6" />
          <Text style={styles.readOnlyText}>{user?.email || '—'}</Text>
        </View>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit phone"
          keyboardType="phone-pad"
          maxLength={15}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Default Shipping Address</Text>
        <Text style={styles.hint}>Used to prefill checkout</Text>

        <Text style={styles.label}>Street</Text>
        <TextInput
          style={styles.input}
          value={street}
          onChangeText={setStreet}
          placeholder="Street address"
          placeholderTextColor="#9CA3AF"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={stateName}
              onChangeText={setStateName}
              placeholder="State"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              value={zipcode}
              onChangeText={setZipcode}
              placeholder="Pincode"
              keyboardType="numeric"
              maxLength={6}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Delivery Phone</Text>
            <TextInput
              style={styles.input}
              value={addressPhone}
              onChangeText={setAddressPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
              maxLength={15}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
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
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.saveText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
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
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: -8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  readOnlyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
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
