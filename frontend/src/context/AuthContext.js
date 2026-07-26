import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Configure axios defaults
  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
  }, []);

  // Check for stored token on app start
  useEffect(() => {
    checkStoredToken();
  }, []);

  const checkStoredToken = async () => {
    try {
      // Add a small delay to ensure AsyncStorage is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          // Clear invalid data
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
    } finally {
      // Always set loading to false, even if there's an error
      setLoading(false);
    }
  };

  // Safety timeout to ensure loading never sticks
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
      });

      const { access_token, user_id, role } = response.data;
      
      // Get user details
      const userResponse = await axios.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userData = userResponse.data;
      
      // Store token and user data
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(access_token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);

      // Auto-login after successful registration
      const loginResult = await login(userData.email, userData.password);
      
      if (loginResult.success) {
        return { success: true, data: response.data, user: loginResult.user };
      } else {
        // Registration succeeded but auto-login failed
        return { 
          success: true, 
          data: response.data, 
          message: 'Registration successful! Please login.',
          autoLoginFailed: true
        };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};