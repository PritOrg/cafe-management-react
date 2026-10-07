import { describe, it, expect } from 'vitest';
import formatMoney, { formatMoneyMinor } from '../utils/formatMoney.js';

describe('formatMoney extended', () => {
    it('formats large INR amounts', () => {
        expect(formatMoney(123456.789)).toMatch(/1[,.]?23[,.]?456/);
    });

    it('withSymbol false strips currency symbol', () => {
        const out = formatMoney(50, { withSymbol: false });
        expect(out).not.toMatch(/₹/);
        expect(out).toContain('50');
    });

    it('negative and tiny values', () => {
        expect(formatMoney(-5)).toBeTruthy();
        expect(formatMoneyMinor(1)).toMatch(/0\.01|0,01/);
    });
});
