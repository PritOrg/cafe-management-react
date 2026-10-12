import { describe, it, expect } from 'vitest';
import { validateGstSettings } from '../services/invoiceService.js';

const COMPLETE = { gstin: '27AAAAA0000A1Z5', legalName: 'Cafe LLP', legalAddress: '1 MG Road', stateCode: '27' };

describe('validateGstSettings', () => {
    it('accepts complete, well-formed settings', () => {
        expect(validateGstSettings(COMPLETE)).toEqual({ ok: true });
    });

    it('rejects a malformed GSTIN with a clear message', () => {
        const r = validateGstSettings({ ...COMPLETE, gstin: '27AAAAA0000A1' });
        expect(r.ok).toBe(false);
        expect(r.message).toMatch(/GSTIN is invalid/i);
    });

    it('lists missing required fields', () => {
        const r = validateGstSettings({ gstin: '27AAAAA0000A1Z5' });
        expect(r.ok).toBe(false);
        expect(r.message).toMatch(/legalName, legalAddress, stateCode/);
    });

    it('rejects an empty settings object', () => {
        expect(validateGstSettings({}).ok).toBe(false);
    });
});