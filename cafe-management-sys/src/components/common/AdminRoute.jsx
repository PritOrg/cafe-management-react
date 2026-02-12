import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box, Typography, Paper, Button } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

/**
 * AdminRoute component that restricts access to admin users only
 * Redirects to login page if user is not authenticated
 * Shows access denied if user is authenticated but not an admin
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="body1" color="text.secondary">
          Verifying your credentials...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login-register" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 500,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <LockOutlined color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom color="error.main">
            Access Denied
          </Typography>
          <Typography variant="body1" paragraph>
            You don't have permission to access this area. This section is restricted to administrators only.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = '/'}
            sx={{ mt: 2 }}
          >
            Return to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  // Render children if authenticated and admin
  return children;
};

export default AdminRoute;