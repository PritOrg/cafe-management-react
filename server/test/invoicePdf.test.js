import { describe, it, expect } from 'vitest';
import { renderInvoicePdf, FORMATS } from '../services/invoicePdf.js';

const sampleInvoice = {
    invoiceNumber: 'INV/2026-27/0001',
    fiscalYear: '2026-27',
    status: 'issued',
    placeOfSupply: 'Maharashtra',
    interState: false,
    taxableAmount: 200,
    cgstAmount: 5,
    sgstAmount: 5,
    igstAmount: 0,
    roundOff: 0,
    grandTotal: 210,
    tipAmount: 0,
    amountInWords: 'Rupees Two Hundred Ten Only',
    issuedAt: new Date('2026-10-06T12:00:00Z').toISOString(),
    brandSnapshot: {
        brand: { title: 'Cafe Day' },
        gst: { legalName: 'Cafe One LLP', gstin: '27AAAAA0000A1Z5', legalAddress: '1 MG Road' },
    },
    lineItems: [
        { description: 'House Latte', hsnSac: '996311', quantity: 2, taxable: 200, taxAmount: 10, amount: 210 },
    ],
};

describe('renderInvoicePdf layouts', () => {
    for (const format of ['a4', 'a5', 'thermal80', 'thermal58']) {
        it(`renders readable ${format} PDF`, async () => {
            const { buffer, filename, format: resolved } = await renderInvoicePdf(sampleInvoice, { format });
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(400);
            expect(buffer.slice(0, 4).toString()).toBe('%PDF');
            expect(filename).toContain(format === 'thermal80' ? '80mm' : format === 'thermal58' ? '58mm' : format);
            expect(resolved).toBe(FORMATS[format].key);
        });
    }

    it('58mm layout stays compact but valid', async () => {
        const { buffer } = await renderInvoicePdf(sampleInvoice, { format: 'thermal58' });
        expect(buffer.length).toBeGreaterThan(300);
    });
});
