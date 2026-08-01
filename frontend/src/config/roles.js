/** RBAC roles used across the app (must match backend). */
export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  OPS_ADMIN: 'ops_admin',
};

export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.OPS_ADMIN];

export const ALL_ROLES = [ROLES.CUSTOMER, ROLES.ADMIN, ROLES.OPS_ADMIN];

export function normalizeRole(role) {
  if (!role || typeof role !== 'string') return null;
  return role.trim().toLowerCase();
}

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(normalizeRole(role));
}

export function isCustomerRole(role) {
  return normalizeRole(role) === ROLES.CUSTOMER;
}

export function isKnownRole(role) {
  return ALL_ROLES.includes(normalizeRole(role));
}

/**
 * Map authenticated user -> root navigator state.
 * Unknown/missing roles fall back to auth (force re-login).
 */
export function resolveAuthDisplayState(user) {
  if (!user) return 'auth';

  const role = normalizeRole(user.role);
  if (!role || !isKnownRole(role)) return 'auth';
  if (isAdminRole(role)) return 'admin';
  return 'customer';
}
