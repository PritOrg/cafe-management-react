// components/CartItems.jsx
import React from 'react';
import { Grid, Box, Typography, Button } from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import CartItemCard from './CartItemCard';
import OrderSummary from './OrderSummary';

const CartItems = ({ 
  cartItems, 
  onQuantityChange, 
  onRemoveItem, 
  onClearCart,
  total,
  cartCount,
  totalPrepTime,
  onNext,
  isLoading 
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {cartItems.map((item) => (
            <CartItemCard
              key={item.cartItemId}
              item={item}
              onQuantityChange={onQuantityChange}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <OrderSummary 
          total={total} 
          cartCount={cartCount} 
          totalPrepTime={totalPrepTime} 
          onNext={onNext}
          isLoading={isLoading}
          nextLabel="Proceed to Checkout"
          showClearCart
          onClearCart={onClearCart}
          cartItemsCount={cartItems.length}
        />
      </Grid>
    </Grid>
  );
};

export default CartItems;