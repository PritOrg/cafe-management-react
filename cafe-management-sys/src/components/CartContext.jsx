import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { menuAPI, ordersAPI } from '../services/api';

const CartContext = createContext();

const normalizeSize = (size) => {
    const s = String(size || '').toLowerCase();
    return s === 'large' ? 'large' : 'medium';
};

const resolveSize = (item, selectedSize) => {
    const sizes = item?.sizes || [];
    if (sizes.length) {
        if (selectedSize && sizes.some((s) => s.label === selectedSize)) return selectedSize;
        const def = sizes.find((s) => s.isDefault) || sizes[0];
        return def?.label || null;
    }
    return normalizeSize(selectedSize);
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
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

    useEffect(() => {
        try {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        } catch (error) {
            console.error('Failed to save cartItems to localStorage', error);
        }
    }, [cartItems]);

    const generateCartItemId = useCallback((id, selectedSize, selectedOptions) => {
        return `${id}-${selectedSize}-${Object.entries(selectedOptions || {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${value}`)
            .join('|')}`;
    }, []);

    const addToCart = useCallback(async (id, selectedOptions = {}, selectedSize = 'medium') => {
        setIsLoading(true);
        try {
            const body = await menuAPI.getById(id);
            const item = body?.data ?? body;
            if (!item || !item._id) {
                throw new Error('Menu item not found');
            }

            const size = resolveSize(item, selectedSize);
            const cartItemId = generateCartItemId(id, size, selectedOptions);

            setCartItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(
                    cartItem => cartItem.cartItemId === cartItemId
                );

                if (existingItemIndex !== -1) {
                    return prevItems.map((cartItem, idx) =>
                        idx === existingItemIndex
                            ? { ...cartItem, quantity: cartItem.quantity + 1 }
                            : cartItem
                    );
                }

                return [
                    ...prevItems,
                    {
                        ...item,
                        cartItemId,
                        selectedOptions,
                        selectedSize: size,
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
    }, [generateCartItemId]);

    const updateCartItem = useCallback((cartItemId, updates) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.cartItemId !== cartItemId) return item;
                const next = { ...item, ...updates };
                if (updates.selectedSize) {
                    next.selectedSize = normalizeSize(updates.selectedSize);
                }
                return next;
            })
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
            const sizes = item?.sizes || [];
            let itemPrice = 0;
            if (sizes.length) {
                const match = sizes.find((s) => s.label === item.selectedSize)
                    || sizes.find((s) => s.isDefault)
                    || sizes[0];
                itemPrice = Number(match?.price || 0);
            } else {
                itemPrice = Number(item.price?.[normalizeSize(item.selectedSize)] || 0);
            }
            const quantity = item.quantity || 1;
            const prepTime = item.preparationTime || 0;

            return {
                total: acc.total + (itemPrice * quantity),
                totalPrepTime: acc.totalPrepTime + (prepTime * quantity)
            };
        }, { total: 0, totalPrepTime: 0 });
    }, [cartItems]);

    const createOrder = useCallback(async (paymentMethod, options = {}) => {
        setIsLoading(true);
        try {
            const orderItems = cartItems.map(item => ({
                menuItem: item._id,
                size: resolveSize(item, item.selectedSize),
                quantity: item.quantity || 1,
                options: Object.entries(item.selectedOptions || {}).map(([name, value]) => ({
                    name: typeof value === 'string' ? value : name,
                    priceDelta: Number(value) || 0,
                })),
                specialInstructions: item.specialInstructions || '',
            }));

            const orderData = {
                items: orderItems,
                paymentMethod,
            };

            if (options.tableNumber != null && options.tableNumber !== '') {
                orderData.tableNumber = Number(options.tableNumber);
            }
            if (options.tipAmount != null && options.tipAmount !== '') {
                orderData.tipAmount = Number(options.tipAmount) || 0;
            }

            const body = await ordersAPI.create(orderData);
            const data = body?.data ?? body;

            setOrderConfirmation({
                orderNumber: data.orderNumber || data.order?.orderNumber,
                totalPreparationTime: data.totalPreparationTime ?? data.preparationTime,
                taxAmount: data.taxAmount,
                finalAmount: data.order?.finalAmount,
                order: data.order,
            });
            setOrderError(null);
            clearCart();
            return data;
        } catch (error) {
            const errorMessage = error.message || 'Order failed';
            setOrderError(errorMessage);
            setOrderConfirmation(null);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [cartItems, clearCart]);

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
