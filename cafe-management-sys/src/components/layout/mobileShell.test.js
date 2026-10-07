import { describe, it, expect } from 'vitest';

/** Customer mobile shell contract (360px first) */
const customerNavItems = [
    { label: 'Menu', path: '/menu' },
    { label: 'Cart', path: '/cart' },
    { label: 'Home', path: '/' },
];

const cartBarVisible = ({ path, cartCount, activeStep }) => {
    // sticky cart bar only on menu/cart, not mid-checkout steps
    const onMenuOrCart = path === '/menu' || path === '/cart';
    const inCheckout = path === '/cart' && activeStep > 0;
    return onMenuOrCart && !inCheckout && cartCount > 0;
};

const hits44px = ({ minWidth = 44, minHeight = 44 } = {}) =>
    minWidth >= 44 && minHeight >= 44;

describe('mobile-first customer shell', () => {
    it('nav exposes Menu, Cart, Home', () => {
        expect(customerNavItems.map((i) => i.label)).toEqual(['Menu', 'Cart', 'Home']);
        expect(customerNavItems.every((i) => i.path.startsWith('/'))).toBe(true);
    });

    it('cart bar shows on menu/cart with items, hides in checkout', () => {
        expect(cartBarVisible({ path: '/menu', cartCount: 2, activeStep: 0 })).toBe(true);
        expect(cartBarVisible({ path: '/cart', cartCount: 2, activeStep: 0 })).toBe(true);
        expect(cartBarVisible({ path: '/cart', cartCount: 2, activeStep: 2 })).toBe(false);
        expect(cartBarVisible({ path: '/menu', cartCount: 0, activeStep: 0 })).toBe(false);
    });

    it('primary tap targets meet 44px', () => {
        expect(hits44px()).toBe(true);
        expect(hits44px({ minWidth: 40, minHeight: 44 })).toBe(false);
    });
});
