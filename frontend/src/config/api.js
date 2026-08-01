import { Platform } from 'react-native';

// Live backend (Render). Used by APK / production builds.
const LIVE_HOST = 'https://art-in-glass.onrender.com';

// Local / LAN fallbacks for development only.
const LAN_HOST = 'http://10.22.86.116:8000';
const LOCAL_HOST = 'http://localhost:8000';

const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

function resolveHost() {
  // Prefer explicit env (EAS build / .env). Skip dead localtunnel URLs.
  if (envUrl && !/loca\.lt/i.test(envUrl)) {
    return envUrl;
  }

  // Release / preview APK without env → always hit live Render
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return LIVE_HOST;
  }

  // Web / same machine → localhost
  if (Platform.OS === 'web') {
    return LOCAL_HOST;
  }

  // Expo Go on device during local development → LAN IP
  return LAN_HOST;
}

const host = resolveHost();
export const API_BASE_URL = host.includes('/api/v1') ? host : `${host}/api/v1`;
export const API_ORIGIN = host.replace(/\/api\/v1\/?$/, '');
export const IS_LIVE_API = /onrender\.com/i.test(API_ORIGIN) || API_ORIGIN.startsWith('https://');
