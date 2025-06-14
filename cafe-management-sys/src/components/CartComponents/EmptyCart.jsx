// components/EmptyCart.jsx
import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon, LocalCafe as CoffeeIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const EmptyCartContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.tertiary} 100%)`,
  borderRadius: theme.spacing(3),
  border: `2px dashed ${theme.palette.divider}`,
  margin: theme.spacing(4, 0),
}));

const AnimatedIcon = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  animation: 'bounce 2s infinite',
  '@keyframes bounce': {
    '0%, 20%, 53%, 80%, 100%': {
      transform: 'translate3d(0,0,0)',
    },
    '40%, 43%': {
      transform: 'translate3d(0, -30px, 0)',
    },
    '70%': {
      transform: 'translate3d(0, -15px, 0)',
    },
    '90%': {
      transform: 'translate3d(0, -4px, 0)',
    },
  },
}));

const EmptyCart = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <EmptyCartContainer elevation={2}>
        <AnimatedIcon>
          <ShoppingCartIcon 
            sx={{ 
              fontSize: 100, 
              color: 'primary.main',
              opacity: 0.7,
              mb: 2
            }} 
          />
        </AnimatedIcon>
        
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary',
            mb: 2
          }}
        >
          Your Cart is Empty
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'text.secondary',
            mb: 4,
            maxWidth: 400,
            mx: 'auto'
          }}
        >
          It looks like you haven't added any delicious coffee to your cart yet. 
          Browse our menu and discover your perfect brew!
        </Typography>
        
        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
          <Button
            component={Link}
            to="/menu"
            variant="contained"
            size="large"
            startIcon={<CoffeeIcon />}
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #6A3400 0%, #8B4513 100%)',
              },
            }}
          >
            Browse Menu
          </Button>
          
          <Button
            component={Link}
            to="/"
            variant="outlined"
            size="large"
            sx={{ px: 4, py: 1.5 }}
          >
            Back to Home
          </Button>
        </Box>
        
        <Box mt={4} display="flex" justifyContent="center" gap={4} flexWrap="wrap">
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
              ☕ Fresh Coffee
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Brewed daily
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
              🚚 Free Delivery
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              On all orders
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
              ⚡ Fast Service
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Quick preparation
            </Typography>
          </Box>
        </Box>
      </EmptyCartContainer>
    </Container>
  );
};

export default EmptyCart;