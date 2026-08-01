import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  normalizeRole,
  isAdminRole,
  isCustomerRole,
  resolveAuthDisplayState,
  ALL_ROLES,
} from '../config/roles';

const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'user';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

async function clearAuthStorage() {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  } catch (_) {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(AUTH_USER_KEY).catch(() => {});
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  // Increments on logout to force NavigationContainer remount / reset
  const [logoutCounter, setLogoutCounter] = useState(0);

  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
  }, []);

  useEffect(() => {
    checkStoredToken();
  }, []);

  const checkStoredToken = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const role = normalizeRole(userData?.role);

          // Drop sessions with unknown/missing roles (RBAC safety)
          if (!role || !ALL_ROLES.includes(role)) {
            await clearAuthStorage();
          } else {
            const normalizedUser = { ...userData, role };
            setToken(storedToken);
            setUser(normalizedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          }
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          await clearAuthStorage();
        }
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [loading]);

  const applySession = async (accessToken, userData) => {
    const role = normalizeRole(userData?.role) || 'customer';
    const normalizedUser = { ...userData, role };

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));

    setToken(accessToken);
    setUser(normalizedUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    return normalizedUser;
  };

  const clearSessionLocally = useCallback(() => {
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    setLogoutCounter((prev) => prev + 1);
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    try {
      const response = await axios.post('/auth/login', {
        email: normalizedEmail,
        password,
      });

      const { access_token, role, user_id } = response.data;

      let profile = null;
      try {
        const userResponse = await axios.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        profile = userResponse.data;
      } catch (meError) {
        // Still allow login (admin/customer) if /me fails after a valid token
        console.warn('auth/me failed, using login token payload:', meError.message);
        profile = {
          id: user_id,
          email: normalizedEmail,
          role: role || 'customer',
          full_name: isAdminRole(role) ? 'Admin' : 'User',
        };
      }

      // Prefer explicit role from login JWT payload for RBAC routing
      if (role && !profile.role) {
        profile.role = role;
      } else if (role && normalizeRole(profile.role) !== normalizeRole(role)) {
        profile.role = role;
      }

      const userData = await applySession(access_token, profile);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const detail = error.response?.data?.detail;
      return {
        success: false,
        error: typeof detail === 'string' ? detail : 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const loginResult = await login(userData.email, userData.password);

      if (loginResult.success) {
        return { success: true, data: response.data, user: loginResult.user };
      }

      return {
        success: true,
        data: response.data,
        message: 'Registration successful! Please login.',
        autoLoginFailed: true,
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      };
    }
  };

  /**
   * Logout for every RBAC role (customer | admin | ops_admin).
   * Always clears local session first so navigation returns to login.
   */
  const logout = useCallback(
    async (options = {}) => {
      if (loggingOut) {
        return { success: true, alreadyLoggingOut: true };
      }

      setLoggingOut(true);

      const role = normalizeRole(options.role || user?.role);
      let savedToken = token;

      try {
        if (!savedToken) {
          savedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        }
      } catch (storageReadError) {
        console.warn('Could not read token during logout:', storageReadError);
      }

      // 1) Clear local auth immediately (all roles)
      clearSessionLocally();

      // 2) Persist clear
      await clearAuthStorage();

      // 3) Best-effort server revoke (works for all roles; never blocks UI)
      if (savedToken) {
        axios
          .post(
            '/auth/logout',
            {},
            {
              headers: { Authorization: `Bearer ${savedToken}` },
              timeout: 5000,
            }
          )
          .catch((apiError) => {
            console.warn(
              `Logout API error for role=${role || 'unknown'} (local session already cleared):`,
              apiError.message
            );
          });
      }

      setLoggingOut(false);
      return { success: true, role: role || null };
    },
    [loggingOut, token, user, clearSessionLocally]
  );

  const role = normalizeRole(user?.role);
  const displayState = resolveAuthDisplayState(user);

  const value = {
    user,
    token,
    loading,
    loggingOut,
    logoutCounter,
    role,
    isAdmin: isAdminRole(role),
    isCustomer: isCustomerRole(role),
    isAuthenticated: !!user && !!role,
    displayState,
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
