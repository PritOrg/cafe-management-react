import { describe, it, expect } from 'vitest';
import { validateGstSettings } from '../services/invoiceService.js';
import { fiscalYear, DEFAULTS } from '../repositories/settingsRepo.js';
import { FORMATS, resolveFormat } from '../services/invoicePdf.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../constants/order.js';

describe('invoiceService.validateGstSettings', () => {
    const base = { ...DEFAULTS.gst };

    it('rejects missing GST fields', () => {
        const r = validateGstSettings({ ...base, gstin: '', legalName: '', legalAddress: '', stateCode: '' });
        expect(r.ok).toBe(false);
        expect(r.message).toMatch(/incomplete/i);
    });

    it('rejects malformed GSTIN', () => {
        const r = validateGstSettings({ ...base, gstin: '123', legalName: 'X', legalAddress: 'Y', stateCode: '27' });
        expect(r.ok).toBe(false);
        expect(r.message).toMatch(/GSTIN/i);
    });

    it('accepts valid settings', () => {
        const r = validateGstSettings({
            ...base,
            gstin: '27AAAAA0000A1Z5',
            legalName: 'Cafe LLP',
            legalAddress: 'Addr',
            stateCode: '27',
        });
        expect(r.ok).toBe(true);
    });
});

describe('settingsRepo.fiscalYear', () => {
    it('Indian FY April-March', () => {
        expect(fiscalYear(new Date('2026-05-15T12:00:00Z'), 4)).toBe('2026-27');
        expect(fiscalYear(new Date('2026-02-10T12:00:00Z'), 4)).toBe('2025-26');
        expect(fiscalYear(new Date('2026-04-01T00:00:00Z'), 4)).toBe('2026-27');
        expect(fiscalYear(new Date('2026-03-31T23:59:00Z'), 4)).toBe('2025-26');
    });
});

describe('invoicePdf format resolution', () => {
    it('maps aliases to paper sizes', () => {
        expect(resolveFormat('a4').key).toBe('a4');
        expect(resolveFormat('a5').key).toBe('a5');
        expect(resolveFormat('thermal').key).toBe('thermal80');
        expect(resolveFormat('80mm').key).toBe('thermal80');
        expect(resolveFormat('58mm').key).toBe('thermal58');
        expect(resolveFormat(undefined).key).toBe('a4');
    });

    it('readability floors: body fonts stay readable', () => {
        for (const f of Object.values(FORMATS)) {
            expect(f.fontBody).toBeGreaterThanOrEqual(7.5);
            expect(f.lineGap).toBeGreaterThanOrEqual(10);
        }
        expect(FORMATS.thermal58.fontBody).toBeGreaterThanOrEqual(8.5);
        expect(FORMATS.thermal80.fontBody).toBeGreaterThanOrEqual(8.5);
        expect(FORMATS.a4.fontBody).toBeGreaterThanOrEqual(9.5);
    });
});

describe('order constants', () => {
    it('exposes canonical statuses and payment methods', () => {
        expect(ORDER_STATUSES).toContain('pending');
        expect(ORDER_STATUSES).toContain('served');
        expect(ORDER_STATUSES).not.toContain('completed');
        expect(PAYMENT_METHODS).toEqual(['cash', 'upi_manual', 'card_manual']);
    });
});
