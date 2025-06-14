// components/QuantitySelector.jsx
import React from 'react';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const QuantityContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.secondary,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(0.5),
  border: `2px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease-in-out',
  
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 4px ${theme.palette.primary.main}20`,
  },
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  transition: 'all 0.2s ease-in-out',
  
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.1)',
  },
  
  '&:disabled': {
    backgroundColor: theme.palette.neutral[300],
    color: theme.palette.text.disabled,
    transform: 'none',
  },
}));

const QuantityInput = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    width: 60,
    height: 32,
    backgroundColor: 'transparent',
    
    '& input': {
      textAlign: 'center',
      fontWeight: 600,
      fontSize: '1rem',
      color: theme.palette.text.primary,
      padding: 0,
    },
    
    '& fieldset': {
      border: 'none',
    },
  },
}));

const QuantitySelector = ({ quantity, onQuantityChange, disabled = false, min = 1, max = 99 }) => {
  const handleIncrement = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value) || min;
    if (value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  return (
    <QuantityContainer>
      <QuantityButton
        size="small"
        onClick={handleDecrement}
        disabled={disabled || quantity <= min}
      >
        <RemoveIcon fontSize="small" />
      </QuantityButton>
      
      <QuantityInput
        value={quantity}
        onChange={handleInputChange}
        type="number"
        inputProps={{ 
          min, 
          max,
          step: 1
        }}
        disabled={disabled}
        variant="standard"
      />
      
      <QuantityButton
        size="small"
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
      >
        <AddIcon fontSize="small" />
      </QuantityButton>
    </QuantityContainer>
  );
};

export default QuantitySelector;