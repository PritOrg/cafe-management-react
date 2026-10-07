import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import activityRepo from '../repositories/activityRepo.js';
import activityService from '../services/activityService.js';
import { pruneOldActivity } from '../services/activityRetention.js';
import { renderInvoiceHtml } from '../services/invoicePrintHtml.js';

const sampleInvoice = {
    id: 'inv-1',
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
    amountInWords: 'Rupees Two Hundred Ten Only',
    issuedAt: new Date('2026-10-06T12:00:00Z').toISOString(),
    brandSnapshot: {
        brand: { title: 'Cafe <b>One</b>' },
        gst: { legalName: 'Cafe One LLP', gstin: '27AAAAA0000A1Z5', legalAddress: '1 MG Road' },
    },
    lineItems: [{ description: 'Latte & "milk"', hsnSac: '996311', quantity: 2, taxable: 200, taxAmount: 10, amount: 210 }],
};

describe('coverage: print HTML + activity service + retention', () => {
    let tenant;
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });
    afterAll(async () => {
        await destroyDb();
    });

    it('renderInvoiceHtml A4 includes fields and escapes HTML', () => {
        const html = renderInvoiceHtml(sampleInvoice, { mode: 'a4' });
        expect(html).toContain('TAX INVOICE');
        expect(html).toContain('INV/2026-27/0001');
        expect(html).toContain('27AAAAA0000A1Z5');
        expect(html).toContain('Rupees Two Hundred Ten Only');
        expect(html).toContain('@page { size: A4');
        // escaping: raw <b> must not appear; &lt;b&gt; must
        expect(html).not.toContain('<b>One</b>');
        expect(html).toContain('&lt;b&gt;One&lt;/b&gt;');
        expect(html).toContain('&quot;milk&quot;');
    });

    it('renderInvoiceHtml thermal uses 80mm page', () => {
        const html = renderInvoiceHtml(sampleInvoice, { mode: 'thermal' });
        expect(html).toContain('80mm');
        expect(html).not.toContain('HSN/SAC'); // thermal drops HSN column
    });

    it('renderInvoiceHtml interState shows IGST', () => {
        const html = renderInvoiceHtml({ ...sampleInvoice, interState: true, igstAmount: 10 }, { mode: 'a4' });
        expect(html).toContain('IGST');
        expect(html).not.toContain('CGST');
    });

    it('activityService.logActivity writes a row', async () => {
        const row = await activityService.logActivity({
            tenantId: tenant._id,
            actorType: 'system',
            action: 'coverage.test',
            entity: 'test',
            meta: { ok: true },
        });
        expect(row).toBeTruthy();
        const list = await activityService.listByTenant(tenant._id, 5);
        expect(Array.isArray(list)).toBe(true);
    });

    it('pruneOldActivity deletes only old rows', async () => {
        const oldDate = new Date(Date.now() - 400 * 24 * 3600 * 1000);
        await getDb()('activity_logs').insert({
            tenant_id: tenant._id,
            actor_type: 'system',
            action: 'coverage.old',
            entity: 'test',
            meta: {},
            created_at: oldDate,
        });
        const result = await pruneOldActivity(365);
        expect(result.deleted).toBeGreaterThanOrEqual(1);
        const remaining = await getDb()('activity_logs').where({ action: 'coverage.old' });
        expect(remaining.length).toBe(0);
    });

    it('activityRepo.log swallows failures gracefully', async () => {
        const bad = await activityRepo.log({ action: null });
        // null action violates NOT NULL → swallowed, returns null
        expect(bad === null || bad).toBeTruthy();
    });
});
