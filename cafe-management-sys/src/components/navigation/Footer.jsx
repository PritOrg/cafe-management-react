import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useBrand } from '../../contexts/BrandContext';
import { CUSTOMER_NAV } from '../../constants/navigation';

const Footer = () => {
  const { brand } = useBrand();
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        display: { xs: 'none', md: 'block' },
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        mt: 'auto',
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, py: 4 }}>
        <Stack direction={{ md: 'row' }} spacing={3} justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <StorefrontIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {brand?.title || 'Restaurant'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={3} component="nav" aria-label="Footer">
            {CUSTOMER_NAV.map((item) => (
              <Typography
                key={item.key}
                component={RouterLink}
                to={item.href}
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {item.label}
              </Typography>
            ))}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            © {year} {brand?.title || 'Restaurant Management'}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default React.memo(Footer);
