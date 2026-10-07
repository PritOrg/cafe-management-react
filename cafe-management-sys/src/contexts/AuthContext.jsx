import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const readStored = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const rawUser = sessionStorage.getItem('user') || localStorage.getItem('user');
  const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
  return { token, rawUser, userType };
};

const clearStored = () => {
  ['token', 'user', 'userType'].forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const { token, rawUser, userType } = readStored();
        if (token && rawUser) {
          const parsedUser = JSON.parse(rawUser);
          if (userType) parsedUser.userType = userType;
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        clearStored();
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = (userData, token, userType) => {
    try {
      const nextUser = { ...userData, userType: userType || userData?.userType || 'staffOrAdmin' };
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(nextUser));
      sessionStorage.setItem('userType', nextUser.userType);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(nextUser));
      localStorage.setItem('userType', nextUser.userType);
      setUser(nextUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = () => {
    try {
      clearStored();
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
      sessionStorage.setItem('user', JSON.stringify(newUserData));
      localStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const getAuthToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

  const isPlatformAdmin = () => !!(user && user.isPlatformAdmin);

  const isAdmin = () => {
    if (!user) return false;
    return user.role === 'admin' || user.isPlatformAdmin === true;
  };

  const isStaff = () => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'staff' || user.isPlatformAdmin === true;
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
    isPlatformAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
