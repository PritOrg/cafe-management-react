import { describe, it, expect } from 'vitest';
import { renderInvoiceHtml, initialsOf } from '../services/invoicePrintHtml.js';

const baseInvoice = {
    invoiceNumber: 'INV/2026-27/0001',
    issuedAt: new Date('2026-10-01T10:00:00Z'),
    lineItems: [],
    brandSnapshot: { brand: { title: 'Maharashtra Grill' }, gst: {} },
};

describe('initialsOf', () => {
    it('takes two-initial monogram', () => {
        expect(initialsOf('Maharashtra Grill')).toBe('MG');
        expect(initialsOf('Cafe')).toBe('C');
        expect(initialsOf('')).toBe('CA');
    });
});

describe('invoice print monogram fallback', () => {
    it('renders a monogram circle when no logo is uploaded', () => {
        const html = renderInvoiceHtml(baseInvoice, { mode: 'a4' });
        expect(html).toContain('monogram');
        expect(html).toContain('MG');
        expect(html).not.toContain('brand-logo');
    });

    it('renders the logo image when one exists', () => {
        const html = renderInvoiceHtml(
            { ...baseInvoice, brandSnapshot: { brand: { title: 'X', logoUrl: 'https://ex.test/l.png' }, gst: {} } },
            { mode: 'a4' }
        );
        expect(html).toContain('brand-logo');
        expect(html).toContain('https://ex.test/l.png');
        expect(html).not.toContain('monogram');
    });
});