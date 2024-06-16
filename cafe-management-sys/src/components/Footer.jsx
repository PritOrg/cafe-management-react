import React from 'react';
import { Container, Grid, Typography, Link } from '@mui/material';

const Footer = () => {
    return (
        <footer style={{ backgroundColor: '#f0f0f0', padding: '2rem 0' }}>
            <Container>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Connect with Us</Typography>
                        <Typography>
                            Follow us on social media for updates and promotions:
                        </Typography>
                        <div>
                            <Link href="https://facebook.com">Facebook</Link>{' '}
                            <Link href="https://twitter.com">Twitter</Link>{' '}
                            <Link href="https://instagram.com">Instagram</Link>
                        </div>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Download Our Mobile App</Typography>
                        <Typography>
                            Get our app for exclusive deals and easy ordering:
                        </Typography>
                        <div>
                            <Link href="#">Download on the App Store</Link>{' '}
                            <Link href="#">Get it on Google Play</Link>
                        </div>
                    </Grid>
                </Grid>
                <hr style={{ margin: '2rem 0', borderColor: '#ccc' }} />
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Venice Location</Typography>
                        <Typography>123 Venice Street, Venice, Italy</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6">Paris Location</Typography>
                        <Typography>456 Paris Avenue, Paris, France</Typography>
                    </Grid>
                </Grid>
            </Container>
        </footer>
    );
};

export default Footer;
