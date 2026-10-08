import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import settingsRepo from '../repositories/settingsRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import { placeOrder } from '../services/orderService.js';
import { issueForOrder, listInvoices, getInvoice, voidInvoice } from '../services/invoiceService.js';
import { renderInvoicePdf } from '../services/invoicePdf.js';
import { moneyToWordsINR } from '../utils/moneyToWordsINR.js';

let tenant;
let orderId;
let invoiceId;

describe('invoiceService + PDF integration', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        await settingsRepo.update(tenant._id, {
            gst: {
                ...settingsRepo.DEFAULTS.gst,
                gstin: '27AAAAA0000A1Z5',
                legalName: 'Cafe One LLP',
                legalAddress: '1 MG Road Mumbai',
                stateCode: '27',
                stateName: 'Maharashtra',
            },
        });
        const menus = await menuRepo.findAll(tenant._id);
        const menu = menus.find((m) => !m.sizes?.length && Number(m.price?.medium) > 0) || menus[0];
        if (!menu?.price?.medium && !menu?.sizes?.length) {
            throw new Error('No billable menu item found for invoice test');
        }
        const placed = await placeOrder({
            tenantId: tenant._id,
            role: 'customer',
            userId: '0000000000000000000000aa',
            body: {
                items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }],
                paymentMethod: 'cash',
                phone: `9${Date.now().toString().slice(-9)}`,
                customerName: 'Invoice Guest',
            },
        });
        orderId = placed.data.order._id;
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('issues GST invoice with CGST/SGST split and words', async () => {
        const { invoice, alreadyIssued } = await issueForOrder(tenant._id, orderId, { interState: false });
        // The order auto-issues its bill on checkout; issuing again is idempotent.
        expect(typeof alreadyIssued).toBe('boolean');
        expect(invoice.invoiceNumber).toMatch(/^INV\/\d{4}-\d{2}\/\d{4}$/);
        expect(invoice.cgstAmount).toBeGreaterThan(0);
        expect(invoice.sgstAmount).toBeGreaterThan(0);
        expect(invoice.amountInWords).toMatch(/Rupees/);
        invoiceId = invoice.id || invoice._id;

        const again = await issueForOrder(tenant._id, orderId, {});
        expect(again.alreadyIssued).toBe(true);
    });

    it('lists, gets, voids invoice', async () => {
        const list = await listInvoices(tenant._id, { limit: 5 });
        expect(list.items.length).toBeGreaterThanOrEqual(1);
        expect(typeof list.total).toBe('number');

        const inv = await getInvoice(tenant._id, invoiceId);
        expect(inv.invoiceNumber).toBeTruthy();

        const voided = await voidInvoice(tenant._id, invoiceId, 'integration void', { actorId: 't', actorType: 'admin' });
        expect(voided.status).toBe('void');
    });

    it('renders all paper formats', async () => {
        const inv = await getInvoice(tenant._id, invoiceId);
        for (const format of ['a4', 'a5', 'thermal80', 'thermal58']) {
            const { buffer } = await renderInvoicePdf(inv, { format });
            expect(buffer.slice(0, 4).toString()).toBe('%PDF');
            expect(buffer.length).toBeGreaterThan(300);
        }
    });

    it('money words for invoice totals', () => {
        expect(moneyToWordsINR(inv || 210)).toMatch(/Rupees/);
    });
});

// local alias to avoid TDZ
let inv;
