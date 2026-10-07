import React from 'react';
import { Box, Typography, Button, Container, Paper, useTheme, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowBack, Coffee, SentimentDissatisfied } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.light, 0.1)} 0%, 
                    ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        py: 8,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={4}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {/* Left side - Colored section */}
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: '100%', md: '40%' },
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Coffee cup icon in background */}
            <Coffee
              sx={{
                position: 'absolute',
                fontSize: 240,
                opacity: 0.1,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-15deg)',
              }}
            />

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '8rem' },
                fontWeight: 900,
                textShadow: '2px 4px 8px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              404
            </Typography>

            <SentimentDissatisfied sx={{ fontSize: 60, mt: 2, mb: 3 }} />

            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              Oops! Page not found
            </Typography>
          </Box>

          {/* Right side - Content */}
          <Box
            sx={{
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: { xs: '100%', md: '60%' },
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
              }}
            >
              We couldn't find that page
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable. Please check the URL or navigate back to a safe place.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                Back to Home
              </Button>

              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                }}
              >
                Go Back
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
              If you believe this is an error, please contact our support team.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFound;
