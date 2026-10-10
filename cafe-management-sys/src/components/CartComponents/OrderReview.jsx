import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Box,
  Paper,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';

const formatPrep = (minutes) =>
  minutes > 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;

const unitPrice = (item) => {
  const sizes = item.sizes || [];
  if (sizes.length) {
    const match = sizes.find((s) => s.label === item.selectedSize)
      || sizes.find((s) => s.isDefault)
      || sizes[0];
    return Number(match?.price || 0);
  }
  return Number(item.price?.[String(item.selectedSize || 'medium').toLowerCase()] ?? item.price?.medium ?? 0);
};

const OrderReview = ({
  cartItems,
  customerInfo,
  paymentMethod,
  total,
  cartCount,
  totalPrepTime,
  estimate,
  onBack,
  onNext,
  isLoading,
}) => {
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'upi_manual': return 'UPI (Manual Confirmation)';
      case 'card_manual': return 'Card (Manual Confirmation)';
      case 'cash': return 'Cash';
      default: return method;
    }
  };

  return (
    <Grid2 container spacing={3}>
      <Grid2 xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Order review
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Customer
            </Typography>
            <Typography>{customerInfo.name} · {customerInfo.phone}</Typography>
            {customerInfo.tableNumber && (
              <Typography color="text.secondary">Table {customerInfo.tableNumber}</Typography>
            )}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Payment
            </Typography>
            <Typography paragraph>{getPaymentMethodLabel(paymentMethod)}</Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Items
            </Typography>
            {cartItems.map((item) => (
              <Box key={item.cartItemId} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{item.quantity} × {item.title || item.name}</Typography>
                  <Typography>₹{(unitPrice(item) * item.quantity).toFixed(2)}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {item.selectedSize}
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0
                    ? ` · ${Object.keys(item.selectedOptions).join(', ')}`
                    : ''}
                </Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid2>

      <Grid2 xs={12} md={4}>
        <Paper elevation={0} sx={{ p: 3, position: 'sticky', top: 16, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            Order summary
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'grid', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Subtotal ({cartCount} items)</Typography>
              <Typography>₹{total.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Tax (GST)</Typography>
              <Typography>{estimate ? `₹${estimate.taxAmount.toFixed(2)}` : 'At checkout'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Prep time</Typography>
              <Typography>{formatPrep(totalPrepTime)}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">₹{(estimate ? estimate.total : total).toFixed(2)}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={onBack} disabled={isLoading} sx={{ flex: 1 }}>
              Back
            </Button>
            <Button variant="contained" onClick={onNext} disabled={isLoading} sx={{ flex: 1 }}>
              {isLoading ? 'Placing…' : 'Place order'}
            </Button>
          </Box>
        </Paper>
      </Grid2>
    </Grid2>
  );
};

export default OrderReview;
