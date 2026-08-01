import { Platform } from 'react-native';

// Your PC LAN IP (Expo Go on a physical phone). Update if Wi‑Fi IP changes.
const LAN_HOST = 'http://10.22.86.116:8000';
const LOCAL_HOST = 'http://localhost:8000';

const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

function resolveHost() {
  // Ignore dead localtunnel URLs that cause 503 on login
  if (envUrl && !/loca\.lt/i.test(envUrl)) {
    return envUrl;
  }

  // Web / same machine → localhost
  if (Platform.OS === 'web') {
    return LOCAL_HOST;
  }

  // Expo Go / native device on same Wi‑Fi → LAN IP
  return LAN_HOST;
}

const host = resolveHost();
export const API_BASE_URL = host.includes('/api/v1') ? host : `${host}/api/v1`;
