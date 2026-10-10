import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI, unwrap } from '../services/api';
import { buildManifest } from '../utils/brandManifest';

const env = import.meta.env || {};

const DEFAULT_BRAND = {
  title: env.VITE_DEFAULT_BRAND_NAME || 'Restaurant',
  logoUrl: '',
  primaryColor: env.VITE_DEFAULT_PRIMARY_COLOR || '#ff6b35',
  accentColor: env.VITE_DEFAULT_ACCENT_COLOR || '#f7931e',
};

const BrandContext = createContext({
  brand: DEFAULT_BRAND,
  loading: false,
  refresh: async () => {},
});

export const useBrand = () => useContext(BrandContext);

const isBrowser = typeof document !== 'undefined' && typeof window !== 'undefined';

const applyTitle = (title) => {
  if (isBrowser && title) document.title = title;
};

const applyThemeColor = (color) => {
  if (!isBrowser || !color) return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
};

const applyFavicon = (logoUrl) => {
  if (!isBrowser || !logoUrl) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'icon');
    document.head.appendChild(link);
  }
  link.setAttribute('href', logoUrl);
};

let manifestUrl = null;
const applyManifest = (brand) => {
  if (!isBrowser || typeof Blob === 'undefined' || !window.URL?.createObjectURL) return;
  const manifest = buildManifest(brand, window.location.origin);
  const nextUrl = window.URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
  let link = document.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'manifest');
    document.head.appendChild(link);
  }
  link.setAttribute('href', nextUrl);
  if (manifestUrl) window.URL.revokeObjectURL(manifestUrl);
  manifestUrl = nextUrl;
};

/** Runtime white-label: title, theme-color, favicon and PWA manifest from settings. */
const applyBrandToDocument = (brand) => {
  applyTitle(brand.title);
  applyThemeColor(brand.primaryColor);
  applyFavicon(brand.logoUrl);
  applyManifest(brand);
};

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);

  const loadBrand = useCallback(async () => {
    try {
      setLoading(true);
      const body = await settingsAPI.getPublic();
      const data = unwrap(body) || {};
      const next = { ...DEFAULT_BRAND, ...(data.brand || {}) };
      setBrand(next);
      applyBrandToDocument(next);
    } catch (err) {
      console.error('Failed to load brand settings:', err);
      applyBrandToDocument(DEFAULT_BRAND);
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
