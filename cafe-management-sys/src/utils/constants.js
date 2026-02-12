// Application constants
export const API_ENDPOINTS = {
  AUTH: '/auth',
  MENU: '/menu',
  ORDERS: '/orders',
  STAFF: '/staff-admin',
  CUSTOMERS: '/customers',
  ANALYTICS: '/analytics'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login-register',
  MENU: '/menu',
  CART: '/cart',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_MENU: '/admin/menu',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_ANALYTICS: '/admin/analytics'
};

export const THEME_COLORS = {
  PRIMARY: '#ff6b35',
  SECONDARY: '#f7931e',
  SUCCESS: '#4caf50',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  INFO: '#2196f3'
};