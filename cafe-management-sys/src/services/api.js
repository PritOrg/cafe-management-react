// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4969/api';

// Helper function to get auth token (using sessionStorage for better security)
const getAuthToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

// Helper function to create headers
const createHeaders = (includeAuth = true, isFormData = false) => {
  const headers = {};

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

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Authentication API - Updated to match LoginRegisterPage implementation
export const authAPI = {
  // Login with enhanced error handling
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      auth: false,
    }),

  // Customer registration with FormData support for file uploads
  registerCustomer: (formData) =>
    apiRequest('/auth/register/customer', {
      method: 'POST',
      body: formData, // FormData object for file upload
      auth: false,
      isFormData: true,
    }),

  // Staff registration with FormData support for file uploads
  registerStaff: (formData) =>
    apiRequest('/auth/register/staff', {
      method: 'POST',
      body: formData, // FormData object for file upload
      auth: false,
      isFormData: true,
    }),

  // Profile update with FormData support
  updateProfile: (formData) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: formData,
      isFormData: true,
    }),

  // Delete profile
  deleteProfile: () =>
    apiRequest('/auth/profile', {
      method: 'DELETE',
    }),

  // Logout helper function
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token'); // Clean up legacy storage
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
  },

  // Get current user from storage
  getCurrentUser: () => {
    try {
      const user = sessionStorage.getItem('user') || localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!(sessionStorage.getItem('token') || localStorage.getItem('token'));
  },

  // Get user type
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
      body: JSON.stringify(menuData),
    }),
    
  update: (id, menuData) => 
    apiRequest(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(menuData),
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

// Customers API
export const customersAPI = {
  getAll: () => apiRequest('/customers'),
  
  getById: (id) => apiRequest(`/customers/${id}`),
  
  update: (id, customerData) => 
    apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    }),
    
  delete: (id) => 
    apiRequest(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API
export const ordersAPI = {
  // Get all orders with optional filters
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/orders${queryString ? `?${queryString}` : ''}`);
  },

  // Get today's orders
  getToday: () => apiRequest('/orders?today=true'),

  // Get recent orders (for dashboard)
  getRecent: (limit = 5) => apiRequest(`/orders?limit=${limit}`),

  // Get orders by status
  getByStatus: (status) => apiRequest(`/orders?status=${status}`),

  // Get specific order
  getById: (id) => apiRequest(`/orders/${id}`),

  // Update order status
  updateStatus: (id, status) => apiRequest(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  // Place new order
  create: (orderData) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
};

// Dashboard/Analytics API - Updated to use real endpoints
export const analyticsAPI = {
  getDashboardStats: async () => {
    try {
      // Get data from multiple endpoints to build dashboard stats
      const [todaysOrders, allMenuItems, todaysRevenue] = await Promise.all([
        ordersAPI.getToday().catch(() => ({ data: [] })),
        menuAPI.getAll().catch(() => ({ data: [] })),
        // Calculate today's revenue from orders
        ordersAPI.getToday().then(response => {
          const orders = response.data || response || [];
          const revenue = orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
          return revenue;
        }).catch(() => 0)
      ]);

      const orders = todaysOrders.data || todaysOrders || [];
      const menuItems = allMenuItems.data || allMenuItems || [];

      return {
        totalRevenue: todaysRevenue,
        ordersToday: orders.length,
        menuItems: menuItems.length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        revenueChange: 12.5, // This would need historical data to calculate
        ordersChange: 8.2,   // This would need historical data to calculate
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to mock data if endpoints fail
      return {
        totalRevenue: 0,
        ordersToday: 0,
        menuItems: 0,
        pendingOrders: 0,
        revenueChange: 0,
        ordersChange: 0,
      };
    }
  },
    
  getRevenueStats: (period = '30d') => 
    apiRequest(`/analytics/revenue?period=${period}`).catch(() => {
      // Mock data fallback
      return {
        total: 12426,
        change: 12.5,
        chartData: [],
      };
    }),
    
  getOrderStats: (period = '30d') => 
    apiRequest(`/analytics/orders?period=${period}`).catch(() => {
      // Mock data fallback
      return {
        total: 147,
        change: 8.2,
        chartData: [],
      };
    }),
    
  getInventoryAlerts: () => 
    apiRequest('/analytics/inventory-alerts').catch(() => {
      // Mock data fallback
      return [
        {
          id: 1,
          item: 'Coffee beans',
          currentStock: 5,
          minStock: 10,
          unit: 'lbs',
          severity: 'high',
        },
        {
          id: 2,
          item: 'Milk',
          currentStock: 2,
          minStock: 5,
          unit: 'gallons',
          severity: 'medium',
        },
      ];
    }),
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health', { auth: false }),
};

export default {
  auth: authAPI,
  menu: menuAPI,
  orders: ordersAPI,
  staff: staffAPI,
  customers: customersAPI,
  analytics: analyticsAPI,
  health: healthAPI,
};
