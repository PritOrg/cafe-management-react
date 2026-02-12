import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored authentication data on app load
    const checkAuthStatus = () => {
      try {
        // Check both sessionStorage (preferred) and localStorage for compatibility
        const token = sessionStorage.getItem('token') || localStorage.getItem('authToken');
        const userData = sessionStorage.getItem('user') || localStorage.getItem('userData');
        const userType = sessionStorage.getItem('userType');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          // Add userType to user object if available
          if (userType) {
            parsedUser.userType = userType;
          }
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear invalid data from both storages
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userType');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData, token, userType) => {
    try {
      // Store in sessionStorage (preferred) and localStorage (fallback)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      if (userType) {
        sessionStorage.setItem('userType', userType);
        userData.userType = userType;
      }

      // Also store in localStorage for compatibility
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    try {
      // Clear both sessionStorage and localStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userType');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  const updateUser = (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      // Update both storages
      sessionStorage.setItem('user', JSON.stringify(newUserData));
      localStorage.setItem('userData', JSON.stringify(newUserData));
      setUser(newUserData);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const getAuthToken = () => {
    return sessionStorage.getItem('token') || localStorage.getItem('authToken');
  };

  const isAdmin = () => {
    // Check for admin role or staffOrAdmin userType
    if (!user) return false;

    // Check userType first (this is set during login)
    if (user.userType === 'staffOrAdmin') return true;

    // Also check role for backward compatibility
    return user.role === 'admin' || user.role === 'manager';
  };

  const isStaff = () => {
    return user && (
      user.role === 'admin' ||
      user.role === 'manager' ||
      user.role === 'waiter' ||
      user.userType === 'staffOrAdmin'
    );
  };

  const isCustomer = () => {
    return user && user.role === 'customer';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    getAuthToken,
    isAdmin,
    isStaff,
    isCustomer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
