import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const categories = [
  { id: '1', name: 'Keychains' },
  { id: '2', name: 'Tables' },
  { id: '3', name: 'Frames' },
  { id: '4', name: 'Clocks' },
];

const colorOptions = [
  { id: '1', name: 'Ocean Blue', color: '#3B82F6' },
  { id: '2', name: 'Emerald', color: '#10B981' },
  { id: '3', name: 'Gold Leaf', color: '#F59E0B' },
  { id: '4', name: 'Rose Pink', color: '#EC4899' },
  { id: '5', name: 'Purple Haze', color: '#8B5CF6' },
  { id: '6', name: 'Sunset Orange', color: '#F97316' },
];

export default function AddProductScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('3');
  const [images, setImages] = useState([]);
  
  // Customization options
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [selectedColors, setSelectedColors] = useState([]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleColor = (colorName) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors(selectedColors.filter(c => c !== colorName));
    } else {
      setSelectedColors([...selectedColors, colorName]);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!title || !description || !basePrice || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(basePrice) || parseFloat(basePrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        title,
        description,
        base_price: parseFloat(basePrice),
        category,
        images: images,
        is_customizable: isCustomizable,
        requires_photo: requiresPhoto,
        available_colors: selectedColors,
        estimated_days: parseInt(estimatedDays),
      };

      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/admin/products`,
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Product added to Customer Catalog!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setTitle('');
            setDescription('');
            setBasePrice('');
            setCategory('');
            setEstimatedDays('3');
            setImages([]);
            setIsCustomizable(false);
            setRequiresPhoto(false);
            setSelectedColors([]);
            // Navigate back to catalog
            navigation.navigate('Catalog');
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <Text style={styles.headerSubtitle}>Products will appear instantly in Customer App</Text>
      </View>

      <View style={styles.form}>
        {/* Product Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Custom Name Keychain"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your product..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Price and Category Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Base Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="299"
              value={basePrice}
              onChangeText={setBasePrice}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      category === cat.name && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat.name && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Estimated Days */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Crafting Duration (Days)</Text>
          <TextInput
            style={styles.input}
            placeholder="3"
            value={estimatedDays}
            onChangeText={setEstimatedDays}
            keyboardType="numeric"
          />
        </View>

        {/* Image Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Images</Text>
          <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={24} color="#8B5CF6" />
            <Text style={styles.imageUploadText}>Tap to add photos</Text>
          </TouchableOpacity>
          
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Customization Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customization Options</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Enable Custom Name/Text</Text>
              <Text style={styles.switchDescription}>Allow customers to add personalized text</Text>
            </View>
            <Switch
              value={isCustomizable}
              onValueChange={setIsCustomizable}
              trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
              thumbColor={isCustomizable ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Require Customer Photo</Text>
              <Text style={styles.switchDescription}>Customer must upload a photo for customization</Text>
            </View>
            <Switch
              value={requiresPhoto}
              onValueChange={setRequiresPhoto}
              trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
              thumbColor={requiresPhoto ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Colors</Text>
          <TouchableOpacity 
            style={styles.colorSelector}
            onPress={() => setShowColorModal(true)}
          >
            <Text style={styles.colorSelectorText}>
              {selectedColors.length > 0 
                ? `${selectedColors.length} color(s) selected` 
                : 'Select colors'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </TouchableOpacity>
          
          {selectedColors.length > 0 && (
            <View style={styles.selectedColorsContainer}>
              {selectedColors.map((colorName) => {
                const colorOption = colorOptions.find(c => c.name === colorName);
                return (
                  <View key={colorName} style={styles.selectedColorChip}>
                    <View style={[styles.colorDot, { backgroundColor: colorOption?.color }]} />
                    <Text style={styles.selectedColorText}>{colorName}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Add Product to Catalog</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Color Selection Modal */}
      <Modal
        visible={showColorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowColorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Colors</Text>
              <TouchableOpacity onPress={() => setShowColorModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {colorOptions.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption.id}
                  style={styles.colorOption}
                  onPress={() => toggleColor(colorOption.name)}
                >
                  <View style={[styles.colorDot, { backgroundColor: colorOption.color }]} />
                  <Text style={styles.colorOptionText}>{colorOption.name}</Text>
                  {selectedColors.includes(colorOption.name) && (
                    <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.modalDoneButton}
              onPress={() => setShowColorModal(false)}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E9D5FF',
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  imageUploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreview: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorSelectorText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedColorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  selectedColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  selectedColorText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  colorOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  modalDoneButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});