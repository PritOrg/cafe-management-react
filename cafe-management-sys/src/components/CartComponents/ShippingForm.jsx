import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  TextField,
  Box,
  Paper
} from '@mui/material';

const ShippingForm = ({
  shippingInfo,
  onShippingChange,
  total,
  cartCount,
  totalPrepTime,
  onBack,
  onNext,
  isLoading
}) => {
  const isFormValid = shippingInfo.address && shippingInfo.city && 
                     shippingInfo.postalCode && shippingInfo.country;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Shipping Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Address"
                  name="address"
                  value={shippingInfo.address}
                  onChange={onShippingChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="City"
                  name="city"
                  value={shippingInfo.city}
                  onChange={onShippingChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Postal Code"
                  name="postalCode"
                  value={shippingInfo.postalCode}
                  onChange={onShippingChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Country"
                  name="country"
                  value={shippingInfo.country}
                  onChange={onShippingChange}
                />
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
              disabled={isLoading || !isFormValid}
              sx={{ flex: 1 }}
            >
              {isLoading ? 'Processing...' : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ShippingForm;