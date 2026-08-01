// Central API configuration.
// Prefer EXPO_PUBLIC_API_URL from .env (device/tunnel/production).
// Falls back to localhost for local Expo/web development.
const raw = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const API_BASE_URL = raw.includes('/api/v1') ? raw : `${raw}/api/v1`;
