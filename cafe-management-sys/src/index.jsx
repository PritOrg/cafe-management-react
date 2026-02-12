import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './components/CartContext';
import { AuthProvider, ThemeContextProvider } from './contexts';
import { ThemeProvider } from './components';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeContextProvider>
          <ThemeProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ThemeProvider>
        </ThemeContextProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
