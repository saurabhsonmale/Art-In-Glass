import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { Ionicons } from '@expo/vector-icons';

export default function WishlistScreen({ navigation }) {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Wishlist error:', error);
      Alert.alert('Error', 'Failed to load wishlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchWishlist();
    }, [fetchWishlist])
  );

  const removeItem = async (productId) => {
    try {
      await axios.delete(`${API_BASE_URL}/wishlist/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to remove item');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      {item.images?.[0] ? (
        <Image source={{ uri: item.images[0] }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="cube-outline" size={28} color="#8B5CF6" />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.price}>₹{Number(item.base_price).toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
        <Ionicons name="heart-dislike-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Wishlist is empty</Text>
          <Text style={styles.emptySub}>Tap the heart on products to save them</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchWishlist();
              }}
              colors={['#8B5CF6']}
              tintColor="#8B5CF6"
            />
          }
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  removeBtn: {
    padding: 8,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
});
