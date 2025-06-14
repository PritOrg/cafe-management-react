import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Box,
  Paper
} from '@mui/material';

const OrderReview = ({
  cartItems,
  shippingInfo,
  paymentMethod,
  total,
  cartCount,
  totalPrepTime,
  onBack,
  onNext,
  isLoading
}) => {
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'credit': return 'Credit/Debit Card';
      case 'paypal': return 'PayPal';  
      case 'cash': return 'Cash on Delivery';
      default: return method;
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Review
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              Shipping to:
            </Typography>
            <Typography paragraph>
              {shippingInfo.address}<br />
              {shippingInfo.city}, {shippingInfo.postalCode}<br />
              {shippingInfo.country}
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Payment Method:
            </Typography>
            <Typography paragraph>
              {getPaymentMethodLabel(paymentMethod)}
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Items:
            </Typography>
            {cartItems.map((item) => (
              <Box key={item.cartItemId} mb={2} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body1">
                  <strong>{item.quantity} × {item.name}</strong> ({item.selectedSize})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ${(item.price[item.selectedSize?.toLowerCase() || 'regular'] * item.quantity).toFixed(2)}
                </Typography>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Options: {Object.entries(item.selectedOptions).map(([key, value]) => (
                      `${key}: ${value}`
                    )).join(', ')}
                  </Typography>
                )}
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 16 }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Box mb={2}>
            <Grid container justifyContent="space-between">
              <Typography>Subtotal ({cartCount} items)</Typography>
              <Typography>${total.toFixed(2)}</Typography>
            </Grid>
            <Grid container justifyContent="space-between">
              <Typography>Delivery</Typography>
              <Typography>FREE</Typography>
            </Grid>
            <Grid container justifyContent="space-between">
              <Typography>Estimated Prep Time</Typography>
              <Typography>
                {totalPrepTime > 60 
                  ? `${Math.floor(totalPrepTime / 60)}h ${totalPrepTime % 60}m` 
                  : `${totalPrepTime}m`}
              </Typography>
            </Grid>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container justifyContent="space-between" mb={3}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">${total.toFixed(2)}</Typography>
          </Grid>
          
          <Box display="flex" justifyContent="space-between" gap={2}>
            <Button
              variant="outlined"
              onClick={onBack}
              disabled={isLoading}
              sx={{ flex: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={onNext}
              disabled={isLoading}
              sx={{ flex: 1 }}
            >
              {isLoading ? 'Processing...' : 'Place Order'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OrderReview;