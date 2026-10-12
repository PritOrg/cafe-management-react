import { describe, it, expect } from 'vitest';
import { ORDER_STATUSES, PAYMENT_METHODS, ORDER_STATUS_TRANSITIONS } from '../constants/order.js';

describe('order status machine', () => {
    it('exposes the canonical statuses', () => {
        expect(ORDER_STATUSES).toEqual(['pending', 'preparing', 'ready', 'served', 'cancelled']);
    });

    it('allows the forward pipeline and cancel from actionable states', () => {
        const next = (s, t) => (ORDER_STATUS_TRANSITIONS[s] || []).includes(t);
        expect(next('pending', 'preparing')).toBe(true);
        expect(next('preparing', 'ready')).toBe(true);
        expect(next('ready', 'served')).toBe(true);
        expect(next('pending', 'cancelled')).toBe(true);
        expect(next('preparing', 'cancelled')).toBe(true);
        expect(next('ready', 'cancelled')).toBe(true);
    });

    it('never allows skips or regressions', () => {
        const next = (s, t) => (ORDER_STATUS_TRANSITIONS[s] || []).includes(t);
        expect(next('pending', 'served')).toBe(false); // skip
        expect(next('ready', 'preparing')).toBe(false); // regress
        expect(next('served', 'preparing')).toBe(false);
    });

    it('is terminal in served/cancelled', () => {
        expect(ORDER_STATUS_TRANSITIONS.served).toEqual([]);
        expect(ORDER_STATUS_TRANSITIONS.cancelled).toEqual([]);
    });

    it('keeps payment methods canonical and finite', () => {
        expect(PAYMENT_METHODS).toEqual(['cash', 'upi_manual', 'card_manual']);
    });
});