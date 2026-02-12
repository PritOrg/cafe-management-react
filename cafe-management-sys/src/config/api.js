// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },
  MENU: {
    LIST: '/menu',
    ITEM: (id) => `/menu/${id}`,
    CREATE: '/menu',
    UPDATE: (id) => `/menu/${id}`,
    DELETE: (id) => `/menu/${id}`,
  },
  ORDERS: {
    LIST: '/orders',
    MINE: '/orders/mine',
    ITEM: (id) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
  },
  STAFF: {
    LIST: '/staff',
    ITEM: (id) => `/staff/${id}`,
    CREATE: '/staff',
    UPDATE: (id) => `/staff/${id}`,
    DELETE: (id) => `/staff/${id}`,
  },
  INVENTORY: {
    LIST: '/inventory',
    ITEM: (id) => `/inventory/${id}`,
    CREATE: '/inventory',
    UPDATE: (id) => `/inventory/${id}`,
    DELETE: (id) => `/inventory/${id}`,
  },
};