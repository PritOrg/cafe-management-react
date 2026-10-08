import React from 'react';
import { Box, Typography, Button, alpha } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * Standard error state with an optional retry action. Use for page/section
 * load failures instead of leaving a dead spinner or an empty screen.
 */
const ErrorState = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  sx,
}) => (
  <Box
    role="alert"
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      py: { xs: 5, md: 7 },
      px: 2,
      ...sx,
    }}
  >
    <Box
      sx={{
        width: 80,
        height: 80,
        mb: 2,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (t) => alpha(t.palette.error.main, 0.1),
        color: 'error.main',
        '& .MuiSvgIcon-root': { fontSize: 40 },
      }}
    >
      <ErrorOutlineIcon />
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    {message && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mt: 0.5 }}>
        {message}
      </Typography>
    )}
    {onRetry && (
      <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRetry} sx={{ mt: 3 }}>
        {retryLabel}
      </Button>
    )}
  </Box>
);

export default React.memo(ErrorState);
