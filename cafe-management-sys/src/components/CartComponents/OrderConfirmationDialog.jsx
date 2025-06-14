import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const OrderConfirmationDialog = ({
  open,
  onClose,
  orderConfirmation,
  orderError
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          {orderConfirmation && (
            <>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Order Confirmed!</Typography>
            </>
          )}
          {orderError && (
            <Typography variant="h6" color="error">Order Failed</Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {orderConfirmation && (
          <>
            <Typography gutterBottom>
              Thank you for your order #{orderConfirmation.orderNumber}!
            </Typography>
            <Typography gutterBottom>
              Estimated preparation time: {orderConfirmation.totalPreparationTime} minutes
            </Typography>
            <Typography>
              We've sent a confirmation to your email.
            </Typography>
          </>
        )}
        {orderError && (
          <Typography color="error">
            {orderError}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {orderConfirmation && (
          <>
            <Button 
              component={Link} 
              to="/" 
              color="primary" 
              variant="contained"
              onClick={onClose}
            >
              Back to Home
            </Button>
            <Button 
              component={Link} 
              to="/orders" 
              color="primary"
              onClick={onClose}
            >
              View Orders
            </Button>
          </>
        )}
        {orderError && (
          <Button 
            onClick={onClose}
            color="primary" 
            variant="contained"
          >
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OrderConfirmationDialog;