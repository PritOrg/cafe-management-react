import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import CoffeeCardComponent from '../components/CoffeeCardComponent';
import backgroundImage from '../assets/cafe-background.jpg';
const MenuPage = () => {
    const [menuItems, setMenuItems] = useState([]); // Initialize with an empty array
    const backgroundStyle = {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        width:'100%', // Ensure it covers the full viewport height
        paddingTop: '70px', // To adjust for any fixed header
    };
    useEffect(() => {
        fetch('http://localhost:4969/menu')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setMenuItems(data);
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });
    }, []);

    return (
        <Box sx={backgroundStyle}>
            <Container maxWidth="md" sx={{ marginTop: '70px' }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Menu
                </Typography>
            </Container>
            <Box sx={{ margin: 5 }}>
                <Grid container spacing={3} rowGap={0}>
                    {menuItems.map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item._id}>
                            <CoffeeCardComponent
                                title={item.title}
                                subTitle={item.subTitle}
                                price={item.price}
                                imageUrl={item.imageUrl}
                                preparationTime={item.preparationTime}
                                description={item.description || `Enjoy our delicious ${item.title} which includes ${item.subTitle}.`}
                                customizationOptions={item.customizationOptions}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default MenuPage;
