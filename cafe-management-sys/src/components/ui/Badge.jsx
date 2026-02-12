import React from 'react';
import { Badge as MuiBadge, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledBadge = styled(MuiBadge)(({ theme, variant, color }) => ({
  '& .MuiBadge-badge': {
    borderRadius: theme.spacing(1),
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    
    ...(variant === 'dot' && {
      minWidth: 8,
      height: 8,
      padding: 0,
      borderRadius: '50%',
    }),
  },
}));

const StyledChip = styled(Chip)(({ theme, variant, color }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
  
  '& .MuiChip-label': {
    padding: '0 8px',
  },
  
  ...(variant === 'outlined' && {
    borderWidth: 2,
  }),
}));

const Badge = ({
  children,
  badgeContent,
  color = 'primary',
  variant = 'standard',
  invisible = false,
  showZero = false,
  max = 99,
  overlap = 'rectangular',
  anchorOrigin = {
    vertical: 'top',
    horizontal: 'right',
  },
  component = 'badge', // 'badge' or 'chip'
  size = 'medium',
  sx = {},
  ...props
}) => {
  if (component === 'chip') {
    return (
      <StyledChip
        label={badgeContent}
        color={color}
        variant={variant}
        size={size}
        sx={sx}
        {...props}
      />
    );
  }

  return (
    <StyledBadge
      badgeContent={badgeContent}
      color={color}
      variant={variant}
      invisible={invisible}
      showZero={showZero}
      max={max}
      overlap={overlap}
      anchorOrigin={anchorOrigin}
      sx={sx}
      {...props}
    >
      {children}
    </StyledBadge>
  );
};

export default Badge;
