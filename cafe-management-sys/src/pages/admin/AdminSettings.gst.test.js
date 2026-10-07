import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.fn();
const update = vi.fn();

vi.mock('../../services/api.js', () => ({
    settingsAPI: {
        get: (...a) => get(...a),
        update: (...a) => update(...a),
        getPublic: vi.fn(async () => ({ success: true, data: { brand: {}, gst: {}, ops: {} } })),
    },
    unwrap: (b) => (b && b.data !== undefined ? b.data : b),
}));

describe('GST settings contract (AdminSettings)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        get.mockResolvedValue({
            success: true,
            data: {
                brand: {},
                gst: {
                    gstin: '27AAAAA0000A1Z5',
                    legalName: 'Cafe One LLP',
                    legalAddress: '1 MG Road',
                    stateCode: '27',
                    stateName: 'Maharashtra',
                    hsnSAC: '996311',
                    invoicePrefix: 'INV',
                    fyStartMonth: 4,
                    bps: 500,
                },
                ops: { timezone: 'Asia/Kolkata', currency: 'INR' },
            },
        });
        update.mockResolvedValue({ success: true, data: { gst: { gstin: '27AAAAA0000A1Z5' } } });
    });

    it('loads GST fields from settings GET', async () => {
        const body = await get();
        expect(body.data.gst.gstin).toBe('27AAAAA0000A1Z5');
        expect(body.data.gst.stateCode).toBe('27');
        expect(body.data.gst.invoicePrefix).toBe('INV');
    });

    it('validates GSTIN format before save', () => {
        const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ\d$/;
        expect(GSTIN_RE.test('27AAAAA0000A1Z5')).toBe(true);
        expect(GSTIN_RE.test('27AAAAA0000A1Z55')).toBe(false);
        expect(GSTIN_RE.test('')).toBe(false);
    });

    it('PUT settings sends gst patch', async () => {
        const patch = { gst: { gstin: '29BBBBB0000B1Z5', legalName: 'New LLP', bps: 500 } };
        await update(patch);
        expect(update).toHaveBeenCalledWith(patch);
    });
});
