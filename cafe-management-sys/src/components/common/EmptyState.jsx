import React from 'react';
import { Box, Typography, Button, alpha } from '@mui/material';

/**
 * Material 3 empty state: tonal icon disc, title, description, optional action.
 */
const EmptyState = ({ icon, title, description, actionLabel, onAction, actionProps, sx }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      py: { xs: 6, md: 8 },
      px: 2,
      ...sx,
    }}
  >
    {icon && (
      <Box
        sx={{
          width: 88,
          height: 88,
          mb: 2,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          color: (t) => t.brand?.primaryText || t.palette.primary.main,
          '& .MuiSvgIcon-root': { fontSize: 44 },
        }}
      >
        {icon}
      </Box>
    )}
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mt: 0.5 }}>
        {description}
      </Typography>
    )}
    {actionLabel && (
      <Button variant="contained" onClick={onAction} sx={{ mt: 3 }} {...actionProps}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default React.memo(EmptyState);
