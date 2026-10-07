import { describe, it, expect } from 'vitest';
import formatMoney, { formatMoneyMinor } from '../utils/formatMoney';
import { adaptOrder, adaptMenuItem } from '../adapters';

describe('formatMoney', () => {
    it('formats INR with symbol', () => {
        const out = formatMoney(210);
        expect(out).toMatch(/₹|Rs/);
        expect(out).toContain('210');
    });

    it('formats minor units', () => {
        const out = formatMoney(21050, { minor: true });
        expect(out).toMatch(/210\.50|210,50/);
    });

    it('handles zero and empty', () => {
        expect(formatMoney(0)).toBeTruthy();
        expect(formatMoneyMinor(null)).toBeTruthy();
    });
});

describe('adapters', () => {
    it('adaptOrder maps customer + items', () => {
        const o = adaptOrder({
            _id: 'o1',
            orderNumber: 'ORD-1',
            finalAmount: 210,
            placedAt: '2026-10-06T10:00:00Z',
            placedByCustomer: { firstName: 'Ada', lastName: 'Lovelace', email: 'a@b.c' },
            items: [{ itemPrice: 100, menuItem: { title: 'Latte' }, quantity: 2 }],
        });
        expect(o.customer.name).toBe('Ada Lovelace');
        expect(o.total).toBe(210);
        expect(o.items[0].name).toBe('Latte');
        expect(o.items[0].price).toBe(100);
    });

    it('adaptOrder walk-in fallback', () => {
        const o = adaptOrder({ _id: 'x', items: [] });
        expect(o.customer.name).toBe('Walk-in');
        expect(o.orderNumber).toBeTruthy();
    });

    it('adaptMenuItem adds id and flat prices', () => {
        const m = adaptMenuItem({ _id: 'm1', title: 'Latte', price: { medium: 120, large: 160 } });
        expect(m.id).toBe('m1');
        expect(m.priceMedium).toBe(120);
        expect(m.priceLarge).toBe(160);
    });
});
