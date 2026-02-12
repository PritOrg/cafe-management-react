import React from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  useTheme, 
  useMediaQuery,
  Paper,
  Chip
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PeopleIcon from '@mui/icons-material/People';
import backgroundImage from '../../assets/clem-onojeghuo-zlABb6Gke24-unsplash.jpg';

const landingPageStyle = {
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#fff',
  textAlign: 'center',
  margin: '0',
  padding: '2rem',
  minHeight: '100vh',
};

const LandingPage = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const blurBoxStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: isSmallScreen ? '1.5rem' : '2.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    maxWidth: isSmallScreen ? '95%' : '85%',
    margin: '0 auto',
  };

  const featureCard = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    borderRadius: '12px',
    padding: '1.5rem',
    height: '100%',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <Box sx={landingPageStyle}>
      <Container maxWidth="lg">
        <Box sx={blurBoxStyle}>
          {/* Hero Section */}
          <Box mb={6} mt={2}>
            <Typography 
              variant={isSmallScreen ? "h3" : "h2"} 
              component="h1" 
              fontWeight="700" 
              mb={2}
              sx={{ 
                background: 'linear-gradient(45deg, #FFC107, #FF5722)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome to Café Management System
            </Typography>
            
            <Typography variant="h6" mb={4} color="rgba(255,255,255,0.9)">
              Elevate your café experience with our all-in-one management solution
            </Typography>
            
            <Chip 
              label="New: AI-powered inventory forecasting" 
              color="warning" 
              sx={{ mb: 4 }} 
            />
            
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button 
                  variant="contained" 
                  size="large" 
                  startIcon={<HomeIcon />}
                  sx={{ 
                    backgroundColor: '#FF5722',
                    '&:hover': { backgroundColor: '#E64A19' },
                    px: 4,
                    py: 1.5,
                    borderRadius: '30px'
                  }}
                >
                  Get Started
                </Button>
              </Grid>
              <Grid item>
                <Button 
                  variant="outlined" 
                  size="large"
                  sx={{ 
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white' 
                    },
                    px: 4,
                    py: 1.5,
                    borderRadius: '30px'
                  }}
                >
                  Book Demo
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Features Section */}
          <Box mb={6}>
            <Typography variant="h4" mb={4} fontWeight="600">
              Key Features
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={featureCard}>
                  <RestaurantMenuIcon sx={{ fontSize: 40, color: '#FFC107', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" mb={1}>
                    Menu Management
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Easily manage your menu items, categories, and seasonal specials all in one place.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={featureCard}>
                  <PointOfSaleIcon sx={{ fontSize: 40, color: '#FFC107', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" mb={1}>
                    POS System
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Streamlined checkout process with payment integration and receipt management.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={featureCard}>
                  <AnalyticsIcon sx={{ fontSize: 40, color: '#FFC107', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" mb={1}>
                    Analytics
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Make data-driven decisions with comprehensive sales and inventory reports.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={featureCard}>
                  <PeopleIcon sx={{ fontSize: 40, color: '#FFC107', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" mb={1}>
                    Staff Management
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.8)">
                    Schedule shifts, track performance, and manage payroll efficiently.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Testimonial Section */}
          <Box mb={6}>
            <Typography variant="h5" fontWeight="600" mb={3}>
              Trusted by Café Owners Worldwide
            </Typography>
            
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                maxWidth: '800px',
                margin: '0 auto'
              }}
            >
              <Typography variant="body1" fontStyle="italic" mb={2}>
                "Since implementing this system, we've increased our efficiency by 40% and can now focus on what truly matters - creating great experiences for our customers."
              </Typography>
              <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
                - Sarah Johnson, Owner of Sunrise Café
              </Typography>
            </Paper>
          </Box>

          {/* CTA Section */}
          <Box>
            <Typography variant="h5" fontWeight="600" mb={3}>
              Ready to Transform Your Café Operations?
            </Typography>
            <Typography variant="body1" mb={4} color="rgba(255,255,255,0.9)">
              Join over 2,000 café owners who have simplified their operations with our system.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                backgroundColor: '#FFC107',
                '&:hover': { backgroundColor: '#FFA000' },
                px: 5,
                py: 1.5,
                borderRadius: '30px',
                fontSize: '1.1rem'
              }}
            >
              Start Free Trial
            </Button>
            <Typography variant="caption" display="block" mt={2} color="rgba(255,255,255,0.7)">
              No credit card required. 14-day free trial.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export { landingPageStyle };
export default LandingPage;