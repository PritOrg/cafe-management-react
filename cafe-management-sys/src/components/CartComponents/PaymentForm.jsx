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
import {
  Payment as PaymentIcon
} from '@mui/icons-material';

const PaymentForm = ({
  paymentMethod,
  onPaymentMethodChange,
  total,
  cartCount,
  totalPrepTime,
  onBack,
  onNext,
  isLoading
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant={paymentMethod === 'credit' ? 'contained' : 'outlined'}
                  onClick={() => onPaymentMethodChange('credit')}
                  startIcon={<PaymentIcon />}
                  sx={{ mb: 2, justifyContent: 'flex-start' }}
                >
                  Credit/Debit Card
                </Button>
                <Button
                  fullWidth
                  variant={paymentMethod === 'paypal' ? 'contained' : 'outlined'}
                  onClick={() => onPaymentMethodChange('paypal')}
                  startIcon={<PaymentIcon />}
                  sx={{ mb: 2, justifyContent: 'flex-start' }}
                >
                  PayPal
                </Button>
                <Button
                  fullWidth
                  variant={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                  onClick={() => onPaymentMethodChange('cash')}
                  startIcon={<PaymentIcon />}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Cash on Delivery
                </Button>
              </Grid>
            </Grid>
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
              {isLoading ? 'Processing...' : 'Review Order'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PaymentForm;