import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://localhost:8000/api/v1';

const categories = [
  { id: '1', name: 'Keychains', icon: 'key-outline', color: '#8B5CF6' },
  { id: '2', name: 'Tables', icon: 'cube-outline', color: '#EC4899' },
  { id: '3', name: 'Frames', icon: 'image-outline', color: '#3B82F6' },
  { id: '4', name: 'Clocks', icon: 'time-outline', color: '#10B981' },
];

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { user } = useAuth();
  const { addToCart, getCartCount } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setFilteredProducts(products);
    } else {
      setSelectedCategory(categoryName);
      const filtered = products.filter(product => product.category === categoryName);
      setFilteredProducts(filtered);
    }
  };

  const handleQuickBuy = (product) => {
    addToCart(product, 1, {});
    navigation.navigate('Checkout', {
      items: [{
        product_id: product.id,
        title: product.title,
        quantity: 1,
        price: product.base_price,
        custom_notes: null,
        custom_image_url: null,
      }],
      total_amount: product.base_price,
    });
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <View style={styles.productImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="cube-outline" size={40} color="#8B5CF6" />
          </View>
        )}
        {item.is_customizable && (
          <View style={styles.customizableBadge}>
            <Text style={styles.customizableText}>Customizable</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.heartButton}
          onPress={() => Alert.alert('Wishlist', 'Added to wishlist!')}
        >
          <Ionicons name="heart-outline" size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.categoryRow}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {item.rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.base_price.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.quickBuyButton}
            onPress={() => handleQuickBuy(item)}
          >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => filterByCategory(item.name)}
    >
      <View style={[
        styles.categoryIcon, 
        { backgroundColor: item.color + '20' },
        selectedCategory === item.name && styles.selectedCategoryIcon
      ]}>
        <Ionicons name={item.icon} size={32} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name?.split(' ')[0] || 'Guest'}! 👋</Text>
          <Text style={styles.headerTitle}>Discover Beautiful Resin Art</Text>
        </View>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={28} color="#FFFFFF" />
          {getCartCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? `${selectedCategory}` : 'Featured Products'}
          </Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => filterByCategory(selectedCategory)}>
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsGrid}
          />
        )}
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
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#E9D5FF',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  clearFilterText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesList: {
    paddingRight: 24,
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCategoryIcon: {
    borderWidth: 3,
    borderColor: '#8B5CF6',
  },
  categoryName: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  productsGrid: {
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    marginRight: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customizableBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customizableText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  quickBuyButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});