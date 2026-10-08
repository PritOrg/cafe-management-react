import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const getPublic = vi.fn();

vi.mock('../services/api.js', () => ({
    settingsAPI: { getPublic: (...args) => getPublic(...args) },
    unwrap: (b) => (b && b.data !== undefined ? b.data : b),
}));

import { BrandProvider, useBrand } from '../contexts/BrandContext.jsx';

const renderBrand = () => {
    const wrapper = ({ children }) => <BrandProvider>{children}</BrandProvider>;
    return renderHook(() => useBrand(), { wrapper });
};

describe('BrandContext white-label', () => {
    it('loads brand title and colors from settings public API', async () => {
        getPublic.mockResolvedValue({
            success: true,
            data: {
                brand: { title: 'Tenant Coffee Co', primaryColor: '#123456', accentColor: '#654321' },
            },
        });
        const { result } = renderBrand();
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.brand.title).toBe('Tenant Coffee Co');
        expect(result.current.brand.primaryColor).toBe('#123456');
        expect(result.current.brand.accentColor).toBe('#654321');
    });

    it('falls back to defaults when API fails', async () => {
        getPublic.mockRejectedValue(new Error('offline'));
        const { result } = renderBrand();
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.brand.title).toBe('Restaurant');
        expect(result.current.brand.primaryColor).toBe('#ff6b35');
    });
});
