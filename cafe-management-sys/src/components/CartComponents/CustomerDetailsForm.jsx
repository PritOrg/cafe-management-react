import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  TextField,
  Box,
  Paper,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';

const formatPrep = (minutes) =>
  minutes > 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;

const CustomerDetailsForm = ({
  customerInfo,
  onCustomerChange,
  total,
  cartCount,
  totalPrepTime,
  onBack,
  onNext,
  isLoading,
}) => {
  const phoneDigits = String(customerInfo.phone || '').replace(/\D/g, '');
  const isFormValid = customerInfo.name.trim().length >= 2 && phoneDigits.length >= 10;

  return (
    <Grid2 container spacing={3}>
      <Grid2 xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Your details
            </Typography>
            <Grid2 container spacing={2}>
              <Grid2 xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Name"
                  name="name"
                  value={customerInfo.name}
                  onChange={onCustomerChange}
                  autoComplete="name"
                  InputProps={{
                    startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                  }}
                />
              </Grid2>
              <Grid2 xs={12} sm={7}>
                <TextField
                  required
                  fullWidth
                  label="Phone number"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={onCustomerChange}
                  inputProps={{ inputMode: 'tel', autoComplete: 'tel' }}
                  helperText="Used to look up your order history"
                  InputProps={{
                    startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />,
                  }}
                />
              </Grid2>
              <Grid2 xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Table number"
                  name="tableNumber"
                  value={customerInfo.tableNumber}
                  onChange={onCustomerChange}
                  inputProps={{ inputMode: 'numeric' }}
                  InputProps={{
                    startAdornment: <TableRestaurantIcon color="action" sx={{ mr: 1 }} />,
                  }}
                />
              </Grid2>
            </Grid2>
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
              <Typography>At checkout</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Prep time</Typography>
              <Typography>{formatPrep(totalPrepTime)}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">₹{total.toFixed(2)}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={onBack} disabled={isLoading} sx={{ flex: 1 }}>
              Back
            </Button>
            <Button variant="contained" onClick={onNext} disabled={isLoading || !isFormValid} sx={{ flex: 1 }}>
              Next
            </Button>
          </Box>
        </Paper>
      </Grid2>
    </Grid2>
  );
};

export default CustomerDetailsForm;
