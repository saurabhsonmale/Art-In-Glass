import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isCartVisible, setIsCartVisible] = useState(false);

  const addToCart = (product, quantity = 1, customization = {}) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.product_id === product.id && 
                item.custom_notes === customization.custom_notes
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        const newItem = {
          product_id: product.id,
          title: product.title,
          price: product.base_price,
          quantity: quantity,
          images: product.images,
          category: product.category,
          custom_notes: customization.custom_notes || null,
          custom_color: customization.custom_color || null,
          custom_image_url: customization.custom_image_url || null,
          estimated_days: product.estimated_days || 3,
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (productId, customNotes = null) => {
    setCartItems(prevItems =>
      prevItems.filter(
        item => !(item.product_id === productId && item.custom_notes === customNotes)
      )
    );
  };

  const updateQuantity = (productId, quantity, customNotes = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, customNotes);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product_id === productId && item.custom_notes === customNotes
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const toggleCart = () => {
    setIsCartVisible(prev => !prev);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isCartVisible,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};