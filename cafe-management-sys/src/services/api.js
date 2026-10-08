// API Configuration — all product endpoints are versioned under /api/v1
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4969/api/v1';

/**
 * The server resolves the tenant from the request Host header. In dev the app is
 * often served from a tenant subdomain (cafe2.localhost:3000) while the API lives
 * on a different port — so mirror the frontend's subdomain onto the API host
 * (cafe2.localhost:4969) to hit the right restaurant's menu/branding.
 * No-op for relative URLs, bare hosts (localhost), and www.
 */
const BASE_HOSTS = new Set(['localhost', 'www']);

const isIpAddress = (hostname) =>
  /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');

export const tenantSlugFromHost = () => {
  if (typeof window === 'undefined') return null;
  const hostname = (window.location.hostname || '').toLowerCase();
  if (!hostname || isIpAddress(hostname)) return null;
  const labels = hostname.split('.');
  if (labels.length < 2) return null;
  const first = labels[0];
  if (BASE_HOSTS.has(first)) return null;
  return first;
};

const resolveApiBaseUrl = (raw) => {
  if (typeof window === 'undefined' || !/^https?:\/\//i.test(raw)) return raw;
  try {
    const slug = tenantSlugFromHost();
    if (!slug) return raw;
    const url = new URL(raw);
    if (url.hostname === 'localhost' || isIpAddress(url.hostname)) {
      url.hostname = `${slug}.${url.hostname}`;
    } else {
      const labels = url.hostname.split('.');
      labels[0] = slug;
      url.hostname = labels.join('.');
    }
    return url.toString();
  } catch {
    return raw;
  }
};

const API_BASE_URL = resolveApiBaseUrl(RAW_API_URL);

// Helper function to get auth token (sessionStorage preferred, localStorage fallback)
const getAuthToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (includeAuth = true, isFormData = false) => {
  const headers = {};

  // Correlate client requests with server access logs
  headers['X-Request-Id'] =
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  // Don't set Content-Type for FormData - browser will set it with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request function with enhanced error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: createHeaders(options.auth !== false, options.isFormData),
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific HTTP status codes
      switch (response.status) {
        case 400:
          throw new Error(errorData.message || 'Invalid request data');
        case 401:
          throw new Error(errorData.message || 'Authentication required');
        case 403:
          throw new Error(errorData.message || 'Access denied');
        case 404:
          throw new Error(errorData.message || 'Resource not found');
        case 409:
          throw new Error(errorData.message || 'Resource already exists');
        case 429:
          throw new Error(errorData.message || 'Too many requests. Please try again later.');
        case 500:
          throw new Error(errorData.message || 'Server error. Please try again later.');
        default:
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    }

    return await response.json().then((body) => {
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        const serverRequestId = response.headers.get('X-Request-Id');
        if (serverRequestId && !body.requestId) {
          body.requestId = serverRequestId;
        }
      }
      return body;
    });
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Unwrap standardized { success, message, data } envelope; pass through raw payloads
export const unwrap = (body) => (body != null && body.data !== undefined ? body.data : body);

export const authAPI = {
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      auth: false,
    }),

  registerStaff: (formData) =>
    apiRequest('/auth/register/staff', {
      method: 'POST',
      body: formData,
      auth: false,
      isFormData: true,
    }),

  logout: () => {
    ['token', 'user', 'userType'].forEach((key) => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  },

  getCurrentUser: () => {
    try {
      const user = sessionStorage.getItem('user') || localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    return !!(sessionStorage.getItem('token') || localStorage.getItem('token'));
  },

  getUserType: () => {
    return sessionStorage.getItem('userType') || localStorage.getItem('userType');
  },
};

// Menu API
export const menuAPI = {
  getAll: () => apiRequest('/menu', { auth: false }),
  
  getById: (id) => apiRequest(`/menu/${id}`, { auth: false }),
  
  create: (menuData) =>
    apiRequest('/menu', {
      method: 'POST',
      body: menuData,
      isFormData: typeof FormData !== 'undefined' && menuData instanceof FormData,
    }),
    
  update: (id, menuData) => 
    apiRequest(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
    }),

  // Multipart update (supports an image file on edit/replace)
  updateForm: (id, formData) =>
    apiRequest(`/menu/${id}`, {
      method: 'PUT',
      body: formData,
      isFormData: true,
    }),
    
  delete: (id) => 
    apiRequest(`/menu/${id}`, {
      method: 'DELETE',
    }),
};



