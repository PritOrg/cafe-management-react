// components/OrderSummary.jsx
import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  Box,
  Button,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  LocalCafe as CoffeeIcon,
  Schedule as TimeIcon,
  LocalShipping as ShippingIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SummaryPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  position: 'sticky',
  top: 16,
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.tertiary} 100%)`,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
}));

const SummaryRow = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  alignItems: 'center',
}));

const TotalSection = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  margin: theme.spacing(2, 0),
  textAlign: 'center',
  boxShadow: theme.shadows[2],
}));

const OrderSummary = ({ 
  total, 
  cartCount, 
  totalPrepTime, 
  onBack, 
  onNext, 
  isLoading, 
  nextLabel = 'Next',
  showClearCart = false,
  onClearCart,
  cartItemsCount = 0
}) => {
  const formatPrepTime = (minutes) => {
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  return (
    <SummaryPaper elevation={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <CoffeeIcon sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Order Summary
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Order Details */}
      <Box mb={3}>
        <SummaryRow container justifyContent="space-between">
          <Grid item>
            <Box display="flex" alignItems="center">
              <MoneyIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2">
                Subtotal ({cartCount} items)
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ${total.toFixed(2)}
            </Typography>
          </Grid>
        </SummaryRow>
        
        <SummaryRow container justifyContent="space-between">
          <Grid item>
            <Box display="flex" alignItems="center">
              <ShippingIcon fontSize="small" sx={{ color: 'success.main', mr: 1 }} />
              <Typography variant="body2">Delivery</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Chip 
              label="FREE" 
              size="small" 
              color="success" 
              sx={{ fontWeight: 600 }}
            />
          </Grid>
        </SummaryRow>
        
        <SummaryRow container justifyContent="space-between">
          <Grid item>
            <Box display="flex" alignItems="center">
              <TimeIcon fontSize="small" sx={{ color: 'warning.main', mr: 1 }} />
              <Typography variant="body2">Prep Time</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Chip 
              label={formatPrepTime(totalPrepTime)}
              size="small"
              sx={{ 
                backgroundColor: 'warning.light',
                color: 'warning.contrastText',
                fontWeight: 600
              }}
            />
          </Grid>
        </SummaryRow>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Total Section */}
      <TotalSection>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Total: ${total.toFixed(2)}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Including all fees and taxes
        </Typography>
      </TotalSection>
      
      {/* Action Buttons */}
      <Box display="flex" flexDirection="column" gap={2}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={onNext}
          disabled={isLoading || cartItemsCount === 0}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6A3400 0%, #8B4513 100%)',
            },
          }}
        >
          {isLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <LinearProgress 
                sx={{ 
                  width: 80, 
                  height: 4, 
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }} 
              />
              Processing...
            </Box>
          ) : (
            nextLabel
          )}
        </Button>
        
        {onBack && (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={onBack}
            disabled={isLoading}
            sx={{ py: 1.5 }}
          >
            Back
          </Button>
        )}
        
        {showClearCart && (
          <Button
            fullWidth
            variant="text"
            color="error"
            size="large"
            onClick={onClearCart}
            disabled={cartItemsCount === 0}
            sx={{ py: 1.5 }}
          >
            Clear Cart
          </Button>
        )}
      </Box>
    </SummaryPaper>
  );
};

export default OrderSummary;