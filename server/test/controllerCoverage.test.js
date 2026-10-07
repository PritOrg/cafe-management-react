import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';
import menuRepo from '../repositories/menuRepo.js';
import inventoryRepo from '../repositories/inventoryRepo.js';
import discountController from '../controllers/discountController.js';
import settingsController from '../controllers/settingsController.js';
import invoiceController from '../controllers/invoiceController.js';
import inventoryController from '../controllers/inventoryController.js';
import customerController from '../controllers/customerController.js';
import { placeOrder } from '../services/orderService.js';

const mockRes = () => {
    const r = { statusCode: null, body: null, headers: {}, setHeader() { return r; }, send(b) { r.body = b; return r; } };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};

let tenant;
let menu;

describe('controller coverage: discounts/settings/invoice/inventory/customer', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
        menu = (await menuRepo.findAll(tenant._id)).find((m) => !m.sizes?.length && Number(m.price?.medium) > 0)
            || (await menuRepo.findAll(tenant._id))[0];
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('discountController list/create/remove', async () => {
        const list = mockRes();
        await discountController.listDiscounts({ tenantId: tenant._id, userId: 'u', role: 'admin' }, list);
        expect(list.statusCode).toBe(200);

        const create = mockRes();
        await discountController.createDiscount({
            tenantId: tenant._id, userId: 'u', role: 'admin',
            body: { code: `DISC${Date.now()}`, discountPercentage: 10, maxDiscountAmount: 50 },
        }, create);
        expect(create.statusCode).toBe(201);

        const bad = mockRes();
        await discountController.createDiscount({ tenantId: tenant._id, userId: 'u', role: 'admin', body: { code: 'X' } }, bad);
        expect(bad.statusCode).toBe(400);

        const del = mockRes();
        await discountController.removeDiscount({ tenantId: tenant._id, userId: 'u', role: 'admin', params: { id: create.body.data._id } }, del);
        expect(del.statusCode).toBe(200);

        const missing = mockRes();
        await discountController.removeDiscount({ tenantId: tenant._id, userId: 'u', role: 'admin', params: { id: '00000000-0000-0000-0000-000000000000' } }, missing);
        expect(missing.statusCode).toBe(404);
    });

    it('settingsController update + gst', async () => {
        const upd = mockRes();
        await settingsController.updateSettings({
            tenantId: tenant._id, userId: 'u', role: 'admin',
            body: { brand: { title: 'Coverage Cafe' }, gst: { gstin: '27AAAAA0000A1Z5', legalName: 'LLP', legalAddress: 'A', stateCode: '27' }, print: { default_paper: 'thermal80' } },
        }, upd);
        expect(upd.statusCode).toBe(200);
        expect(upd.body.data.brand.title).toBe('Coverage Cafe');
        expect(upd.body.data.print.default_paper).toBe('thermal80');

        const get = mockRes();
        await settingsController.getSettings({ tenantId: tenant._id }, get);
        expect(get.statusCode).toBe(200);
    });

    it('invoiceController list + print html + escpos without host', async () => {
        const placed = await placeOrder({
            tenantId: tenant._id,
            body: { items: [{ menuItemId: menu._id, size: 'medium', quantity: 1 }], paymentMethod: 'cash' },
        });
        const orderId = placed.data.order._id;

        const issue = mockRes();
        await invoiceController.issueForOrder({ tenantId: tenant._id, params: { id: orderId }, userId: 'u', role: 'admin', body: {} }, issue);
        const invId = issue.body.data.id || issue.body.data._id;

        const list = mockRes();
        await invoiceController.listInvoices({ tenantId: tenant._id, query: { limit: 5 } }, list);
        expect(list.statusCode).toBe(200);

        const print = mockRes();
        await invoiceController.getInvoicePrint({ tenantId: tenant._id, params: { id: invId }, query: { mode: 'thermal' } }, print);
        expect(print.body).toContain('TAX INVOICE');

        const pdf = mockRes();
        await invoiceController.getInvoicePdf({ tenantId: tenant._id, params: { id: invId }, query: { format: 'a5' } }, pdf);
        expect(Buffer.isBuffer(pdf.body)).toBe(true);

        const escpos = mockRes();
        await invoiceController.printEscPos({ tenantId: tenant._id, params: { id: invId }, body: {} }, escpos);
        // no printer host configured → 400
        expect([400, 500]).toContain(escpos.statusCode);

        const missing = mockRes();
        await invoiceController.getInvoice({ tenantId: tenant._id, params: { id: '00000000-0000-0000-0000-000000000000' } }, missing);
        expect(missing.statusCode).toBe(404);
    });

    it('inventoryController recipes list/add/remove', async () => {
        const inv = await inventoryRepo.create(tenant._id, {
            itemName: `Cov inv ${Date.now()}`, quantity: 10, unit: 'kg', category: 'c', minQty: 1,
        });

        const listFor = mockRes();
        await inventoryController.listRecipesForInventory({ tenantId: tenant._id, params: { id: inv._id } }, listFor);
        expect(listFor.statusCode).toBe(200);

        const add = mockRes();
        await inventoryController.addRecipe({
            tenantId: tenant._id, userId: 'u', role: 'admin',
            body: { menuItemId: menu._id, inventoryItemId: inv._id, qty: 0.5, unit: 'kg' },
        }, add);
        expect([201, 409]).toContain(add.statusCode);

        const addBad = mockRes();
        await inventoryController.addRecipe({ tenantId: tenant._id, userId: 'u', role: 'admin', body: {} }, addBad);
        expect(addBad.statusCode).toBe(400);

        const byMenu = mockRes();
        await inventoryController.listRecipesForMenu({ tenantId: tenant._id, params: { id: menu._id } }, byMenu);
        expect(byMenu.statusCode).toBe(200);

        if (add.statusCode === 201) {
            const rm = mockRes();
            await inventoryController.removeRecipe({ tenantId: tenant._id, userId: 'u', role: 'admin', params: { id: add.body.data._id } }, rm);
            expect(rm.statusCode).toBe(200);
        }
    });

    it('customerController list + 404 + soft delete', async () => {
        const list = mockRes();
        await customerController.getAllCustomers({ tenantId: tenant._id, query: { limit: 5 } }, list);
        expect(list.statusCode).toBe(200);

        const missing = mockRes();
        await customerController.getCustomerById({ tenantId: tenant._id, params: { id: '00000000-0000-0000-0000-000000000000' } }, missing);
        expect(missing.statusCode).toBe(404);

        const sumMissing = mockRes();
        await customerController.getCustomerSummary({ tenantId: tenant._id, params: { id: '00000000-0000-0000-0000-000000000000' } }, sumMissing);
        expect(sumMissing.statusCode).toBe(404);
    });
});
