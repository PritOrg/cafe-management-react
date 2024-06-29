import React, { createContext, useState } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = async (id, selectedOptions, selectedSize) => {
        try {
            const response = await axios.get('http://localhost:4969/menu/' + id);
            var item = response.data;

            const cartItemId = `${id}-${selectedSize}-${JSON.stringify(selectedOptions)}`;

            item = {
                ...item,
                cartItemId,
                selectedOptions,
                selectedSize,
                quantity: 1,
            };

            const existingItemIndex = cartItems.findIndex(
                (cartItem) => cartItem.cartItemId === cartItemId
            );

            if (existingItemIndex !== -1) {
                const updatedCartItems = [...cartItems];
                updatedCartItems[existingItemIndex].quantity += 1;
                setCartItems(updatedCartItems);
            } else {
                setCartItems((prevItems) => [...prevItems, item]);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const updateCartItem = (cartItemId, updates) => {
        setCartItems((prevItems) =>
            prevItems.map((item) => (item.cartItemId === cartItemId ? { ...item, ...updates } : item))
        );
        calculateTotal();
    };

    const removeCartItem = (cartItemId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.cartItemId !== cartItemId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            let itemPrice = 0;
            if (item.selectedSize === 'Large' && typeof item.priceLarge === 'number') {
                itemPrice = item.price.large;
            } else if (typeof item.price.medium === 'number') {
                itemPrice = item.price.medium;
            }

            const quantity = typeof item.quantity === 'number' ? item.quantity : 1;

            return total + (itemPrice * quantity);
        }, 0);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, updateCartItem, removeCartItem, clearCart, calculateTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;