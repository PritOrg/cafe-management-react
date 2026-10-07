import { describe, it, expect } from 'vitest';
import money from '../utils/money.js';
import { mapSettings, mapActivity, mapInventory, mapOrder, mapOrderItem, mapDiscount, mapTable } from '../db/mappers.js';
import { requestId, REQUEST_ID_HEADER } from '../middleware/requestId.js';
import { globalErrorHandler, catchAsync } from '../middleware/errorHandler.js';

describe('coverage: money + mappers + middleware edges', () => {
    it('money addLine/fromMinor/roundHalfUp', () => {
        expect(money.addLine(250, 3)).toBe(750);
        expect(money.fromMinor(1050)).toBe(10.5);
        expect(money.roundHalfUp(2.4)).toBe(2);
        expect(money.roundHalfUp(2.6)).toBe(3);
        expect(money.applyBps(0, 500)).toBe(0);
    });

    it('mapSettings/mapActivity/mapInventory', () => {
        const s = mapSettings({ id: 's1', tenant_id: 't1', data: { a: 1 } });
        expect(s.data.a).toBe(1);
        const a = mapActivity({ id: 'a1', tenant_id: 't1', action: 'x', entity: 'e', meta: { k: 1 }, created_at: 'now' });
        expect(a.action).toBe('x');
        expect(a.meta.k).toBe(1);
        const i = mapInventory({ id: 'i1', tenant_id: 't1', item_name: 'Milk', quantity: '2.5', unit: 'L', category: 'Dairy' });
        expect(i.quantity).toBe(2.5);
        expect(i.itemName).toBe('Milk');
    });

    it('mapDiscount/mapTable/mapOrder/mapOrderItem', () => {
        const d = mapDiscount({ id: 'd1', code: 'X', discount_percentage: '10', max_discount_amount: '20', min_order_amount: '0', applicable_items: [] });
        expect(d.discountPercentage).toBe(10);
        const tb = mapTable({ id: 't1', number: 3, status: 'available' });
        expect(tb.number).toBe(3);
        const o = mapOrder({ id: 'o1', order_number: 'ORD-1', total_amount: '10', final_amount: '10.5', tip_amount: '0', discount_amount: '0', status: 'pending', payment_method: 'cash', payment_status: 'paid' }, { items: [] });
        expect(o.finalAmount).toBe(10.5);
        const li = mapOrderItem({ id: 'l1', menu_item_id: 'm1', size: 'medium', quantity: 1, customizations: [], item_price: '100', preparation_time: 2 }, { _id: 'm1', title: 'Latte' });
        expect(li.name).toBe('Latte');
        expect(li.price).toBe(100);
    });

    it('requestId rejects over-long id', () => {
        const req = { get: () => 'a'.repeat(200) };
        const res = { setHeader: (k, v) => { res[k] = v; } };
        requestId(req, res, () => {});
        expect(req.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(res[REQUEST_ID_HEADER]).toBe(req.id);
    });

    it('catchAsync forwards rejections', async () => {
        const handler = catchAsync(async () => { throw new Error('async boom'); });
        let caught = null;
        await handler({}, {}, (e) => { caught = e; });
        expect(caught.message).toBe('async boom');
    });

    it('globalErrorHandler dev path sends error object', () => {
        const prev = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        const res = { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
        globalErrorHandler({ message: 'boom', statusCode: 400 }, { method: 'GET', originalUrl: '/x', ip: '1', get: () => 'ua' }, res, () => {});
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('boom');
        process.env.NODE_ENV = prev;
    });
});
