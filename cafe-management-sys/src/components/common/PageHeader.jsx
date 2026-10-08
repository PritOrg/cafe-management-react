import React from 'react';
import { Box, Typography, Stack, IconButton, alpha } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

/**
 * Material 3 page header: leading icon, large title, optional subtitle/actions.
 */
const PageHeader = ({ title, subtitle, icon, actions, back = false, sx }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: { xs: 2.5, md: 3.5 }, ...sx }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          {back && (
            <IconButton onClick={() => navigate(-1)} edge="start" aria-label="Go back">
              <ArrowBackIcon />
            </IconButton>
          )}
          {icon && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: '50%',
                bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                color: (t) => t.brand?.primaryText || t.palette.primary.main,
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="h1" noWrap sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {actions && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default React.memo(PageHeader);
