import { describe, it, expect } from 'vitest';
import { escapeCsv, activityToCsv, ordersToCsv } from './orderCsv.js';

describe('activity CSV export', () => {
    it('builds activity header + rows', () => {
        const csv = activityToCsv([
            {
                action: 'order.place',
                entity: 'order',
                entityId: 'o1',
                actorType: 'staff',
                actorId: 'u1',
                requestId: 'req-1',
                createdAt: '2026-10-06T10:00:00Z',
                meta: { orderNumber: 'ORD-1' },
            },
        ]);
        const lines = csv.split('\n');
        expect(lines[0]).toContain('action');
        expect(lines[0]).toContain('entity');
        expect(lines[1]).toContain('order.place');
        expect(lines[1]).toContain('ORD-1');
    });

    it('handles empty activity list', () => {
        expect(activityToCsv([]).split('\n').length).toBe(1);
    });

    it('still exports orders csv', () => {
        expect(ordersToCsv([])).toContain('orderNumber');
        expect(escapeCsv('a,b')).toBe('"a,b"');
    });
});
