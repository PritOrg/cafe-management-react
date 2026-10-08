import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/outfit';
import App from './App';
import { CartProvider } from './components/CartContext';
import { AuthProvider, ThemeContextProvider, BrandProvider, CustomerProvider } from './contexts';
import ThemeProvider from './components/common/ThemeProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
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
  </React.StrictMode>
);
