import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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
  // Force re-render counter - increments on logout to force NavigationContainer remount
  const [logoutCounter, setLogoutCounter] = useState(0);

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
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
    } finally {
      setLoading(false);
    }
  };

  // Safety timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [loading]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
      });

      const { access_token, user_id, role } = response.data;
      
      const userResponse = await axios.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userData = userResponse.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
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
      const loginResult = await login(userData.email, userData.password);
      
      if (loginResult.success) {
        return { success: true, data: response.data, user: loginResult.user };
      } else {
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
      console.log('🔵 AuthContext: Starting logout...');
      
      // 1. Save token before clearing anything (for API call)
      const savedToken = await AsyncStorage.getItem('token');
      console.log('🔵 AuthContext: Token from storage:', savedToken ? 'YES' : 'NO');
      
      // 2. Call logout API FIRST with valid token (before clearing)
      // This is critical - we must call the API while we still have the token
      let apiSuccess = false;
      if (savedToken) {
        try {
          console.log('🔵 AuthContext: Making POST to /auth/logout');
          console.log('🔵 AuthContext: With token:', savedToken.substring(0, 20) + '...');
          
          const response = await axios.post('/auth/logout', {}, {
            headers: { 
              Authorization: `Bearer ${savedToken}` 
            },
            timeout: 5000
          });
          
          console.log('✅ AuthContext: Logout API responded:', response.status);
          console.log('✅ AuthContext: Response data:', response.data);
          apiSuccess = true;
        } catch (apiError) {
          console.error('⚠️ AuthContext: Logout API error:', apiError.message);
          if (apiError.response) {
            console.error('⚠️ AuthContext: Response status:', apiError.response.status);
            console.error('⚠️ AuthContext: Response data:', apiError.response.data);
          }
          // Continue with logout even if API call fails
        }
      } else {
        console.warn('⚠️ AuthContext: No token found in storage');
      }
      
      // 3. Clear stored data
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        console.log('🔵 AuthContext: AsyncStorage cleared');
      } catch (storageError) {
        console.error('Storage clear error:', storageError);
      }
      
      // 4. Clear auth header from axios defaults
      delete axios.defaults.headers.common['Authorization'];
      
      // 5. Reset state - this triggers navigation remount via the key prop
      setUser(null);
      setToken(null);
      setLogoutCounter(prev => prev + 1);
      console.log('🔵 AuthContext: State reset, logoutCounter incremented');
      
      return { 
        success: true, 
        apiSuccess 
      };
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
      return { 
        success: false, 
        error: 'Failed to logout. Please try again.' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    logoutCounter,
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