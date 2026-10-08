import React, { memo, useCallback, useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Navbar from '../navigation/Navbar';
import BottomNav from '../navigation/BottomNav';
import Footer from '../navigation/Footer';
import OfflineBanner from '../navigation/OfflineBanner';
import CartContext from '../CartContext';

const CartBar = memo(({ count, total, onCheckout }) => (
  <Paper
    square
    elevation={6}
    sx={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 58,
      zIndex: (theme) => theme.zIndex.appBar - 1,
      px: 2,
      py: 1,
      display: { xs: 'flex', md: 'none' },
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      borderTop: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" noWrap>
        {count} item{count === 1 ? '' : 's'} in cart
      </Typography>
      <Typography variant="subtitle1" fontWeight={800} noWrap>
        ₹{Number(total || 0).toFixed(2)}
      </Typography>
    </Box>
    <Button
      variant="contained"
      size="large"
      startIcon={<ShoppingCartIcon />}
      onClick={onCheckout}
      sx={{ minHeight: 44, flexShrink: 0 }}
    >
      Checkout
    </Button>
  </Paper>
));

CartBar.displayName = 'CartBar';

const Layout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { cartCount = 0, total = 0 } = useContext(CartContext) || {};

  const goToCart = useCallback(() => navigate('/cart'), [navigate]);

  const showCartBar = cartCount > 0 && pathname !== '/cart';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Navbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          px: { xs: 1.5, sm: 2, md: 3 },
          pb: { xs: cartCount > 0 ? 18 : 10, md: 0 },
        }}
      >
        <Outlet />
      </Box>

      <Footer />
      <BottomNav />
      <OfflineBanner />

      {showCartBar && <CartBar count={cartCount} total={total} onCheckout={goToCart} />}
    </Box>
  );
};

export default Layout;
