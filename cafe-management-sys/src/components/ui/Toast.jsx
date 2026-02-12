import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Slide,
  Grow,
  Fade,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// Toast Context
const ToastContext = createContext();

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      severity: options.severity || 'info',
      duration: options.duration || 6000,
      action: options.action,
      title: options.title,
      persistent: options.persistent || false,
      ...options,
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove toast if not persistent
    if (!toast.persistent) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options) => 
    addToast(message, { ...options, severity: 'success' }), [addToast]);
  
  const error = useCallback((message, options) => 
    addToast(message, { ...options, severity: 'error' }), [addToast]);
  
  const warning = useCallback((message, options) => 
    addToast(message, { ...options, severity: 'warning' }), [addToast]);
  
  const info = useCallback((message, options) => 
    addToast(message, { ...options, severity: 'info' }), [addToast]);

  const value = {
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
    toasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
          index={index}
        />
      ))}
    </>
  );
};

// Individual Toast Item Component
const ToastItem = ({ toast, onClose, index }) => {
  const TransitionComponent = toast.transition || Slide;
  
  const transitionProps = {
    direction: 'up',
    timeout: 300,
    ...(toast.transitionProps || {}),
  };

  return (
    <Snackbar
      open={true}
      onClose={onClose}
      TransitionComponent={TransitionComponent}
      TransitionProps={transitionProps}
      anchorOrigin={{
        vertical: toast.vertical || 'bottom',
        horizontal: toast.horizontal || 'left',
      }}
      sx={{
        position: 'fixed',
        bottom: 16 + (index * 70), // Stack toasts
        zIndex: (theme) => theme.zIndex.snackbar + index,
      }}
    >
      <Alert
        severity={toast.severity}
        variant={toast.variant || 'filled'}
        onClose={onClose}
        action={
          toast.action || (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
        sx={{
          minWidth: 300,
          maxWidth: 500,
          boxShadow: (theme) => theme.shadows[6],
          '& .MuiAlert-message': {
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          },
        }}
      >
        {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
        {toast.message}
      </Alert>
    </Snackbar>
  );
};

// Hook to use Toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Higher-order component for easy integration
export const withToast = (Component) => {
  return (props) => (
    <ToastProvider>
      <Component {...props} />
    </ToastProvider>
  );
};

export default ToastProvider;
