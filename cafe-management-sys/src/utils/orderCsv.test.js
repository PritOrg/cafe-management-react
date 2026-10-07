import { describe, it, expect } from 'vitest';
import { escapeCsv, ordersToCsv } from './orderCsv.js';

describe('orderCsv utils', () => {
    it('builds header + rows from adapted orders', () => {
        const csv = ordersToCsv([
            {
                orderNumber: 'ORD-1',
                status: 'served',
                customer: { name: 'Ada Lovelace', phone: '999' },
                items: [{ quantity: 2, name: 'Latte' }, { quantity: 1, name: 'Croissant, flaky' }],
                totalAmount: 240,
                finalAmount: 252,
                paymentMethod: 'cash',
                placedAt: '2026-10-06T10:00:00Z',
            },
        ]);
        const rows = csv.split('\n');
        expect(rows[0]).toContain('orderNumber');
        expect(rows[0]).toContain('finalAmount');
        expect(rows[1]).toContain('ORD-1');
        expect(rows[1]).toContain('Ada Lovelace');
        // items column is CSV-quoted because item names can contain commas
        expect(rows[1]).toContain('2x Latte; 1x Croissant, flaky');
    });

    it('escapes quotes and newlines', () => {
        const csv = ordersToCsv([
            {
                orderNumber: 'ORD-2',
                status: 'pending',
                customer: { name: 'Quote "Q"', phone: '1' },
                items: [{ quantity: 1, name: 'Line\nBreak' }],
                totalAmount: 10,
                finalAmount: 10,
            },
        ]);
        expect(csv).toContain('"Quote ""Q"""');
        // newline inside quoted CSV field is valid
        expect(csv).toMatch(/"1x Line\s+Break"/);
    });

    it('handles empty orders list', () => {
        const csv = ordersToCsv([]);
        expect(csv.split('\n').length).toBe(1);
        expect(csv).toContain('orderNumber');
    });

    it('escapeCsv quoting rules', () => {
        expect(escapeCsv('plain')).toBe('plain');
        expect(escapeCsv('a,b')).toBe('"a,b"');
        expect(escapeCsv(null)).toBe('');
        expect(escapeCsv(42)).toBe('42');
    });
});
