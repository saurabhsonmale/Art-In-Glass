/**
 * Single source of truth: EXPO_PUBLIC_API_URL from frontend/.env
 * Fallback keeps APK working if env is missing at build time.
 */

const LIVE_HOST = 'https://art-in-glass.onrender.com';

const envUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/$/, '');

function resolveHost() {
  if (envUrl && !/loca\.lt/i.test(envUrl)) {
    return envUrl;
  }
  return LIVE_HOST;
}

const host = resolveHost();
export const API_BASE_URL = host.includes('/api/v1') ? host : `${host}/api/v1`;
export const API_ORIGIN = host.replace(/\/api\/v1\/?$/, '');
export const IS_LIVE_API =
  /onrender\.com/i.test(API_ORIGIN) || API_ORIGIN.startsWith('https://');

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log(`[API] base=${API_BASE_URL} live=${IS_LIVE_API}`);
}
