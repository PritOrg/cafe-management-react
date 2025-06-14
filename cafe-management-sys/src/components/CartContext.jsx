import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        // Initialize state with localStorage data to avoid hydration mismatch
        try {
            const storedCart = localStorage.getItem('cartItems');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error('Failed to parse cartItems from localStorage', error);
            return [];
        }
    });
    
    const [orderConfirmation, setOrderConfirmation] = useState(null);
    const [orderError, setOrderError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4969/api';

    // 💾 Save cart to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        } catch (error) {
            console.error('Failed to save cart to localStorage', error);
        }
    }, [cartItems]);

    // Memoized function to generate unique cart item ID
    const generateCartItemId = useCallback((id, selectedSize, selectedOptions) => {
        return `${id}-${selectedSize}-${Object.entries(selectedOptions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join('|')}`;
    }, []);

    const addToCart = useCallback(async (id, selectedOptions = {}, selectedSize = 'regular') => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/menu/${id}`);
            const item = response.data;

            const cartItemId = generateCartItemId(id, selectedSize, selectedOptions);

            setCartItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(
                    cartItem => cartItem.cartItemId === cartItemId
                );

                if (existingItemIndex !== -1) {
                    return prevItems.map((item, idx) =>
                        idx === existingItemIndex
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                }

                return [
                    ...prevItems,
                    {
                        ...item,
                        cartItemId,
                        selectedOptions,
                        selectedSize,
                        quantity: 1,
                    }
                ];
            });
        } catch (error) {
            console.error('Error adding to cart:', error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, generateCartItemId]);

    const updateCartItem = useCallback((cartItemId, updates) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.cartItemId === cartItemId ? { ...item, ...updates } : item
            )
        );
    }, []);

    const removeCartItem = useCallback((cartItemId) => {
        setCartItems(prevItems =>
            prevItems.filter(item => item.cartItemId !== cartItemId)
        );
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const { total, totalPrepTime } = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const size = item.selectedSize?.toLowerCase() || 'regular';
            const itemPrice = item.price?.[size] || 0;
            const quantity = item.quantity || 1;
            const prepTime = item.preparationTime || 0;
            
            return {
                total: acc.total + (itemPrice * quantity),
                totalPrepTime: acc.totalPrepTime + (prepTime * quantity)
            };
        }, { total: 0, totalPrepTime: 0 });
    }, [cartItems]);

    const createOrder = useCallback(async (paymentMethod) => {
        setIsLoading(true);
        try {
            const orderItems = cartItems.map(item => ({
                menuItem: item._id,
                quantity: item.quantity,
                selectedOptions: item.selectedOptions,
                selectedSize: item.selectedSize,
            }));

            const orderData = {
                tableNumber:5,
                items: orderItems,
                totalPrice: total,
                totalPreparationTime: totalPrepTime,
                tipAmount:5,
                paymentMethod,
                placedByCustomer:'66859c153e58a15304d57af9',
            };

            const response = await axios.post(`${API_URL}/orders`, orderData, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                },
            });

            setOrderConfirmation(response.data);
            setOrderError(null);
            clearCart();
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Order failed';
            setOrderError(errorMessage);
            setOrderConfirmation(null);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, cartItems, total, totalPrepTime, clearCart]);

    const contextValue = useMemo(() => ({
        cartItems,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        total,
        totalPrepTime,
        createOrder,
        orderConfirmation,
        orderError,
        isLoading,
        cartCount: cartItems.reduce((count, item) => count + (item.quantity || 1), 0)
    }), [
        cartItems,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
        total,
        totalPrepTime,
        createOrder,
        orderConfirmation,
        orderError,
        isLoading
    ]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;