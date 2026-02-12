import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';

// Components and layouts
import {
  Layout,
  AdminLayout,
  ProtectedRoute,
  AdminRoute,
  ErrorBoundary,
  ToastProvider,
  LoadingProvider,
  ConfirmProvider
} from './components';

// Pages
import { 
  // Customer pages
  LandingPage, 
  LoginRegisterPage, 
  MenuPage, 
  CartPage,
  
  // Admin pages
  AdminDashboard,
  AdminOrders,
  AdminMenu,
  AdminStaff,
  AdminRevenue,
  AdminInventory,
  AdminAnalytics,
  AdminSettings,
  AddMenuItemForm,
  
  // Error pages
  NotFound
} from './pages';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LoadingProvider>
          <ConfirmProvider>
            <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="login-register" element={<LoginRegisterPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route
            path="cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="menu/add" element={<AddMenuItemForm />} />
          <Route path="menu/edit/:id" element={<AddMenuItemForm />} />
          <Route path="staff" element={<AdminStaff />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Legacy redirect for old menu/add route */}
        <Route
          path="/menu/add"
          element={
            <AdminRoute>
              <Navigate to="/admin/menu/add" replace />
            </AdminRoute>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
          </ConfirmProvider>
        </LoadingProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
