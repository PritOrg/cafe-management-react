import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from './pages/customer/LandingPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginRegisterPage from './pages/customer/LoginRegisterPage';
import MenuPage from './pages/customer/MenuPage';
import Layout from './components/Layout';
import AddMenuItemForm from './pages/admin/AddMenuItemForm';
import { CartProvider } from './components/CartContext';
import CartPage from './pages/customer/CartPage';
import AdminDashboard from './pages/admin/AdminDashboard';

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
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </>
);
