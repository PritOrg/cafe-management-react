import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Backdrop,
  CircularProgress,
  Typography,
  Box,
  LinearProgress,
  Fade,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Loading Context
const LoadingContext = createContext();

// Animated loading dots
const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

const LoadingDot = styled('div')(({ theme, delay = 0 }) => ({
  width: 8,
  height: 8,
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  display: 'inline-block',
  animation: `${bounce} 1.4s ease-in-out ${delay}s infinite both`,
}));

const LoadingDots = () => (
  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 2 }}>
    <LoadingDot delay={0} />
    <LoadingDot delay={0.16} />
    <LoadingDot delay={0.32} />
  </Box>
);

// Loading Provider Component
export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, isLoading, options = {}) => {
    setLoadingStates(prev => {
      if (isLoading) {
        return {
          ...prev,
          [key]: {
            message: options.message || 'Loading...',
            progress: options.progress,
            variant: options.variant || 'circular',
            backdrop: options.backdrop !== false,
            ...options,
          },
        };
      } else {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      }
    });
  }, []);

  const isLoading = useCallback((key) => {
    return key ? !!loadingStates[key] : Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  const getLoadingState = useCallback((key) => {
    return loadingStates[key] || null;
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  // Convenience methods
  const showLoading = useCallback((message, options) => {
    const key = options?.key || 'global';
    setLoading(key, true, { message, ...options });
    return key;
  }, [setLoading]);

  const hideLoading = useCallback((key = 'global') => {
    setLoading(key, false);
  }, [setLoading]);

  const value = {
    setLoading,
    isLoading,
    getLoadingState,
    clearAllLoading,
    showLoading,
    hideLoading,
    loadingStates,
  };

  // Get the primary loading state (first one or global)
  const primaryLoadingKey = Object.keys(loadingStates)[0];
  const primaryLoading = primaryLoadingKey ? loadingStates[primaryLoadingKey] : null;

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {primaryLoading && primaryLoading.backdrop && (
        <LoadingOverlay loading={primaryLoading} />
      )}
    </LoadingContext.Provider>
  );
};

// Loading Overlay Component
const LoadingOverlay = ({ loading }) => {
  if (!loading) return null;

  const renderLoadingContent = () => {
    switch (loading.variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h6" color="white" gutterBottom align="center">
              {loading.message}
            </Typography>
            <LinearProgress 
              variant={loading.progress !== undefined ? 'determinate' : 'indeterminate'}
              value={loading.progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
            {loading.progress !== undefined && (
              <Typography variant="body2" color="white" align="center" sx={{ mt: 1 }}>
                {Math.round(loading.progress)}%
              </Typography>
            )}
          </Box>
        );

      case 'dots':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="white" gutterBottom>
              {loading.message}
            </Typography>
            <LoadingDots />
          </Box>
        );

      case 'minimal':
        return (
          <CircularProgress
            size={40}
            thickness={4}
            sx={{ color: 'white' }}
          />
        );

      default: // circular
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress
              size={60}
              thickness={4}
              sx={{ color: 'white', mb: 2 }}
            />
            <Typography variant="h6" color="white">
              {loading.message}
            </Typography>
            {loading.subtitle && (
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mt: 1 }}>
                {loading.subtitle}
              </Typography>
            )}
          </Box>
        );
    }
  };

  return (
    <Fade in={true} timeout={300}>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1000,
          backgroundColor: loading.backgroundColor || 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
        open={true}
      >
        {renderLoadingContent()}
      </Backdrop>
    </Fade>
  );
};

// Hook to use Loading
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Higher-order component for easy integration
export const withLoading = (Component) => {
  return (props) => (
    <LoadingProvider>
      <Component {...props} />
    </LoadingProvider>
  );
};

export default LoadingProvider;
