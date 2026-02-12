import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  IconButton,
  Alert,
  Slide,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Help as QuestionIcon,
} from '@mui/icons-material';

// Confirmation Context
const ConfirmContext = createContext();

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Icon mapping for different types
const getIcon = (type, color) => {
  const iconProps = { sx: { fontSize: 48, color } };
  
  switch (type) {
    case 'warning':
      return <WarningIcon {...iconProps} />;
    case 'error':
    case 'danger':
      return <ErrorIcon {...iconProps} />;
    case 'success':
      return <SuccessIcon {...iconProps} />;
    case 'info':
      return <InfoIcon {...iconProps} />;
    case 'question':
    default:
      return <QuestionIcon {...iconProps} />;
  }
};

// Color mapping for different types
const getColors = (type, theme) => {
  switch (type) {
    case 'warning':
      return {
        iconColor: theme.palette.warning.main,
        confirmColor: 'warning',
      };
    case 'error':
    case 'danger':
      return {
        iconColor: theme.palette.error.main,
        confirmColor: 'error',
      };
    case 'success':
      return {
        iconColor: theme.palette.success.main,
        confirmColor: 'success',
      };
    case 'info':
      return {
        iconColor: theme.palette.info.main,
        confirmColor: 'info',
      };
    case 'question':
    default:
      return {
        iconColor: theme.palette.primary.main,
        confirmColor: 'primary',
      };
  }
};

// Confirmation Provider Component
export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    type: 'question',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    showCancel: true,
    dangerous: false,
    details: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        open: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        type: options.type || 'question',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        showCancel: options.showCancel !== false,
        dangerous: options.dangerous || false,
        details: options.details || null,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setConfirmState(prev => ({ ...prev, open: false }));
  }, []);

  // Convenience methods
  const confirmDelete = useCallback((message, options = {}) => {
    return confirm({
      title: 'Delete Confirmation',
      message: message || 'This action cannot be undone.',
      type: 'error',
      confirmText: 'Delete',
      dangerous: true,
      ...options,
    });
  }, [confirm]);

  const confirmWarning = useCallback((message, options = {}) => {
    return confirm({
      title: 'Warning',
      message,
      type: 'warning',
      confirmText: 'Proceed',
      ...options,
    });
  }, [confirm]);

  const confirmInfo = useCallback((message, options = {}) => {
    return confirm({
      title: 'Information',
      message,
      type: 'info',
      confirmText: 'OK',
      showCancel: false,
      ...options,
    });
  }, [confirm]);

  const value = {
    confirm,
    confirmDelete,
    confirmWarning,
    confirmInfo,
    closeDialog,
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog confirmState={confirmState} />
    </ConfirmContext.Provider>
  );
};

// Confirmation Dialog Component
const ConfirmDialog = ({ confirmState }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { iconColor, confirmColor } = getColors(confirmState.type, theme);

  const handleConfirm = () => {
    if (confirmState.onConfirm) {
      confirmState.onConfirm();
    }
  };

  const handleCancel = () => {
    if (confirmState.onCancel) {
      confirmState.onCancel();
    }
  };

  return (
    <Dialog
      open={confirmState.open}
      onClose={handleCancel}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getIcon(confirmState.type, iconColor)}
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {confirmState.title}
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleCancel}
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {confirmState.message}
        </Typography>

        {confirmState.details && (
          <Alert severity={confirmState.type} sx={{ mt: 2 }}>
            {confirmState.details}
          </Alert>
        )}

        {confirmState.dangerous && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        {confirmState.showCancel && (
          <Button
            onClick={handleCancel}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {confirmState.cancelText}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmColor}
          sx={{ 
            minWidth: 100,
            ...(confirmState.dangerous && {
              backgroundColor: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.error.dark,
              },
            }),
          }}
          autoFocus
        >
          {confirmState.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Hook to use Confirmation
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export default ConfirmProvider;
