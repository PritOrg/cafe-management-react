import React, { useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Home from '@mui/icons-material/Home';
import RestaurantMenu from '@mui/icons-material/RestaurantMenu';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import CartContext from '../CartContext';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const path = location.pathname;
  const cart = useContext(CartContext) || {};
  const cartCount = cart.cartCount || 0;
  const total = cart.total || 0;

  const navValue =
    path.startsWith('/menu') ? 1 :
    path.startsWith('/cart') ? 2 : 0;

  const onCheckoutFlow = path === '/cart';
  const showCartBar = isMobile && cartCount > 0 && (path === '/menu' || (path === '/cart' && !onCheckoutFlow));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pb: isMobile ? 14 : 0,
          px: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Outlet />
      </Box>

      {showCartBar && (
        <Paper
          square
          elevation={6}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: isMobile ? 56 : 0,
            zIndex: theme.zIndex.appBar - 1,
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {cartCount} item{cartCount === 1 ? '' : 's'}
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              ₹{Number(total).toFixed(2)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            sx={{ minWidth: 44, minHeight: 44 }}
            onClick={() => navigate('/cart')}
          >
            Checkout
          </Button>
        </Paper>
      )}

      {isMobile && (
        <Paper
          square
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <BottomNavigation
            showLabels
            value={navValue}
            onChange={(_, newValue) => {
              if (newValue === 0) navigate('/');
              if (newValue === 1) navigate('/menu');
              if (newValue === 2) navigate('/cart');
            }}
            sx={{
              '& .MuiBottomNavigationAction-root': {
                minWidth: 44,
                minHeight: 56,
                py: 1,
              },
            }}
          >
            <BottomNavigationAction label="Home" icon={<Home />} />
            <BottomNavigationAction label="Menu" icon={<RestaurantMenu />} />
            <BottomNavigationAction
              label="Cart"
              icon={
                <Badge badgeContent={cartCount} color="primary" max={99}>
                  <ShoppingCart />
                </Badge>
              }
            />
          </BottomNavigation>
        </Paper>
      )}
      {!isMobile && <Footer />}
    </Box>
  );
};

export default Layout;
