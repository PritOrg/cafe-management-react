import React from 'react';
import { Card as MuiCard, CardContent, CardActions, CardHeader, CardMedia } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(MuiCard)(({ theme, elevation = 1, hover = false }) => ({
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  border: `1px solid ${theme.palette.divider}`,
  
  ...(hover && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
      borderColor: theme.palette.primary.main,
    },
  }),
  
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
    '&:last-child': {
      paddingBottom: theme.spacing(2),
    },
  },
  
  '& .MuiCardActions-root': {
    padding: theme.spacing(1, 2, 2),
    justifyContent: 'flex-end',
  },
  
  '& .MuiCardHeader-root': {
    padding: theme.spacing(2, 2, 1),
  },
}));

const Card = React.forwardRef(({
  children,
  elevation = 1,
  hover = false,
  onClick,
  sx = {},
  header,
  media,
  actions,
  ...props
}, ref) => {
  return (
    <StyledCard
      ref={ref}
      elevation={elevation}
      hover={hover}
      onClick={onClick}
      sx={{
        ...(onClick && { cursor: 'pointer' }),
        ...sx,
      }}
      {...props}
    >
      {header && (
        <CardHeader {...header} />
      )}
      
      {media && (
        <CardMedia {...media} />
      )}
      
      <CardContent>
        {children}
      </CardContent>
      
      {actions && (
        <CardActions>
          {actions}
        </CardActions>
      )}
    </StyledCard>
  );
});

Card.displayName = 'Card';

export default Card;
