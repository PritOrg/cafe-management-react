import React from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import CoffeeCardComponent from '../components/CoffeeCardComponent';

const MenuPage = () => {
    const menuItems = [
        {
            "title": "Boba",
            "subTitle": "Tapioca pearl drink",
            "price": {
                "medium": 4.99,
                "large": 5.99
            },
            "category": "Drinks",
            "imageUrl": "https://firebasestorage.googleapis.com/v0/b/cafe-management-2c495.appspot.com/o/profile-photos%2Fmenu-img%2Fboba.webp?alt=media&token=e032b132-6138-4a29-b6ef-5431e4a9d1ef",
            "availability": true,
            "calories": 300,
            "customizationOptions": ["Extra Pearls", "Less Sugar"],
            "preparationTime": 10,
            "rating": 4.5,
            "reviews": [],
            "tags": ["new"],
            "allergens": ["Dairy"]
        },
        {
            "title": "Brighton",
            "subTitle": "Brighton special drink",
            "price": {
                "medium": 5.99,
                "large": 6.99
            },
            "category": "Drinks",
            "imageUrl": "https://firebasestorage.googleapis.com/v0/b/cafe-management-2c495.appspot.com/o/profile-photos%2Fmenu-img%2Fbrighton.webp?alt=media&token=40031a2e-607d-4be2-ba6e-a19071e020de",
            "availability": true,
            "calories": 250,
            "customizationOptions": ["Extra Shot", "Oat Milk"],
            "preparationTime": 7,
            "rating": 4.7,
            "reviews": [],
            "tags": ["seasonal"],
            "allergens": ["None"]
        },
        {
            "title": "Brownie",
            "subTitle": "Chocolate brownie",
            "price": {
                "medium": 2.99,
                "large": 3.99
            },
            "category": "Desserts",
            "imageUrl": "https://firebasestorage.googleapis.com/v0/b/cafe-management-2c495.appspot.com/o/profile-photos%2Fmenu-img%2Fbrownie.webp?alt=media&token=b4ccafae-2f4f-4630-9209-3494bfda161b",
            "availability": true,
            "calories": 400,
            "customizationOptions": ["With Ice Cream", "Nuts"],
            "preparationTime": 5,
            "rating": 4.8,
            "reviews": [],
            "tags": ["bestseller"],
            "allergens": ["Nuts", "Gluten"]
        },
        {
            "title": "Café Au Lait",
            "subTitle": "Coffee with hot milk",
            "price": {
                "medium": 3.99,
                "large": 4.99
            },
            "category": "Drinks",
            "imageUrl": "https://firebasestorage.googleapis.com/v0/b/cafe-management-2c495.appspot.com/o/profile-photos%2Fmenu-img%2Fcaf%C3%A9%20_au_lait.webp?alt=media&token=38bc5bf2-0223-4b0a-b236-694c793a3c8b",
            "availability": true,
            "calories": 150,
            "customizationOptions": ["Soy Milk", "Almond Milk"],
            "preparationTime": 5,
            "rating": 4.6,
            "reviews": [],
            "tags": ["classic"],
            "allergens": ["Dairy"]
        },
        {
            "title": "Cappuccino",
            "subTitle": "Espresso with steamed milk foam",
            "price": {
                "medium": 3.49,
                "large": 4.49
            },
            "category": "Drinks",
            "imageUrl": "https://firebasestorage.googleapis.com/v0/b/cafe-management-2c495.appspot.com/o/profile-photos%2Fmenu-img%2Fcappuccino.webp?alt=media&token=b61ef672-ee08-45f6-b8ae-81e635c7cf72",
            "availability": true,
            "calories": 120,
            "customizationOptions": ["Extra Foam", "Cinnamon"],
            "preparationTime": 4,
            "rating": 4.7,
            "reviews": [],
            "tags": ["bestseller"],
            "allergens": ["Dairy"]
        },
    ]

    return (
        <Box>
            <Container maxWidth="md" sx={{ marginTop: '70px' }}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Menu
                </Typography>
            </Container>
            <Grid container spacing={1} rowGap={0}>
                {menuItems.map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item._id}>
                        <CoffeeCardComponent
                            key={item.title}
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
    );
};

export default MenuPage;
