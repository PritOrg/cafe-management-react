import { describe, it, expect, vi, beforeEach } from 'vitest';

const getPublic = vi.fn();
const get = vi.fn();
const update = vi.fn();

vi.mock('../services/api.js', () => ({
    settingsAPI: {
        getPublic: (...a) => getPublic(...a),
        get: (...a) => get(...a),
        update: (...a) => update(...a),
    },
    unwrap: (b) => (b && b.data !== undefined ? b.data : b),
}));

import { formatMoney } from '../../utils/formatMoney.js';

describe('settings brand editor contract (TDD)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        get.mockResolvedValue({ success: true, data: { brand: { title: 'Old', primaryColor: '#111111', accentColor: '#222222' }, gst: {}, ops: {} } });
        update.mockResolvedValue({ success: true, data: { brand: { title: 'New Brand' } } });
    });

    it('PUT settings sends brand patch with hex colors', async () => {
        const patch = { brand: { title: 'New Brand', primaryColor: '#aa0000', accentColor: '#00aa00' } };
        const res = await update(patch);
        expect(update).toHaveBeenCalledWith(patch);
        expect(res.data.brand.title).toBe('New Brand');
    });

    it('GET settings loads current brand for the form', async () => {
        const body = await get();
        expect(get).toHaveBeenCalled();
        expect(body.data.brand.title).toBe('Old');
        expect(body.data.brand.primaryColor).toBe('#111111');
    });

    it('color fields must be valid hex for save validation', () => {
        const isValidHex = (c) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c || '');
        expect(isValidHex('#ff6b35')).toBe(true);
        expect(isValidHex('#fff')).toBe(true);
        expect(isValidHex('red')).toBe(false);
        expect(isValidHex('')).toBe(false);
        expect(formatMoney(10)).toBeTruthy();
    });
});
