import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import * as Sentry from '@sentry/react';

// Layout components
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin pages
import Products from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';
import Orders from './pages/admin/Orders';
import OrderDetails from './pages/admin/OrderDetails';
import Users from './pages/admin/Users';
import UserDetails from './pages/admin/UserDetails';
import Settings from './pages/admin/Settings';

// Sentry setup
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENVIRONMENT || 'development',
    tracesSampleRate: 1.0,
  });
}

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading, adminRole } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!adminRole) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You do not have admin privileges to access this dashboard.</p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected admin routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        
        {/* Products */}
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        
        {/* Orders */}
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        
        {/* Users */}
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetails />} />
        
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default Sentry.withProfiler(App);
