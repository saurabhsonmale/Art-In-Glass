import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Dimensions, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
import { API_BASE_URL } from '../config/api';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [customNotes, setCustomNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef(null);
  const { user } = useAuth();
  const { addToCart } = useCart();

  const colors = product.customization_options?.color_shades || [
    { id: '1', name: 'Purple', value: '#8B5CF6' },
    { id: '2', name: 'Pink', value: '#EC4899' },
    { id: '3', name: 'Blue', value: '#3B82F6' },
    { id: '4', name: 'Green', value: '#10B981' },
  ];

  const handleAddToCart = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add items to cart');
      return;
    }

    const customization = {
      custom_notes: customNotes || null,
      custom_color: selectedColor,
      custom_image_url: selectedImage,
    };

    addToCart(product, quantity, customization);
    Alert.alert('Success', 'Added to cart!', [
      { text: 'Continue Shopping', onPress: () => navigation.goBack() },
      { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
    ]);
  };

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to purchase');
      return;
    }

    const customization = {
      custom_notes: customNotes || null,
      custom_color: selectedColor,
      custom_image_url: selectedImage,
    };

    addToCart(product, quantity, customization);
    
    const cartItems = [{
      product_id: product.id,
      title: product.title,
      quantity: quantity,
      price: product.base_price,
      custom_notes: customNotes || null,
      custom_image_url: selectedImage,
    }];

    navigation.navigate('Checkout', {
      items: cartItems,
      total_amount: product.base_price * quantity,
    });
  };

  const pickImage = async () => {
    if (!product.customization_options?.photo_required && !product.is_customizable) {
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      Alert.alert('Success', 'Photo uploaded successfully!');
    }
  };

  const renderImage = ({ item, index }) => (
    <Image source={{ uri: item }} style={styles.carouselImage} />
  );

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentImageIndex(index);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={16} color="#F59E0B" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={16} color="#F59E0B" />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#D1D5DB" />);
    }

    return stars;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={product.images || []}
          renderItem={renderImage}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        {product.images && product.images.length > 1 && (
          <View style={styles.indicatorContainer}>
            {product.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.activeIndicator
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.productTitle}>{product.title}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
              {product.estimated_days && (
                <View style={styles.timeBadge}>
                  <Ionicons name="time-outline" size={14} color="#8B5CF6" />
                  <Text style={styles.timeText}>Handcrafted in {product.estimated_days} Days</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.price}>₹{product.base_price.toFixed(2)}</Text>
        </View>

        {/* Rating */}
        {product.rating > 0 && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {renderStars(product.rating)}
            </View>
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          </View>
        )}

        <Text style={styles.description}>{product.description}</Text>

        {/* Customization Options */}
        {product.is_customizable && (
          <View style={styles.customizationSection}>
            <Text style={styles.sectionTitle}>Customization Options</Text>
            
            {/* Custom Notes */}
            {product.customization_options?.has_text_input && (
              <View style={styles.customizationItem}>
                <Text style={styles.customizationLabel}>Custom Text/Quote (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter custom name or quote..."
                  placeholderTextColor="#9CA3AF"
                  value={customNotes}
                  onChangeText={setCustomNotes}
                  maxLength={100}
                />
              </View>
            )}

            {/* Color Selection */}
            {product.customization_options?.color_shades && (
              <View style={styles.customizationItem}>
                <Text style={styles.customizationLabel}>Choose Color</Text>
                <View style={styles.colorGrid}>
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color.id || color.name}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color.value || color },
                        selectedColor === (color.value || color) && styles.selectedColor
                      ]}
                      onPress={() => setSelectedColor(color.value || color)}
                    >
                      {selectedColor === (color.value || color) && (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Photo Upload */}
            {product.customization_options?.photo_required && (
              <View style={styles.customizationItem}>
                <Text style={styles.customizationLabel}>Upload Photo for Resin Embedding</Text>
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#8B5CF6" />
                  <Text style={styles.uploadButtonText}>
                    {selectedImage ? 'Change Photo' : 'Choose Photo'}
                  </Text>
                </TouchableOpacity>
                {selectedImage && (
                  <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                )}
              </View>
            )}
          </View>
        )}

        {/* Quantity Selector */}
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantitySelector}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove-outline" size={24} color="#8B5CF6" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add-outline" size={24} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Ionicons name="cart-outline" size={20} color="#8B5CF6" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.buyNowButton}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
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
  carouselContainer: {
    width: width,
    height: 400,
    backgroundColor: '#FFFFFF',
  },
  carouselImage: {
    width: width,
    height: 400,
    resizeMode: 'cover',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    width: '100%',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  timeText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  customizationSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  customizationItem: {
    marginBottom: 16,
  },
  customizationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#1F2937',
    borderWidth: 3,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    resizeMode: 'cover',
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addToCartText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 8px rgba(139, 92, 246, 0.3)',
    elevation: 5,
  },
  buyNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});