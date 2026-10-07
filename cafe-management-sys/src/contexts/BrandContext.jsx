import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI, unwrap } from '../services/api';

const DEFAULT_BRAND = {
  title: 'Cafe Management',
  logoUrl: '',
  primaryColor: '#ff6b35',
  accentColor: '#f7931e',
};

const BrandContext = createContext({
  brand: DEFAULT_BRAND,
  loading: false,
  refresh: async () => {},
});

export const useBrand = () => useContext(BrandContext);

const applyDocumentTitle = (title) => {
  if (typeof document !== 'undefined' && title) {
    document.title = title;
  }
};

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);

  const loadBrand = useCallback(async () => {
    try {
      setLoading(true);
      const body = await settingsAPI.getPublic();
      const data = unwrap(body) || {};
      const next = {
        ...DEFAULT_BRAND,
        ...(data.brand || {}),
      };
      setBrand(next);
      applyDocumentTitle(next.title);
    } catch (err) {
      console.error('Failed to load brand settings:', err);
      applyDocumentTitle(DEFAULT_BRAND.title);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrand();
  }, [loadBrand]);

  const value = React.useMemo(
    () => ({ brand, loading, refresh: loadBrand }),
    [brand, loading, loadBrand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export default BrandContext;
