import { describe, it, expect } from 'vitest';
import { authTextFieldSx, autocompleteFor } from '../../utils/adminNav.js';
import {
    ADMIN_NAV,
    CUSTOMER_NAV,
    adminNavItems,
    isAdminNavActive,
    matchAdminNav,
} from '../../constants/navigation.js';

describe('navigation config', () => {
    it('customer nav exposes home/menu/orders/cart', () => {
        expect(CUSTOMER_NAV.map((i) => i.key)).toEqual(['home', 'menu', 'orders', 'cart']);
    });

    it('admin active matching handles exact and prefix paths', () => {
        const dashboard = ADMIN_NAV.find((i) => i.href === '/admin');
        const menu = ADMIN_NAV.find((i) => i.href === '/admin/menu');

        expect(isAdminNavActive(dashboard, '/admin')).toBe(true);
        expect(isAdminNavActive(dashboard, '/admin/orders')).toBe(false);
        expect(isAdminNavActive(menu, '/admin/menu')).toBe(true);
        expect(isAdminNavActive(menu, '/admin/menu/add')).toBe(true);
    });

    it('keeps platform tenants only for platform admins', () => {
        expect(adminNavItems(false).map((i) => i.title)).not.toContain('Tenants');
        expect(adminNavItems(true).map((i) => i.title)).toContain('Tenants');
        expect(adminNavItems(true).length).toBeGreaterThan(adminNavItems(false).length);
    });

    it('resolves nested admin paths to their section', () => {
        expect(matchAdminNav('/admin/menu/add')?.title).toBe('Menu Items');
        expect(matchAdminNav('/admin/tenants')?.title).toBe('Tenants');
    });

    it('auth input props meet mobile a11y', () => {
        expect(authTextFieldSx['& .MuiInputBase-input'].fontSize).toBe('16px');
        expect(autocompleteFor('password')).toBe('current-password');
        expect(autocompleteFor('email')).toBe('email');
        expect(autocompleteFor('firstName')).toBe('given-name');
    });
});
