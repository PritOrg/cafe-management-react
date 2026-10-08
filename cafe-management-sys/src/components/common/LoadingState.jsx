import React from 'react';
import { Box, CircularProgress, Typography, Skeleton, Stack } from '@mui/material';

/**
 * Standard loading state. Prefer `rows` (skeleton) when the layout is known,
 * otherwise the spinner + label. Announces politely to screen readers.
 */
const LoadingState = ({ label = 'Loading…', rows = 0, sx }) => (
  <Box role="status" aria-live="polite" sx={{ py: { xs: 4, md: 6 }, px: 2, ...sx }}>
    <Stack alignItems="center" spacing={1.5}>
      <CircularProgress size={32} />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Stack>
    {rows > 0 && (
      <Stack spacing={1.5} sx={{ mt: 3, maxWidth: 720, mx: 'auto' }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={56} />
        ))}
      </Stack>
    )}
  </Box>
);

export default React.memo(LoadingState);
