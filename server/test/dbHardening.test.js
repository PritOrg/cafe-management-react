import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, destroyDb } from '../db/pool.js';
import tenantRepo from '../repositories/tenantRepo.js';

let tenant;

const expectRejected = async (promise, name) => {
    let err = null;
    try {
        await promise;
    } catch (e) {
        err = e;
    }
    expect(err, name).toBeTruthy();
    expect(String(err.code || err.message)).toMatch(/23|check|violat|foreign|22/i);
};

describe('production DB hardening constraints', () => {
    beforeAll(async () => {
        await getDb().raw('select 1');
        tenant = await tenantRepo.findBySlug('cafe1') || await tenantRepo.create({ slug: 'cafe1', name: 'Cafe One' });
    });

    afterAll(async () => {
        await destroyDb();
    });

    it('rejects invalid order status via CHECK constraint', async () => {
        await expectRejected(
            getDb()('orders').insert({
                tenant_id: tenant._id,
                order_number: `BAD-STATUS-${Date.now()}`,
                status: 'cooking',
                payment_method: 'cash',
                payment_status: 'paid',
                total_amount: 10,
                final_amount: 10,
            }),
            'invalid status',
        );
    });

    it('rejects invalid payment_method via CHECK constraint', async () => {
        await expectRejected(
            getDb()('orders').insert({
                tenant_id: tenant._id,
                order_number: `BAD-PAY-${Date.now()}`,
                status: 'pending',
                payment_method: 'bitcoin',
                payment_status: 'pending',
                total_amount: 10,
                final_amount: 10,
            }),
            'invalid payment method',
        );
    });

    it('rejects negative order totals via CHECK constraint', async () => {
        await expectRejected(
            getDb()('orders').insert({
                tenant_id: tenant._id,
                order_number: `BAD-NEG-${Date.now()}`,
                status: 'pending',
                payment_method: 'cash',
                payment_status: 'paid',
                total_amount: -5,
                final_amount: -5,
            }),
            'negative total',
        );
    });

    it('rejects invalid staff role via CHECK constraint', async () => {
        await expectRejected(
            getDb()('staff_admins').insert({
                tenant_id: tenant._id,
                first_name: 'Bad',
                last_name: 'Role',
                email: `badrole${Date.now()}@cafe1.local`,
                password: 'x',
                role: 'waiter',
            }),
            'invalid role',
        );
    });

    it('rejects invalid inventory movement type via CHECK constraint', async () => {
        const inv = await getDb()('inventory').insert({
            tenant_id: tenant._id,
            item_name: `Check inv ${Date.now()}`,
            quantity: 1,
            unit: 'x',
            category: 'c',
        }).returning('id');
        await expectRejected(
            getDb()('inventory_movements').insert({
                tenant_id: tenant._id,
                inventory_id: inv[0].id,
                type: 'theft',
                delta: -1,
            }),
            'invalid movement type',
        );
    });

    it('rejects zero quantity order item via CHECK constraint', async () => {
        const menu = await getDb()('menu_items').insert({
            tenant_id: tenant._id,
            title: `Qty0 ${Date.now()}`,
            sub_title: 'x',
            price_medium: 10,
            price_large: 10,
            category: 'Coffee',
        }).returning('id');
        const order = await getDb()('orders').insert({
            tenant_id: tenant._id,
            order_number: `QTY0-${Date.now()}`,
            status: 'pending',
            payment_method: 'cash',
            payment_status: 'paid',
            total_amount: 0,
            final_amount: 0,
        }).returning('id');
        await expectRejected(
            getDb()('order_items').insert({
                order_id: order[0].id,
                menu_item_id: menu[0].id,
                size: 'medium',
                quantity: 0,
                item_price: 0,
                preparation_time: 1,
            }),
            'zero quantity',
        );
    });

    it('rejects invalid invoice status via CHECK constraint', async () => {
        await expectRejected(
            getDb()('invoices').insert({
                tenant_id: tenant._id,
                order_id: '00000000-0000-0000-0000-000000000001',
                invoice_number: `BAD/${Date.now()}/0001`,
                fiscal_year: '2026-27',
                seq: 1,
                status: 'draft-x',
                grand_total: 10,
            }),
            'invalid invoice status',
        );
    });

    it('unique tenant order numbers still enforced', async () => {
        const menu = await getDb()('menu_items').where({ tenant_id: tenant._id }).first();
        const number = `UNIQ-${Date.now()}`;
        const base = {
            tenant_id: tenant._id,
            order_number: number,
            status: 'pending',
            payment_method: 'cash',
            payment_status: 'paid',
            total_amount: 10,
            final_amount: 10,
        };
        await getDb()('orders').insert(base);
        await expectRejected(getDb()('orders').insert(base), 'duplicate order_number');
        expect(menu).toBeTruthy();
    });

    it('hardening indexes exist', async () => {
        const rows = await getDb()('pg_indexes')
            .where({ schemaname: 'public' })
            .whereIn('indexname', [
                'orders_tenant_status_placed_idx',
                'activity_logs_tenant_action_idx',
                'inventory_tenant_lowstock_idx',
            ]);
        expect(rows.length).toBe(3);
    });
});
