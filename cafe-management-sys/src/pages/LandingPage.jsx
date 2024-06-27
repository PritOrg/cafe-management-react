import React from 'react';
import { Container, Typography, Button, Box, useTheme, useMediaQuery } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import backgroundImage from '../assets/clem-onojeghuo-zlABb6Gke24-unsplash.jpg';
const landingPageStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    textAlign: 'center',
    margin: '10px 30px',
    borderRadius: 10,
    padding: '2rem',
    minHeight: '100vh',
};

const LandingPage = () => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

    const blurBoxStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // semi-transparent background
        backdropFilter: 'blur(10px)', // blur effect
        borderRadius: '10px',
        padding: isSmallScreen ? '1rem' : '2rem',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        maxWidth: '90%', // Ensures the box doesn't take up too much width on smaller screens
        margin: '0 auto', // Center the box
    };

    return (
        <Box>
            <Box sx={landingPageStyle}>
                <Container maxWidth="sm">
                    <Box sx={blurBoxStyle} color={'black'} gap={2}>
                        <HomeIcon sx={{ fontSize: isSmallScreen ? 30 : 50, marginBottom: 2 }} />
                        <Typography variant={isSmallScreen ? "h4" : isMediumScreen ? "h3" : "h2"} component="h1" gutterBottom>
                            Welcome to Cafe Management System
                        </Typography>
                        <Typography variant={isSmallScreen ? "body1" : "h5"} component="h2" gutterBottom>
                            Streamline your cafe operations with our powerful solution.
                        </Typography>
                        <Button variant="contained" color="primary" size={isSmallScreen ? "medium" : "large"}>
                            Get Started
                        </Button>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export { LandingPage, landingPageStyle };
