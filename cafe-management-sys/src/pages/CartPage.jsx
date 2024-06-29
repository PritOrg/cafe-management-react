import React, { useState, useContext } from 'react';
import { Container, Typography, Box, Grid, Button, TextField, MenuItem, Select, FormControl, InputLabel, Card, CardContent } from '@mui/material';
import CartContext from '../components/CartContext';
import HamsterLoader from '../components/Loader/HamsterLoader';

const CartPage = () => {
    const { cartItems, updateCartItem, removeCartItem, clearCart, calculateTotal } = useContext(CartContext);
    const [loading, setLoading] = useState(false);

    const handleUpdateCartItem = (cartItemId, updates) => {
        updateCartItem(cartItemId, updates);
    };

    const handleRemoveCartItem = (cartItemId) => {
        removeCartItem(cartItemId);
    };

    const handlePayment = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            handleSubmitOrder();
        }, 2000);
    };

    const handleSubmitOrder = () => {
        setLoading(true);
        fetch('http://localhost:4969/submit-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartItems),
        })
            .then(response => response.json())
            .then(data => {
                setLoading(false);
                clearCart();
                alert('Order submitted successfully');
            })
            .catch(error => {
                setLoading(false);
                console.error('Error submitting order:', error);
            });
    };
    return (
        <Box sx={{ minHeight: '100vh', padding: '20px' }}>
            <Container maxWidth="md">
                <Typography variant="h2" component="h1" gutterBottom>
                    Your Cart
                </Typography>
                {loading ? (
                    <HamsterLoader />
                ) : cartItems.length === 0 ? (
                    <Typography variant="h6">Your cart is empty.</Typography>
                ) : (
                    <>
                        <Grid container spacing={3}>
                            {cartItems.map((item) => (
                                <Grid item xs={12} key={item.cartItemId}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">{item.title}</Typography>
                                            <Typography variant="body1">{item.subTitle}</Typography>
                                            <FormControl fullWidth margin="normal">
                                                <InputLabel id={`size-label-${item.cartItemId}`}>Size</InputLabel>
                                                <Select
                                                    labelId={`size-label-${item.cartItemId}`}
                                                    value={item.selectedSize}
                                                    onChange={(e) => handleUpdateCartItem(item.cartItemId, { selectedSize: e.target.value })}
                                                >
                                                    <MenuItem value="Medium">Medium</MenuItem>
                                                    <MenuItem value="Large">Large</MenuItem>
                                                </Select>
                                            </FormControl>
                                            <TextField
                                                fullWidth
                                                label="Quantity"
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateCartItem(item.cartItemId, { quantity: Math.max(1, parseInt(e.target.value)) })}
                                                margin="normal"
                                                InputProps={{ inputProps: { min: 1 } }}
                                            />
                                            <Typography variant="body2">
                                                Price: ${(item.selectedSize === 'Large' && typeof item.price.large === 'number'
                                                    ? item.price.large
                                                    : (typeof item.price.medium === 'number' ? item.price.medium : 0)).toFixed(2)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                                                <Button variant="contained" color="secondary" onClick={() => handleRemoveCartItem(item.cartItemId)}>
                                                    Remove
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                            <Typography variant="h6">Total: ${calculateTotal()}</Typography>
                            <Button variant="contained" color="primary" onClick={handlePayment}>
                                Proceed to Payment
                            </Button>
                        </Box>
                    </>
                )}
            </Container>
        </Box>
    );
};

export default CartPage;