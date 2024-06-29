import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './pages/LandingPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginRegisterPage from './pages/LoginRegisterPage';
import MenuPage from './pages/MenuPage';
import Layout from './components/Layout';
import AddMenuItemForm from './pages/admin/AddMenuItemForm';
import { CartProvider } from './components/CartContext';
import CartPage from './pages/CartPage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />} >
            <Route index element={<LandingPage />} />
            <Route path="/login-register" element={<LoginRegisterPage />} />
            <Route path='/menu' element={<MenuPage />} />
            <Route path='/menu/add' element={<AddMenuItemForm />} />
            <Route path='/cart' element={<CartPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </>
);
