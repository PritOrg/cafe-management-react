import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EmptyState from '../common/EmptyState';

const EmptyCart = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <EmptyState
        icon={<ShoppingCartIcon />}
        title="Your cart is empty"
        description="Browse the menu and add something delicious to get started."
        actionLabel="Browse menu"
        onAction={() => navigate('/menu')}
      />
    </Container>
  );
};

export default EmptyCart;
