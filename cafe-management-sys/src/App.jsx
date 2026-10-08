import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Components and layouts (direct imports — avoids pulling the whole component
// barrel into the initial bundle)
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import AdminRoute from './components/common/AdminRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { LoadingProvider } from './components/ui/GlobalLoading';
import { ConfirmProvider } from './components/ui/ConfirmDialog';

// Lazy pages — smaller first load on mobile
const LandingPage = lazy(() => import('./pages/customer/LandingPage.jsx').then((m) => ({ default: m.LandingPage || m.default })));
const LoginRegisterPage = lazy(() => import('./pages/customer/LoginRegisterPage.jsx').then((m) => ({ default: m.LoginRegisterPage || m.default })));
const MenuPage = lazy(() => import('./pages/customer/MenuPage.jsx').then((m) => ({ default: m.MenuPage || m.default })));
const CartPage = lazy(() => import('./pages/customer/CartPage.jsx').then((m) => ({ default: m.CartPage || m.default })));
const OrderHistoryPage = lazy(() => import('./pages/customer/OrderHistoryPage.jsx').then((m) => ({ default: m.OrderHistoryPage || m.default })));
const NotFound = lazy(() => import('./pages/NotFound.jsx').then((m) => ({ default: m.NotFound || m.default })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx').then((m) => ({ default: m.AdminDashboard || m.default })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders.jsx').then((m) => ({ default: m.AdminOrders || m.default })));
const AdminMenu = lazy(() => import('./pages/admin/AdminMenu.jsx').then((m) => ({ default: m.AdminMenu || m.default })));
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff.jsx').then((m) => ({ default: m.AdminStaff || m.default })));
const AdminRevenue = lazy(() => import('./pages/admin/AdminRevenue.jsx').then((m) => ({ default: m.AdminRevenue || m.default })));
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory.jsx').then((m) => ({ default: m.AdminInventory || m.default })));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics.jsx').then((m) => ({ default: m.AdminAnalytics || m.default })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx').then((m) => ({ default: m.AdminSettings || m.default })));
const AddMenuItemForm = lazy(() => import('./pages/admin/AddMenuItemForm.jsx').then((m) => ({ default: m.AddMenuItemForm || m.default })));
const AdminTenants = lazy(() => import('./pages/admin/AdminTenants.jsx').then((m) => ({ default: m.AdminTenants || m.default })));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers.jsx').then((m) => ({ default: m.AdminCustomers || m.default })));
const AdminKitchen = lazy(() => import('./pages/admin/AdminKitchen.jsx').then((m) => ({ default: m.AdminKitchen || m.default })));
const AdminActivity = lazy(() => import('./pages/admin/AdminActivity.jsx').then((m) => ({ default: m.AdminActivity || m.default })));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices.jsx').then((m) => ({ default: m.AdminInvoices || m.default })));

const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <LoadingProvider>
          <ConfirmProvider>
            <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}>Loading…</Box>}>
              <Routes>
                {/* Customer Routes */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="login-register" element={<LoginRegisterPage />} />
                  <Route path="menu" element={<MenuPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="orders" element={<OrderHistoryPage />} />
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
                  <Route path="tenants" element={<AdminTenants />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="kitchen" element={<AdminKitchen />} />
                  <Route path="kds" element={<Navigate to="/admin/kitchen" replace />} />
                  <Route path="activity" element={<AdminActivity />} />
                  <Route path="invoices" element={<AdminInvoices />} />
                </Route>

                <Route
                  path="/menu/add"
                  element={
                    <AdminRoute>
                      <Navigate to="/admin/menu/add" replace />
                    </AdminRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ConfirmProvider>
        </LoadingProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
