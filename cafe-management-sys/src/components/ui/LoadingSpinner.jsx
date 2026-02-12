import React from 'react';
import {
  CircularProgress,
  LinearProgress,
  Box,
  Typography,
  Backdrop,
  Skeleton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Custom pulse animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const StyledLoadingContainer = styled(Box)(({ theme, variant }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  
  ...(variant === 'overlay' && {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: theme.zIndex.modal - 1,
  }),
  
  ...(variant === 'inline' && {
    padding: theme.spacing(4),
  }),
}));

const PulsingDot = styled(Box)(({ theme, delay = 0 }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  animation: `${pulse} 1.4s ease-in-out ${delay}s infinite`,
}));

const LoadingSpinner = ({
  variant = 'circular', // 'circular', 'linear', 'dots', 'skeleton', 'overlay'
  size = 40,
  color = 'primary',
  message,
  backdrop = false,
  fullScreen = false,
  sx = {},
  skeletonProps = {},
  ...props
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 300 }}>
            <LinearProgress color={color} {...props} />
            {message && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {message}
              </Typography>
            )}
          </Box>
        );
        
      case 'dots':
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <PulsingDot delay={0} />
            <PulsingDot delay={0.2} />
            <PulsingDot delay={0.4} />
            {message && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                {message}
              </Typography>
            )}
          </Box>
        );
        
      case 'skeleton':
        return (
          <Box sx={{ width: '100%' }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
            {skeletonProps.additionalSkeletons && skeletonProps.additionalSkeletons.map((skeleton, index) => (
              <Skeleton key={index} {...skeleton} />
            ))}
          </Box>
        );
        
      case 'overlay':
        return (
          <StyledLoadingContainer variant="overlay" sx={sx}>
            <CircularProgress size={size} color={color} {...props} />
            {message && (
              <Typography variant="body2" color="text.secondary">
                {message}
              </Typography>
            )}
          </StyledLoadingContainer>
        );
        
      default: // circular
        return (
          <StyledLoadingContainer variant="inline" sx={sx}>
            <CircularProgress size={size} color={color} {...props} />
            {message && (
              <Typography variant="body2" color="text.secondary">
                {message}
              </Typography>
            )}
          </StyledLoadingContainer>
        );
    }
  };

  if (backdrop || fullScreen) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          ...sx,
        }}
        open={true}
      >
        {renderSpinner()}
      </Backdrop>
    );
  }

  return renderSpinner();
};

export default LoadingSpinner;
