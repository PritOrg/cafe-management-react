import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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
  }, []);

  const login = useCallback((userData, token, userType) => {
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
  }, []);

  const logout = useCallback(() => {
    clearStored();
    setUser(null);
    setIsAuthenticated(false);
    return true;
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const newUserData = { ...prev, ...updatedUserData };
      try {
        sessionStorage.setItem('user', JSON.stringify(newUserData));
        localStorage.setItem('user', JSON.stringify(newUserData));
      } catch (error) {
        console.error('Error updating user:', error);
        return prev;
      }
      return newUserData;
    });
    return true;
  }, []);

  const getAuthToken = useCallback(
    () => sessionStorage.getItem('token') || localStorage.getItem('token'),
    []
  );

  const value = useMemo(() => {
    const isPlatformAdmin = () => !!(user && user.isPlatformAdmin);
    const isAdmin = () => !!user && (user.role === 'admin' || user.isPlatformAdmin === true);
    const isStaff = () => !!user && (
      user.role === 'admin' || user.role === 'staff' || user.isPlatformAdmin === true
    );
    return {
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
  }, [user, loading, isAuthenticated, login, logout, updateUser, getAuthToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
