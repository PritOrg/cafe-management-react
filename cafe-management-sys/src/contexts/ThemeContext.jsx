import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

const getInitialMode = () => {
  const saved = typeof localStorage !== 'undefined' && localStorage.getItem('themeMode');
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersDark = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const ThemeContextProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  const setThemeMode = useCallback((newMode) => {
    if (newMode !== 'light' && newMode !== 'dark') return;
    setMode(newMode);
    try { localStorage.setItem('themeMode', newMode); } catch { /* ignore */ }
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('themeMode', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Follow system preference only until the user makes an explicit choice.
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('themeMode')) setMode(e.matches ? 'dark' : 'light');
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const value = useMemo(
    () => ({ mode, isDarkMode: mode === 'dark', toggleMode, setThemeMode }),
    [mode, toggleMode, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeContextProvider');
  }
  return context;
};

export default ThemeContext;
