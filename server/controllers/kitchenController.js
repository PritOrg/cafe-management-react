const { sendResponse } = require('../middleware/auth');
const { getDb } = require('../db/pool');

/** Kitchen display: active orders (pending/preparing/ready) for expo line. */
exports.getActiveOrders = async (req, res) => {
    try {
        const rows = await getDb()('orders as o')
            .where('o.tenant_id', req.tenantId)
            .whereIn('o.status', ['pending', 'preparing', 'ready'])
            .orderBy('o.placed_at', 'asc')
            .limit(100);

        const orderIds = rows.map((r) => r.id);
        const itemRows = orderIds.length
            ? await getDb()('order_items as oi')
                .leftJoin('menu_items as mi', 'mi.id', 'oi.menu_item_id')
                .whereIn('oi.order_id', orderIds)
                .select('oi.*', 'mi.title as menu_title')
            : [];

        const byOrder = new Map();
        for (const it of itemRows) {
            if (!byOrder.has(it.order_id)) byOrder.set(it.order_id, []);
            byOrder.get(it.order_id).push({
                name: it.menu_title || 'Item',
                size: it.size,
                quantity: it.quantity,
                customizations: it.customizations || [],
                specialInstructions: it.special_instructions || '',
            });
        }

        const data = rows.map((o) => ({
            _id: o.id,
            orderNumber: o.order_number,
            status: o.status,
            tableNumber: o.table_number,
            placedAt: o.placed_at,
            minutesOpen: Math.floor((Date.now() - new Date(o.placed_at).getTime()) / 60000),
            items: byOrder.get(o.id) || [],
        }));

        return sendResponse(res, 200, true, 'Kitchen orders retrieved', data);
    } catch (err) {
        console.error('Error fetching kitchen orders:', err);
        return sendResponse(res, 500, false, 'Server error');
    }
};
