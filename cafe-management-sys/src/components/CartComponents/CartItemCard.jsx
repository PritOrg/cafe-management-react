// components/CartItemCard.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Box,
  Fade,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import QuantitySelector from './QuantitySelector';

const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.tertiary} 100%)`,
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 0.3s ease-in-out',
  },
  
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[6],
    
    '&::before': {
      transform: 'scaleX(1)',
    },
  },
}));

const CoffeeAvatar = styled(Avatar)(({ theme }) => ({
  width: 64,
  height: 64,
  border: `3px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[2],
  transition: 'all 0.3s ease-in-out',
  
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: theme.shadows[4],
  },
}));

const PriceTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.25rem',
  color: theme.palette.primary.main,
  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
}));

const CartItemCard = ({ item, onQuantityChange, onRemoveItem }) => {
  const itemTotal = (item.price[item.selectedSize?.toLowerCase() || 'regular'] * item.quantity).toFixed(2);
  
  return (
    <Fade in timeout={500}>
      <StyledCard>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Coffee Image */}
            <Grid item xs={12} sm={2}>
              <Box display="flex" justifyContent="center">
                <CoffeeAvatar
                  src={item.image}
                  alt={item.name}
                  variant="rounded"
                />
              </Box>
            </Grid>
            
            {/* Coffee Details */}
            <Grid item xs={12} sm={4}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 0.5
                }}
              >
                {item.name}
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  mb: 1,
                  fontStyle: 'italic'
                }}
              >
                Size: {item.selectedSize}
              </Typography>
              
              {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {Object.entries(item.selectedOptions).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        mr: 1, 
                        mb: 1,
                        fontSize: '0.7rem',
                        backgroundColor: 'background.secondary',
                        border: 'none'
                      }}
                    />
                  ))}
                </Box>
              )}
            </Grid>
            
            {/* Quantity Controls */}
            <Grid item xs={12} sm={3}>
              <Box display="flex" justifyContent="center">
                <QuantitySelector
                  quantity={item.quantity}
                  onQuantityChange={(newQuantity) => 
                    onQuantityChange(item.cartItemId, newQuantity)
                  }
                  disabled={false}
                />
              </Box>
            </Grid>
            
            {/* Price */}
            <Grid item xs={10} sm={2}>
              <Box textAlign="center">
                <PriceTypography variant="h6">
                  ${itemTotal}
                </PriceTypography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    display: 'block',
                    mt: 0.5
                  }}
                >
                  ${item.price[item.selectedSize?.toLowerCase() || 'regular']} each
                </Typography>
              </Box>
            </Grid>
            
            {/* Delete Button */}
            <Grid item xs={2} sm={1}>
              <Box display="flex" justifyContent="center">
                <Tooltip title="Remove from cart" arrow>
                  <IconButton
                    onClick={() => onRemoveItem(item.cartItemId)}
                    sx={{
                      color: 'error.main',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'white',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </StyledCard>
    </Fade>
  );
};

export default CartItemCard;