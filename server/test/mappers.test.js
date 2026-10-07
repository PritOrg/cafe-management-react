import { describe, it, expect } from 'vitest';
import {
    mapTenant,
    mapStaff,
    mapCustomer,
    mapMenuItem,
    mapOrder,
    mapOrderItem,
    toPublic,
} from '../db/mappers.js';

describe('mappers', () => {
    it('maps tenant snake_case to API shape', () => {
        const t = mapTenant({
            id: 't1', slug: 'cafe1', name: 'Cafe One', status: 'active',
            settings: { a: 1 }, created_at: '2026-01-01', updated_at: '2026-01-02',
        });
        expect(t._id).toBe('t1');
        expect(t.slug).toBe('cafe1');
        expect(t.settings).toEqual({ a: 1 });
    });

    it('strips password from staff/customer', () => {
        expect(toPublic({ id: 1, password: 'secret', email: 'a@b.c' })).toEqual({ id: 1, email: 'a@b.c' });
        const s = mapStaff({ id: 's1', password: 'x', first_name: 'A', last_name: 'B', email: 'a@b.c', role: 'staff', tenant_id: 't1', is_platform_admin: false });
        expect(s.password).toBeUndefined();
        expect(s.firstName).toBe('A');
        expect(s.isPlatformAdmin).toBe(false);
        const c = mapCustomer({ id: 'c1', password: 'x', first_name: 'C', last_name: 'D', email: 'c@d.e', tenant_id: 't1', loyalty_points: 10, membership_level: 'Gold' });
        expect(c.password).toBeUndefined();
        expect(c.loyaltyPoints).toBe(10);
        expect(c.membershipLevel).toBe('Gold');
    });

    it('maps menu price object', () => {
        const m = mapMenuItem({
            id: 'm1', tenant_id: 't1', title: 'Latte', sub_title: 'Hot',
            price_medium: '120.00', price_large: '160.00', category: 'Coffee',
            order_count: 3, tags: ['new'], allergens: [], customization_options: [],
        });
        expect(m.price).toEqual({ medium: 120, large: 160 });
        expect(m.subTitle).toBe('Hot');
        expect(m.orderCount).toBe(3);
    });

    it('maps order items with menu title fallback', () => {
        const item = mapOrderItem(
            { id: 'i1', menu_item_id: 'm1', size: 'medium', quantity: 2, customizations: ['x'], item_price: '90.00', preparation_time: 2, special_instructions: 'less hot' },
            { _id: 'm1', title: 'Croissant' }
        );
        expect(item.itemPrice).toBe(90);
        expect(item.name).toBe('Croissant');
        expect(item.customizations).toEqual(['x']);
    });

    it('maps order money fields as numbers', () => {
        const o = mapOrder({
            id: 'o1', tenant_id: 't1', order_number: 'ORD-1', total_amount: '200.00',
            final_amount: '210.00', tip_amount: '0', discount_amount: '0',
            status: 'pending', payment_method: 'cash', payment_status: 'paid',
        }, { items: [] });
        expect(o.totalAmount).toBe(200);
        expect(o.finalAmount).toBe(210);
        expect(o.orderNumber).toBe('ORD-1');
    });
});
