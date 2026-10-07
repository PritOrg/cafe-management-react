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
