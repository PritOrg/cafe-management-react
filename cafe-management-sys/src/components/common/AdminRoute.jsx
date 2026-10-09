import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box, Typography, Paper, Button } from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';

/**
 * AdminRoute guards the /admin area. Staff and admins may enter; the backend
 * enforces finer permissions per endpoint (ensureAdmin vs ensureAdminOrStaff).
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
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

  if (!isAuthenticated) {
    return <Navigate to="/login-register" state={{ from: location }} replace />;
  }

  if (!isStaff()) {
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
            You don't have permission to access this area. This section is restricted to staff and administrators only.
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

  return children;
};

export default AdminRoute;