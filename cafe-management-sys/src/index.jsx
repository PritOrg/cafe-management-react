import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/outfit';
import App from './App';
import { CartProvider } from './components/CartContext';
import { AuthProvider, ThemeContextProvider, BrandProvider, CustomerProvider } from './contexts';
import ThemeProvider from './components/common/ThemeProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));

// PWA offline shell — only in production builds (dev relies on Vite HMR).
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// StrictMode double-invokes renders/effects in dev — suspected cause of the
// one-char-then-blur on inputs when running the dev server. Removed for the
// experiment; production builds are unaffected either way.
root.render(
  <BrowserRouter>
      <AuthProvider>
        <BrandProvider>
          <CustomerProvider>
            <ThemeContextProvider>
              <ThemeProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </ThemeProvider>
            </ThemeContextProvider>
          </CustomerProvider>
        </BrandProvider>
      </AuthProvider>
    </BrowserRouter>
);
