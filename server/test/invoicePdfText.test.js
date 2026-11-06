import { describe, it, expect } from 'vitest';
import { renderInvoicePdf } from '../services/invoicePdf.js';
import { PDFParse } from 'pdf-parse';

const sampleInvoice = {
    invoiceNumber: 'INV/2026-27/0001',
    fiscalYear: '2026-27',
    status: 'issued',
    placeOfSupply: 'Maharashtra',
    interState: false,
    taxableAmount: 1000,
    cgstAmount: 50,
    sgstAmount: 50,
    igstAmount: 0,
    roundOff: 0,
    grandTotal: 1050,
    tipAmount: 0,
    amountInWords: 'Rupees One Thousand Fifty Only',
    issuedAt: new Date('2026-10-01T12:00:00Z').toISOString(),
    brandSnapshot: {
        brand: { title: 'Cafe Management', logoUrl: '', primaryColor: '#ff6b35', accentColor: '#f7931e' },
        gst: { gstin: '27AAAAA0000A1Z5', legalName: 'Cafe Management Pvt Ltd', legalAddress: '1 MG Road, Bangalore, Karnataka 560001', stateCode: '27', stateName: 'Karnataka', hsnSAC: '996311', invoicePrefix: 'INV' },
    },
    lineItems: [
        { description: 'Espresso', hsnSac: '996311', sacCode: '996311', quantity: 2, unit: 'cup', taxable: 200, rate: 500, taxAmount: 20, amount: 220 },
        { description: 'Cappuccino', hsnSac: '996311', sacCode: '996311', quantity: 2, unit: 'cup', taxable: 150, rate: 750, taxAmount: 30, amount: 330 },
    ],
};

describe('Invoice PDF text extraction', () => {
    it('PDF contains invoice number, GSTIN, place of supply, HSN summary, amount in words', async () => {
        const { buffer } = await renderInvoicePdf(sampleInvoice, { format: 'a4' });
        const text = (await new PDFParse({ data: buffer }).getText()).text;

        expect(text).toContain('INV/2026-27/0001');
        expect(text).toContain('27AAAAA0000A1Z5');
        expect(text).toContain('Maharashtra');
        expect(text).toContain('996311');
        expect(text).toContain('Rupees One Thousand Fifty Only');
        expect(text).toContain('Cafe Management');
    });

    it('PDF buffer is valid PDF format', async () => {
        const { buffer } = await renderInvoicePdf(sampleInvoice, { format: 'a4' });
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(1000);
        expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    });

    it('includes line items in PDF text', async () => {
        const { buffer } = await renderInvoicePdf(sampleInvoice, { format: 'a4' });
        const text = (await new PDFParse({ data: buffer }).getText()).text;
        expect(text).toContain('Espresso');
        expect(text).toContain('Cappuccino');
    });
});