// Staff API
export const staffAPI = {
  getAll: () => apiRequest('/staff-admin'),
  
  add: (staffData) => 
    apiRequest('/staff-admin', {
      method: 'POST',
      body: JSON.stringify(staffData),
    }),
    
  update: (id, staffData) => 
    apiRequest(`/staff-admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    }),
    
  remove: (id) => 
    apiRequest(`/staff-admin/${id}`, {
      method: 'DELETE',
    }),
};

// Customers API (Phase K)
export const customersAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/customers${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => apiRequest(`/customers/${id}`),
  getOrders: (id) => apiRequest(`/customers/${id}/orders`),
  getSummary: (id) => apiRequest(`/customers/${id}/summary`),
  softDelete: (id) => apiRequest(`/customers/${id}`, { method: 'DELETE' }),
};

// Invoices API (Phase L)
export const invoicesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/invoices${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => apiRequest(`/invoices/${id}`),
  issueForOrder: (orderId, body = {}) =>
    apiRequest(`/orders/${orderId}/invoice`, { method: 'POST', body: JSON.stringify(body) }),
  void: (id, reason) =>
    apiRequest(`/invoices/${id}/void`, { method: 'POST', body: JSON.stringify({ reason }) }),
  pdfUrl: (id, format = 'a4') =>
    `${API_BASE_URL}/invoices/${id}/pdf?format=${format}`,
};

// Inventory API (Phase H)
export const inventoryAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/inventory${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => apiRequest(`/inventory/${id}`),
  create: (data) => apiRequest('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/inventory/${id}`, { method: 'DELETE' }),
  addMovement: (id, data) =>
    apiRequest(`/inventory/${id}/movements`, { method: 'POST', body: JSON.stringify(data) }),
  listRecipesForItem: (id) => apiRequest(`/inventory/${id}/recipes`),
  listRecipesForMenu: (menuId) => apiRequest(`/inventory/recipes/menu/${menuId}`),
  addRecipe: (data) => apiRequest('/inventory/recipes', { method: 'POST', body: JSON.stringify(data) }),
  removeRecipe: (id) => apiRequest(`/inventory/recipes/${id}`, { method: 'DELETE' }),
};

// Activity log API (Phase G)
export const activityAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/activity${qs ? `?${qs}` : ''}`);
  },
  byEntity: (type, id) => apiRequest(`/activity/entity/${encodeURIComponent(type)}/${encodeURIComponent(id)}`),
};

// Categories API
export const categoriesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/categories${qs ? `?${qs}` : ''}`);
  },
  create: (data) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),
};

// Modifier groups API (priced customization options)
export const modifiersAPI = {
  list: () => apiRequest('/modifiers'),
  create: (data) => apiRequest('/modifiers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/modifiers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/modifiers/${id}`, { method: 'DELETE' }),
};

// Kitchen display API
export const kitchenAPI = {
  getActiveOrders: () => apiRequest('/kitchen/orders'),
};

// Orders API
export const ordersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/orders${queryString ? `?${queryString}` : ''}`);
  },

  getToday: () => apiRequest('/orders?today=true'),

  getRecent: (limit = 5) => apiRequest(`/orders?limit=${limit}`),

  getByStatus: (status) => apiRequest(`/orders?status=${status}`),

  getHistory: (phone) => apiRequest(`/orders/history?phone=${encodeURIComponent(phone)}`),

  getById: (id) => apiRequest(`/orders/${id}`),

  updateStatus: (id, status) => apiRequest(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  create: (orderData) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
};

// Tenants API (platform admin)
export const tenantsAPI = {
  getAll: () => apiRequest('/tenants'),
  create: (data) => apiRequest('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// Settings API
export const settingsAPI = {
  getPublic: () => apiRequest('/settings/public', { auth: false }),
  get: () => apiRequest('/settings'),
  update: (data) => apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// Dashboard/Analytics API — real /api/v1/analytics endpoints (no silent mocks)
export const analyticsAPI = {
  getSummary: () => apiRequest('/analytics/summary'),
  getSales: (period = '30d') => apiRequest(`/analytics/sales?period=${encodeURIComponent(period)}`),
  getOrderStats: (period = '30d') => apiRequest(`/analytics/orders?period=${encodeURIComponent(period)}`),
  getTopItems: (period = '30d', limit = 10) =>
    apiRequest(`/analytics/top-items?period=${encodeURIComponent(period)}&limit=${limit}`),
  getCategoryMix: (period = '30d') => apiRequest(`/analytics/category-mix?period=${encodeURIComponent(period)}`),

  // Back-compat names used by existing admin pages
  getDashboardStats: () => apiRequest('/analytics/summary'),
  getRevenueStats: (period = '30d') => apiRequest(`/analytics/sales?period=${encodeURIComponent(period)}`),
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health', { auth: false }),
};

const api = {
  auth: authAPI,
  menu: menuAPI,
  orders: ordersAPI,
  staff: staffAPI,
  customers: customersAPI,
  invoices: invoicesAPI,
  tenants: tenantsAPI,
  settings: settingsAPI,
  analytics: analyticsAPI,
  inventory: inventoryAPI,
  activity: activityAPI,
  health: healthAPI,
  unwrap,
};

export default api;
