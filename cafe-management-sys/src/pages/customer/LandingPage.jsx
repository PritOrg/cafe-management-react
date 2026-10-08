import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import InsightsIcon from '@mui/icons-material/Insights';
import { useBrand } from '../../contexts/BrandContext';

const FEATURES = [
  { icon: <QrCodeScannerIcon />, title: 'Scan & order', text: 'Guests order from the table in seconds — no app install.' },
  { icon: <RestaurantMenuIcon />, title: 'Live menu', text: 'Per-tenant menu with sizes, modifiers and instant availability.' },
  { icon: <Inventory2Icon />, title: 'Stock aware', text: 'Recipes deduct inventory automatically on every sale.' },
  { icon: <LocalDiningIcon />, title: 'Kitchen display', text: 'Tickets flow pending → preparing → ready → served.' },
  { icon: <ReceiptLongIcon />, title: 'GST invoices', text: 'Rule-46 tax invoices, PDF for A4 and thermal printers.' },
  { icon: <InsightsIcon />, title: 'Sales insight', text: 'Daily revenue, top items and GST split at a glance.' },
];

const LandingPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { brand } = useBrand();
  const title = brand?.title || 'Restaurant';

  return (
    <Box sx={{ pb: 6 }}>
      {/* Hero — mobile-first, gradient (no heavy image) */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: '#fff',
          px: { xs: 2, sm: 4 },
          pt: { xs: 6, md: 10 },
          pb: { xs: 6, md: 9 },
        }}
      >
        <Container maxWidth="md" sx={{ px: 0 }}>
          <Chip
            label="Order from your phone"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', mb: 2, fontWeight: 600 }}
          />
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            sx={{ fontSize: { xs: '1.9rem', sm: '2.6rem', md: '3rem' }, lineHeight: 1.15 }}
          >
            {title}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, maxWidth: 560, opacity: 0.95 }}>
            A modern restaurant point-of-sale: mobile ordering, kitchen display, live inventory,
            GST invoices and sales analytics — for any café or restaurant, self-hostable and white-label ready.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mt: 3, alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<RestaurantMenuIcon />}
              onClick={() => navigate('/menu')}
              sx={{
                bgcolor: '#fff',
                color: theme.palette.primary.main,
                minHeight: 48,
                fontWeight: 700,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              Browse menu
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login-register')}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.7)',
                minHeight: 48,
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Staff login
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features — 1-up on phone, 2-up tablet+, 3-up desktop */}
      <Container maxWidth="lg" sx={{ mt: { xs: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
          Everything the floor needs
        </Typography>
        <Grid2 container spacing={{ xs: 2, md: 3 }}>
          {FEATURES.map((f) => (
            <Grid2 xs={12} sm={6} md={4} key={f.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 1 }}>{f.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={700}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.text}</Typography>
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>

        <Box
          sx={{
            mt: { xs: 4, md: 6 },
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            textAlign: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Ready when you are
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Staff and owners sign in to manage orders, inventory and invoices.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/login-register')} sx={{ minHeight: 48 }}>
            Staff login
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
