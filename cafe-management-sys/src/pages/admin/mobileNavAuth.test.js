import { describe, it, expect } from 'vitest';
import { navMode, railItems, authTextFieldSx, autocompleteFor } from '../../utils/adminNav.js';

describe('admin tablet nav + auth mobile', () => {
    it('nav mode by width', () => {
        expect(navMode(360)).toBe('drawer');
        expect(navMode(768)).toBe('rail');
        expect(navMode(1024)).toBe('rail');
        expect(navMode(1280)).toBe('full');
    });

    it('rail keeps platform tenants only for platform admins', () => {
        expect(railItems(false)).not.toContain('Tenants');
        expect(railItems(true)).toContain('Tenants');
        expect(railItems(true).length).toBeGreaterThan(railItems(false).length);
    });

    it('auth input props meet mobile a11y', () => {
        expect(authTextFieldSx['& .MuiInputBase-input'].fontSize).toBe('16px');
        expect(autocompleteFor('password')).toBe('current-password');
        expect(autocompleteFor('email')).toBe('email');
        expect(autocompleteFor('firstName')).toBe('given-name');
    });
});
