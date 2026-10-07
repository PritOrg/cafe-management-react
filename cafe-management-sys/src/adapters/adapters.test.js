import { describe, it, expect } from 'vitest';
import formatMoney, { formatMoneyMinor } from '../utils/formatMoney.js';
import { adaptOrder, adaptMenuItem } from '../adapters/index.js';
import { unwrap } from '../services/api.js';

describe('frontend money + adapters + unwrap', () => {
    it('formatMoney INR', () => {
        expect(formatMoney(210)).toMatch(/210/);
        expect(formatMoney(21050, { minor: true })).toMatch(/210\.50|210,50/);
        expect(formatMoneyMinor(0)).toBeTruthy();
    });

    it('adaptOrder walk-in + customer', () => {
        const a = adaptOrder({ _id: '1', items: [] });
        expect(a.customer.name).toBe('Walk-in');
        const b = adaptOrder({
            _id: '2', orderNumber: 'ORD-1', finalAmount: 210,
            placedByCustomer: { firstName: 'Ada', lastName: 'L', email: 'a@b.c' },
            items: [{ itemPrice: 100, menuItem: { title: 'Latte' } }],
        });
        expect(b.customer.name).toBe('Ada L');
        expect(b.total).toBe(210);
        expect(b.items[0].name).toBe('Latte');
    });

    it('adaptMenuItem', () => {
        const m = adaptMenuItem({ _id: 'm', price: { medium: 120, large: 160 } });
        expect(m.priceMedium).toBe(120);
    });

    it('unwrap envelope vs raw', () => {
        expect(unwrap({ success: true, data: [1] })).toEqual([1]);
        expect(unwrap([1, 2])).toEqual([1, 2]);
        expect(unwrap(null)).toBe(null);
    });
});
