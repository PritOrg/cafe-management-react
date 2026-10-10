import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { menuAPI, ordersAPI } from '../services/api';
import { findMenuItem } from '../hooks/useMenuData';
import { addToOutbox } from '../utils/orderOutbox';
import {
    normalizeSize,
    resolveSize,
    generateCartItemId,
    cartTotals,
    buildOrderItems,
    staleItemId,
} from '../utils/cartPricing';

const CartContext = createContext();

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

    const generateId = useCallback(
        (id, size, options) => generateCartItemId(id, size, options),
        []
    );

    const addToCart = useCallback(async (itemOrId, selectedOptions = {}, selectedSize = 'medium') => {
        setIsLoading(true);
        try {
            // Fast path: use the item we already have (from the card/dialog or the
            // session menu cache) instead of a network round-trip on every add.
            let item = typeof itemOrId === 'object' && itemOrId ? itemOrId : findMenuItem(itemOrId);
            if (!item) {
                const id = typeof itemOrId === 'object' ? itemOrId?._id : itemOrId;
                const body = await menuAPI.getById(id);
                item = body?.data ?? body;
            }
            if (!item || !item._id) {
                throw new Error('Menu item not found');
            }

            const id = item._id;
            const size = resolveSize(item, selectedSize);
            const cartItemId = generateId(id, size, selectedOptions);

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

            return cartItemId;
        } catch (error) {
            console.error('Error adding to cart:', error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [generateId]);

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

    const { subtotal: total, totalPrepTime } = useMemo(() => cartTotals(cartItems), [cartItems]);

    const createOrder = useCallback(async (paymentMethod, options = {}) => {
        setIsLoading(true);
        let orderData = null;
        try {
            const orderItems = buildOrderItems(cartItems);

            orderData = {
                items: orderItems,
                paymentMethod,
                // Idempotency key so offline replays never duplicate.
                clientOrderId: (typeof crypto !== 'undefined' && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            };

            if (options.tableNumber != null && options.tableNumber !== '') {
                orderData.tableNumber = Number(options.tableNumber);
            }
            if (options.tipAmount != null && options.tipAmount !== '') {
                orderData.tipAmount = Number(options.tipAmount) || 0;
            }
            if (options.phone) {
                orderData.phone = String(options.phone).trim();
            }
            if (options.customerName) {
                orderData.customerName = String(options.customerName).trim();
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
            const isNetwork = (typeof navigator !== 'undefined' && !navigator.onLine)
                || error.name === 'TypeError'
                || /failed to fetch|networkerror|load failed|network request failed/i.test(errorMessage);

            if (isNetwork && orderData) {
                // Queue for replay on reconnect (server dedupes via clientOrderId).
                try {
                    await addToOutbox({ clientOrderId: orderData.clientOrderId, orderData, createdAt: Date.now() });
                    if (typeof window !== 'undefined') window.dispatchEvent(new Event('outbox:changed'));
                } catch (queueError) {
                    console.error('Failed to queue offline order:', queueError);
                }
                clearCart();
                setOrderError('You appear to be offline — your order is queued and will be sent automatically.');
                setOrderConfirmation(null);
                throw new Error('Your order is queued and will be sent when you are back online.');
            }

            setOrderError(errorMessage);
            setOrderConfirmation(null);
            // A stored cart line may reference a menu item that no longer exists
            // (e.g. deleted after a menu/DB change). Drop just that line so a
            // retry succeeds and the customer can finish checkout.
            const staleId = staleItemId(errorMessage);
            if (staleId) {
                setCartItems(prev => prev.filter((it) => it._id !== staleId));
                setOrderError('One item in your cart is no longer available and was removed.');
            }
            throw new Error(
                staleId
                    ? 'An item in your cart is no longer available and was removed. Please review and try again.'
                    : errorMessage
            );
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
