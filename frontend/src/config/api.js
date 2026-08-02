import { Platform } from 'react-native';

/**
 * API host resolution
 * - EXPO_PUBLIC_API_URL wins (frontend/.env or eas.json)
 * - Release APK → live Render
 * - Expo Go / __DEV__ without env → LAN PC IP
 */

const LIVE_HOST = 'https://art-in-glass.onrender.com';

// Update if `ipconfig` IPv4 changes
const LAN_IP = '10.22.86.116';
const LAN_PORT = '8000';
const LAN_HOST = `http://${LAN_IP}:${LAN_PORT}`;
const LOCAL_HOST = 'http://localhost:8000';

const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

function resolveHost() {
  if (envUrl && !/loca\.lt/i.test(envUrl)) {
    return envUrl;
  }

  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return LIVE_HOST;
  }

  if (Platform.OS === 'web') {
    return LOCAL_HOST;
  }

  return LAN_HOST;
}

const host = resolveHost();
export const API_BASE_URL = host.includes('/api/v1') ? host : `${host}/api/v1`;
export const API_ORIGIN = host.replace(/\/api\/v1\/?$/, '');
export const IS_LIVE_API =
  /onrender\.com/i.test(API_ORIGIN) || API_ORIGIN.startsWith('https://');

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log(`[API] base=${API_BASE_URL} live=${IS_LIVE_API}`);
}
