import { describe, it, expect } from 'vitest';
import money from '../utils/money.js';
import { moneyToWordsINR } from '../utils/moneyToWordsINR.js';

describe('money utils', () => {
    it('converts to minor units', () => {
        expect(money.toMinor(10.5)).toBe(1050);
        expect(money.toMinor(0)).toBe(0);
        expect(money.toMinor(null)).toBe(0);
    });

    it('applies basis points', () => {
        expect(money.applyBps(10000, 500)).toBe(500);
        expect(money.applyBps(100, 500)).toBe(5);
    });

    it('splits CGST/SGST evenly', () => {
        expect(money.splitCgstSgst(101)).toEqual({ cgst: 51, sgst: 50 });
        expect(money.splitCgstSgst(100)).toEqual({ cgst: 50, sgst: 50 });
    });

    it('roundHalfUp finite', () => {
        expect(Number.isFinite(money.roundHalfUp('2.5'))).toBe(true);
    });

    it('TAX_BPS is 500 (5%)', () => {
        expect(money.TAX_BPS).toBe(500);
    });

    it('GST fixture: taxable ₹1000 at 5% -> CGST ₹25 + SGST ₹25 = ₹1050', () => {
        const taxableMinor = money.toMinor(1000); // ₹1000
        const taxMinor = money.applyBps(taxableMinor, 500); // ₹50
        const { cgst, sgst } = money.splitCgstSgst(taxMinor); // ₹25 + ₹25
        expect(money.fromMinor(cgst)).toBe(25);
        expect(money.fromMinor(sgst)).toBe(25);
        expect(money.fromMinor(taxableMinor + taxMinor)).toBe(1050);
    });

    it('IGST fixture: same taxable totals to the full tax, not a CGST/SGST split', () => {
        const taxableMinor = money.toMinor(1000);
        const igst = money.applyBps(taxableMinor, 500);
        expect(money.fromMinor(igst)).toBe(50); // full 5% as IGST
    });
});

describe('moneyToWordsINR', () => {
    it('renders rupees only', () => {
        expect(moneyToWordsINR(0)).toBe('Rupees Zero Only');
        expect(moneyToWordsINR(210)).toMatch(/Two Hundred Ten/);
    });

    it('handles lakh/crore and paise', () => {
        expect(moneyToWordsINR(100000)).toMatch(/Lakh/);
        expect(moneyToWordsINR(10000000)).toMatch(/Crore/);
        expect(moneyToWordsINR(210.5)).toMatch(/Paise/);
    });
});
