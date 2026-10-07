import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckoutFlow } from '../hooks/useCheckoutFlow.js';
import { AuthProvider, useAuth } from '../contexts/AuthContext.jsx';

const renderAuth = () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    return renderHook(() => useAuth(), { wrapper });
};

describe('useCheckoutFlow', () => {
    it('defaults to cash and navigates steps', () => {
        const { result } = renderHook(() => useCheckoutFlow(async () => {}));
        expect(result.current.paymentMethod).toBe('cash');
        act(() => result.current.handleNext());
        expect(result.current.activeStep).toBe(1);
        act(() => result.current.handleBack());
        expect(result.current.activeStep).toBe(0);
        act(() => result.current.setPaymentMethod('upi_manual'));
        expect(result.current.paymentMethod).toBe('upi_manual');
    });

    it('handleCheckout calls createOrder and opens dialog', async () => {
        const createOrder = vi.fn().mockResolvedValue({});
        const { result } = renderHook(() => useCheckoutFlow(createOrder));
        await act(async () => {
            await result.current.handleCheckout();
        });
        expect(createOrder).toHaveBeenCalledWith('cash');
        expect(result.current.openDialog).toBe(true);
    });
});

describe('AuthContext', () => {
    it('login stores staff session and exposes isStaff', () => {
        sessionStorage.clear();
        localStorage.clear();
        const { result } = renderAuth();
        act(() => {
            result.current.login({ firstName: 'A', lastName: 'B', role: 'staff', email: 'a@b.c' }, 'tok123', 'staffOrAdmin');
        });
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isStaff()).toBe(true);
        expect(result.current.getAuthToken()).toBe('tok123');
        expect(sessionStorage.getItem('token')).toBe('tok123');

        act(() => result.current.logout());
        expect(result.current.isAuthenticated).toBe(false);
        expect(sessionStorage.getItem('token')).toBe(null);
    });

    it('isPlatformAdmin flag', () => {
        sessionStorage.clear();
        const { result } = renderAuth();
        act(() => {
            result.current.login({ email: 'p@x.y', role: 'admin', isPlatformAdmin: true }, 'pt', 'staffOrAdmin');
        });
        expect(result.current.isPlatformAdmin()).toBe(true);
        expect(result.current.isAdmin()).toBe(true);
    });
});
