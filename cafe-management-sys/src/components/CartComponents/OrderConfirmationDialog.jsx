import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import { Link } from 'react-router-dom';

const OrderConfirmationDialog = ({ open, onClose, orderConfirmation, orderError }) => {
  const order = orderConfirmation?.order || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          {orderConfirmation && (
            <>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h6">Order confirmed</Typography>
            </>
          )}
          {orderError && <Typography variant="h6" color="error">Order failed</Typography>}
        </Box>
      </DialogTitle>

      <DialogContent>
        {orderConfirmation && (
          <>
            <Typography gutterBottom>
              Thank you! Your order <strong>#{orderConfirmation.orderNumber}</strong> is with the kitchen.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ my: 1.5 }} flexWrap="wrap" useFlexGap>
              <Chip size="small" icon={<LocalDiningIcon />} label={`${orderConfirmation.totalPreparationTime ?? 0} min`} />
              {order.tableNumber && <Chip size="small" label={`Table ${order.tableNumber}`} />}
              {order.paymentMethod && <Chip size="small" variant="outlined" label={order.paymentMethod} />}
            </Stack>

            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>₹{Number(order.totalAmount ?? 0).toFixed(2)}</Typography>
              </Box>
              {orderConfirmation.taxAmount != null && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">GST</Typography>
                  <Typography>₹{Number(orderConfirmation.taxAmount).toFixed(2)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  ₹{Number(orderConfirmation.finalAmount ?? order.finalAmount ?? 0).toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          </>
        )}

        {orderError && <Typography color="error">{orderError}</Typography>}
      </DialogContent>

      <DialogActions>
        {orderConfirmation && (
          <>
            <Button component={Link} to="/orders" color="primary" onClick={onClose}>
              Track order
            </Button>
            <Button component={Link} to="/menu" color="primary" variant="contained" onClick={onClose}>
              Order more
            </Button>
          </>
        )}
        {orderError && (
          <Button onClick={onClose} color="primary" variant="contained">Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OrderConfirmationDialog;
