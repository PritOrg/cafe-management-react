import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme, variant, color }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 2),
  transition: 'all 0.2s ease-in-out',
  
  ...(variant === 'contained' && {
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      transform: 'translateY(-1px)',
    },
  }),
  
  ...(variant === 'outlined' && {
    borderWidth: 2,
    '&:hover': {
      borderWidth: 2,
      transform: 'translateY(-1px)',
    },
  }),
  
  '&:disabled': {
    transform: 'none',
    boxShadow: 'none',
  },
}));

const Button = React.forwardRef(({
  children,
  loading = false,
  disabled = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  sx = {},
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      ref={ref}
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onClick={onClick}
      type={type}
      startIcon={loading ? null : startIcon}
      endIcon={loading ? null : endIcon}
      sx={{
        position: 'relative',
        ...sx,
      }}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={20}
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: '-10px',
            marginTop: '-10px',
            color: variant === 'contained' ? 'white' : 'primary.main',
          }}
        />
      )}
      <span style={{ opacity: loading ? 0 : 1 }}>
        {children}
      </span>
    </StyledButton>
  );
});

Button.displayName = 'Button';

export default Button;
